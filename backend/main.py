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

import groq

from dotenv import load_dotenv

load_dotenv()

from agents import build_search_agent, build_reader_agent, writer_chain, critic_chain
from supabase_client import (
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
    save_chat_message,
    get_chat_messages,
    get_folders,
    create_folder,
    update_folder,
    delete_folder,
    update_session_folder,
)

# Groq Client specifically for Chat
GROQ_API_KEY_CHAT = os.getenv("GROQ_API_KEY_CHAT")
groq_client = groq.AsyncGroq(api_key=GROQ_API_KEY_CHAT)

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


class ChatMessageRequest(BaseModel):
    message: str


class FolderRequest(BaseModel):
    name: str
    user_id: str


class RenameFolderRequest(BaseModel):
    name: str


class UpdateSessionFolderRequest(BaseModel):
    folder_id: str | None


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

            from tools import web_search, exa_search
            # Bypass the conversational LLM agent to guarantee raw, structured results are saved
            search_content = web_search.invoke(req.topic)
            
            # Combine with Exa search if not in quick mode
            if req.depth == "academic":
                search_content += "\n" + exa_search.invoke({"query": req.topic, "academic": True})
            elif req.depth != "quick":
                search_content += "\n" + exa_search.invoke({"query": req.topic, "academic": False})

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
                from tools import web_scrapper, firecrawl_scraper
                for i in range(min(3, len(parsed_results))):
                    url = parsed_results[i].get("url")
                    if url:
                        try:
                            # Invoke tool directly for speed
                            if req.depth == "quick":
                                content = web_scrapper.invoke(url)
                            else:
                                content = firecrawl_scraper.invoke(url)
                                
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
                
            # Safely truncate research to strictly fit Groq Free Tier TPM limit (6000 tokens)
            MAX_CHARS = 12000
            if len(research_combined) > MAX_CHARS:
                research_combined = research_combined[:MAX_CHARS] + "\n\n...[Content Truncated to fit Groq Free Tier context window]..."


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
                "Elaborate extensively using the provided research. IMPORTANT: You have a strict maximum length limit. You must pace your writing so that you fully complete all 8 sections and provide a proper, complete ending. DO NOT cut off abruptly."
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


@app.post("/api/sessions/{session_id}/chat")
async def chat_with_assistant(session_id: str, req: ChatMessageRequest):
    """Stream a chat response using Llama-3.3-70B and session context."""
    # 1. Save user message
    save_chat_message(session_id, "user", req.message)

    # 2. Get session context
    detail = get_session_detail(session_id)
    search_results = get_search_results(session_id)
    
    if not detail:
        raise HTTPException(status_code=404, detail="Session not found")

    # Build context string
    context = f"Topic: {detail.get('topic')}\n\n"
    if detail.get('report_content'):
        context += f"Report:\n{detail.get('report_content')}\n\n"
    
    if search_results:
        context += "Sources:\n"
        for r in search_results:
            context += f"- {r.get('title')} ({r.get('url')}): {r.get('content_snippet')}\n"

    system_prompt = {
        "role": "system",
        "content": (
            "You are an expert research assistant. "
            "You are having a follow-up conversation with the user about a research report you just generated. "
            "Use the provided context (report and sources) to answer the user's questions. "
            "If the answer is not in the context, say you don't know based on the current research, but provide your best general knowledge if helpful.\n\n"
            f"=== RESEARCH CONTEXT ===\n{context}"
        )
    }

    # 3. Get history (limit to last 10 messages)
    history = get_chat_messages(session_id, limit=10)
    messages = [system_prompt]
    for msg in history:
        messages.append({"role": msg["role"], "content": msg["content"]})
    
    # ensure current message is in there (already in history because we saved it above)
    # Actually, get_chat_messages ordered by created_at DESC limit 10 will include the user message we just saved.
    # So we don't need to append it again.

    async def generate():
        full_response = ""
        try:
            stream = await groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                stream=True,
                temperature=0.3,
            )
            async for chunk in stream:
                content = chunk.choices[0].delta.content
                if content:
                    full_response += content
                    yield f"data: {json.dumps({'content': content})}\n\n"
            
            # 4. Save assistant response
            save_chat_message(session_id, "assistant", full_response)
            yield "data: [DONE]\n\n"
            
        except Exception as e:
            error_msg = str(e)
            print(f"Chat error: {error_msg}")
            yield f"data: {json.dumps({'error': error_msg})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.get("/api/sessions/{session_id}/chat")
def get_chat_history(session_id: str):
    """Get chat history for a session."""
    try:
        messages = get_chat_messages(session_id, limit=50)
        return {"messages": messages}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Folders API ───────────────────────────────────────────────

@app.get("/api/folders/{user_id}")
def api_get_folders(user_id: str):
    try:
        folders = get_folders(user_id)
        return {"folders": folders}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/folders")
def api_create_folder(req: FolderRequest):
    try:
        folder = create_folder(req.user_id, req.name)
        return {"folder": folder}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/folders/{folder_id}")
def api_update_folder(folder_id: str, req: RenameFolderRequest):
    try:
        folder = update_folder(folder_id, req.name)
        if not folder:
            raise HTTPException(status_code=404, detail="Folder not found")
        return {"folder": folder}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/folders/{folder_id}")
def api_delete_folder(folder_id: str):
    try:
        delete_folder(folder_id)
        return {"status": "deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/sessions/{session_id}/folder")
def api_update_session_folder(session_id: str, req: UpdateSessionFolderRequest):
    try:
        session = update_session_folder(session_id, req.folder_id)
        return {"session": session}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
