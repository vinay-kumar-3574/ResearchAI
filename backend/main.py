"""
FastAPI server that wraps the existing pipeline.py and exposes it as an API.
Saves all results to Supabase in real-time as each pipeline stage completes.
"""
import sys
import os
import json
import asyncio
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from dotenv import load_dotenv

load_dotenv()

# Add parent directory to path so we can import pipeline modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents import build_search_agent, build_reader_agent, writer_chain, critic_chain
from backend.supabase_client import (
    create_research_session,
    update_session_status,
    save_search_results,
    save_scraped_content,
    save_research_report,
    save_critic_review,
    get_user_sessions,
    get_session_detail,
    get_search_results,
    get_dashboard_stats,
    delete_session as db_delete_session,
)

app = FastAPI(title="ResearchAI API", version="1.0.0")

# CORS — allow frontend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ResearchRequest(BaseModel):
    topic: str
    user_id: str


class DeleteRequest(BaseModel):
    session_id: str


@app.get("/api/health")
def health():
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}


@app.post("/api/research/stream")
async def research_stream(req: ResearchRequest):
    """
    Runs the 4-stage research pipeline and streams stage updates via SSE.
    Each stage result is saved to Supabase as it completes.
    """

    async def event_generator():
        session_id = None
        try:
            # Create session in DB
            session_id = create_research_session(req.user_id, req.topic)
            yield f"data: {json.dumps({'stage': 'init', 'session_id': session_id, 'status': 'started'})}\n\n"

            # ── Stage 1: Search Agent ─────────────────────────────
            update_session_status(session_id, "searching")
            yield f"data: {json.dumps({'stage': 'search', 'status': 'running'})}\n\n"
            await asyncio.sleep(0)  # Yield control to flush

            search_agent = build_search_agent()
            search_result = search_agent.invoke({
                "messages": [("user", f"find recent and reliable information on {req.topic}.")]
            })
            search_content = search_result["messages"][-1].content

            # Parse and save search results to DB
            parsed_results = save_search_results(session_id, search_content)
            update_session_status(session_id, "searching",
                                  search_completed_at=datetime.now(timezone.utc).isoformat())

            yield f"data: {json.dumps({'stage': 'search', 'status': 'done', 'result_count': len(parsed_results), 'preview': search_content[:300]})}\n\n"

            # ── Stage 2: Reader Agent ─────────────────────────────
            update_session_status(session_id, "scraping")
            yield f"data: {json.dumps({'stage': 'read', 'status': 'running'})}\n\n"
            await asyncio.sleep(0)

            reader_agent = build_reader_agent()
            reader_result = reader_agent.invoke({
                "messages": [("user",
                              f"Based on the following search results about '{req.topic}', "
                              f"pick the most relevant URL and scrape it for deeper content.\n\n"
                              f"Search Results:\n{search_content[:1000]}  "
                              )]
            })
            scraped_content = reader_result["messages"][-1].content

            # Try to extract URL from search results for storage
            source_url = ""
            if parsed_results:
                source_url = parsed_results[0].get("url", "")

            save_scraped_content(session_id, scraped_content, source_url)
            update_session_status(session_id, "scraping",
                                  scrape_completed_at=datetime.now(timezone.utc).isoformat())

            yield f"data: {json.dumps({'stage': 'read', 'status': 'done', 'chars': len(scraped_content), 'url': source_url})}\n\n"

            # ── Stage 3: Writer Agent ─────────────────────────────
            update_session_status(session_id, "writing")
            yield f"data: {json.dumps({'stage': 'write', 'status': 'running'})}\n\n"
            await asyncio.sleep(0)

            research_combined = (
                f"SEARCH RESULTS : \n {search_content} \n\n"
                f"DETAILED SCRAPED CONTENT : \n {scraped_content}"
            )

            report = writer_chain.invoke({
                "topic": req.topic,
                "research": research_combined
            })

            save_research_report(session_id, report)
            update_session_status(session_id, "writing",
                                  report_completed_at=datetime.now(timezone.utc).isoformat())

            yield f"data: {json.dumps({'stage': 'write', 'status': 'done', 'preview': report[:200]})}\n\n"

            # ── Stage 4: Critic Agent ─────────────────────────────
            update_session_status(session_id, "critiquing")
            yield f"data: {json.dumps({'stage': 'critique', 'status': 'running'})}\n\n"
            await asyncio.sleep(0)

            feedback = critic_chain.invoke({
                "report": report
            })

            overall_score = save_critic_review(session_id, feedback)
            # Note: the trigger in triggers.sql auto-updates session status to 'completed'
            # and copies overall_score. But we also set it explicitly in case trigger isn't set up yet.
            update_session_status(
                session_id, "completed",
                overall_score=overall_score,
                critique_completed_at=datetime.now(timezone.utc).isoformat()
            )

            yield f"data: {json.dumps({'stage': 'critique', 'status': 'done', 'overall_score': overall_score})}\n\n"

            # ── Done ──────────────────────────────────────────────
            yield f"data: {json.dumps({'stage': 'complete', 'session_id': session_id, 'overall_score': overall_score})}\n\n"

        except Exception as e:
            error_msg = str(e)
            print(f"Pipeline error: {error_msg}")
            if session_id:
                update_session_status(session_id, "failed", error_message=error_msg)
            yield f"data: {json.dumps({'stage': 'error', 'error': error_msg, 'session_id': session_id})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.get("/api/sessions/{user_id}")
def get_sessions(user_id: str):
    """Get all research sessions for a user."""
    try:
        sessions = get_user_sessions(user_id)
        return {"sessions": sessions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/session/{session_id}")
def get_session(session_id: str):
    """Get full detail for a single research session."""
    try:
        detail = get_session_detail(session_id)
        search_results = get_search_results(session_id)
        return {"detail": detail, "search_results": search_results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/stats/{user_id}")
def get_stats(user_id: str):
    """Get dashboard stats for a user."""
    try:
        stats = get_dashboard_stats(user_id)
        return {"stats": stats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/session/{session_id}")
def delete_session_endpoint(session_id: str):
    """Delete a research session."""
    try:
        db_delete_session(session_id)
        return {"status": "deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
