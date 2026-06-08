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
    depth: str = "deep"


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

            from tools import web_search
            # Bypass the conversational LLM agent to guarantee raw, structured results are saved
            search_content = web_search.invoke(req.topic)

            # Parse and save search results to DB
            parsed_results = save_search_results(session_id, search_content)
            update_session_status(session_id, "searching",
                                  search_completed_at=datetime.now(timezone.utc).isoformat())

            yield f"data: {json.dumps({'stage': 'search', 'status': 'done', 'result_count': len(parsed_results), 'preview': search_content[:300]})}\n\n"

            # ── Stage 2: Reader Agent / Scraping ──────────────────────
            scraped_content = ""
            source_url = ""
            if req.depth == "deep":
                update_session_status(session_id, "scraping")
                yield f"data: {json.dumps({'stage': 'read', 'status': 'running'})}\n\n"
                await asyncio.sleep(0)

                # For deep dive, scrape top 3 URLs directly to gather massive context
                from tools import web_scrapper
                for i in range(min(3, len(parsed_results))):
                    url = parsed_results[i].get("url")
                    if url:
                        try:
                            # Invoke tool directly for speed
                            content = web_scrapper.invoke(url)
                            scraped_content += f"\n\n--- Source {i+1}: {url} ---\n{content}\n"
                            if i == 0: source_url = url
                        except:
                            pass

                save_scraped_content(session_id, scraped_content, source_url)
                update_session_status(session_id, "scraping",
                                      scrape_completed_at=datetime.now(timezone.utc).isoformat())

                yield f"data: {json.dumps({'stage': 'read', 'status': 'done', 'chars': len(scraped_content), 'url': source_url})}\n\n"
            else:
                yield f"data: {json.dumps({'stage': 'read', 'status': 'done', 'chars': 0, 'url': ''})}\n\n"

            # ── Stage 3: Writer Agent ─────────────────────────────
            update_session_status(session_id, "writing")
            yield f"data: {json.dumps({'stage': 'write', 'status': 'running'})}\n\n"
            await asyncio.sleep(0)

            research_combined = f"SEARCH RESULTS : \n {search_content} \n\n"
            if req.depth == "deep":
                research_combined += f"DETAILED SCRAPED CONTENT (Multiple Sources) : \n {scraped_content}"

            instructions = (
                "You are tasked with writing a BOOK-CHAPTER length report. You MUST output at least 1500 words. "
                "Do NOT write a short summary. You must strictly use the following structure and write at least 3 long, detailed paragraphs for EACH section:\n"
                "## 1. Executive Summary\n"
                "## 2. Historical Background & Context\n"
                "## 3. Deep Dive Analysis of Finding 1\n"
                "## 4. Deep Dive Analysis of Finding 2\n"
                "## 5. Deep Dive Analysis of Finding 3\n"
                "## 6. Deep Dive Analysis of Finding 4\n"
                "## 7. Implications & Future Outlook\n"
                "## 8. Comprehensive Conclusion\n"
                "Elaborate extensively using the provided research. DO NOT skip any sections."
                if req.depth == "deep" else
                "Write a fast, punchy summary consisting of an introduction, two key findings, and a brief conclusion. Keep it under 400 words. Do not make it too long."
            )

            report = writer_chain.invoke({
                "topic": req.topic,
                "research": research_combined,
                "instructions": instructions
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
