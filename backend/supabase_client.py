"""
Supabase client helpers for saving pipeline results to the database.
"""
import os
from supabase import create_client, Client
from dotenv import load_dotenv
import re
import json

load_dotenv()

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", os.getenv("AMON_KEY"))

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def create_research_session(user_id: str, topic: str) -> str:
    """Create a new research session row and return its UUID."""
    result = supabase.table("research_sessions").insert({
        "user_id": user_id,
        "topic": topic,
        "status": "pending"
    }).execute()
    return result.data[0]["id"]


def update_session_status(session_id: str, status: str, **extra):
    """Update a session's status and optional extra fields."""
    payload = {"status": status, **extra}
    supabase.table("research_sessions").update(payload).eq("id", session_id).execute()


def save_search_results(session_id: str, raw_search_content: str):
    """Parse the Search Agent output and save individual results."""
    # The search agent returns blocks like:
    # Title: ...\nURL: ...\n Content: ...
    blocks = raw_search_content.split("Title: ")
    rows = []
    for i, block in enumerate(blocks):
        if not block.strip():
            continue
        lines = block.strip().split("\n")
        title = lines[0].strip() if lines else ""
        url = ""
        content = ""
        for line in lines[1:]:
            if line.strip().startswith("URL:"):
                url = line.replace("URL:", "").strip()
            elif line.strip().startswith("Content:"):
                content = line.replace("Content:", "").strip()
            else:
                content += " " + line.strip()
        rows.append({
            "session_id": session_id,
            "title": title,
            "url": url,
            "content_snippet": content[:500],
            "result_order": i
        })
    if rows:
        supabase.table("search_results").insert(rows).execute()
    return rows


def save_scraped_content(session_id: str, scraped_text: str, source_url: str = ""):
    """Save the scraped content from the Reader Agent."""
    # Try to extract URL from the scraped content or agent messages
    supabase.table("scraped_contents").insert({
        "session_id": session_id,
        "source_url": source_url or "unknown",
        "content": scraped_text[:10000]  # Limit to prevent huge payloads
    }).execute()


def save_research_report(session_id: str, report_content: str):
    """Save the Writer Agent's report."""
    supabase.table("research_reports").insert({
        "session_id": session_id,
        "report_content": report_content
    }).execute()


def parse_critic_scores(review_text: str) -> dict:
    """
    Parse the structured critic output into individual scores.
    Expected format:
        Overall Score: X/10
        - Clarity: X/10
        - Research Depth: X/10
        etc.
    """
    scores = {
        "overall_score": 0,
        "clarity_score": 0,
        "research_depth_score": 0,
        "accuracy_score": 0,
        "analysis_insights_score": 0,
        "structure_score": 0,
        "source_quality_score": 0,
    }

    patterns = {
        "overall_score": r"Overall\s+Score:\s*([\d.]+)",
        "clarity_score": r"Clarity:\s*([\d.]+)",
        "research_depth_score": r"Research\s+Depth:\s*([\d.]+)",
        "accuracy_score": r"Accuracy:\s*([\d.]+)",
        "analysis_insights_score": r"Analysis\s*(?:&|and)?\s*Insights?:\s*([\d.]+)",
        "structure_score": r"Structure:\s*([\d.]+)",
        "source_quality_score": r"Source\s+Quality:\s*([\d.]+)",
    }

    for key, pattern in patterns.items():
        match = re.search(pattern, review_text, re.IGNORECASE)
        if match:
            try:
                scores[key] = float(match.group(1))
            except ValueError:
                pass

    return scores


def parse_critic_lists(review_text: str) -> dict:
    """Parse strengths, weaknesses, missing opportunities, and improvements from critic output."""

    def extract_section(text, section_name, next_sections):
        """Extract bullet points from a named section."""
        pattern = rf"{section_name}:\s*\n(.*?)(?={'|'.join(next_sections)}:|$)"
        match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
        if not match:
            return []
        items = []
        for line in match.group(1).strip().split("\n"):
            line = line.strip()
            if line.startswith("- ") or line.startswith("• "):
                items.append(line[2:].strip())
            elif re.match(r"^\d+\.\s+", line):
                items.append(re.sub(r"^\d+\.\s+", "", line).strip())
        return items

    strengths = extract_section(review_text, "Strengths",
                                ["Weaknesses", "Missing Opportunities", "Specific Improvements", "Final Verdict"])
    weaknesses = extract_section(review_text, "Weaknesses",
                                  ["Missing Opportunities", "Specific Improvements", "Final Verdict"])
    missing = extract_section(review_text, "Missing Opportunities",
                               ["Specific Improvements", "Final Verdict"])
    improvements = extract_section(review_text, "Specific Improvements",
                                    ["Final Verdict"])

    # Extract final verdict
    verdict_match = re.search(r"Final\s+Verdict:\s*\n?(.*?)$", review_text, re.IGNORECASE | re.DOTALL)
    verdict = verdict_match.group(1).strip() if verdict_match else ""

    return {
        "strengths": strengths,
        "weaknesses": weaknesses,
        "missing_opportunities": missing,
        "specific_improvements": improvements,
        "final_verdict": verdict,
    }


def save_critic_review(session_id: str, review_text: str):
    """Parse and save the Critic Agent's review."""
    scores = parse_critic_scores(review_text)
    lists = parse_critic_lists(review_text)

    supabase.table("critic_reviews").insert({
        "session_id": session_id,
        "overall_score": scores["overall_score"],
        "clarity_score": scores["clarity_score"],
        "research_depth_score": scores["research_depth_score"],
        "accuracy_score": scores["accuracy_score"],
        "analysis_insights_score": scores["analysis_insights_score"],
        "structure_score": scores["structure_score"],
        "source_quality_score": scores["source_quality_score"],
        "strengths": json.dumps(lists["strengths"]),
        "weaknesses": json.dumps(lists["weaknesses"]),
        "missing_opportunities": json.dumps(lists["missing_opportunities"]),
        "specific_improvements": json.dumps(lists["specific_improvements"]),
        "final_verdict": lists["final_verdict"],
        "full_review": review_text,
    }).execute()

    return scores["overall_score"]


def get_user_sessions(user_id: str):
    """Get all sessions for a user from the research_history view."""
    result = supabase.table("research_history").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    return result.data


def get_session_detail(session_id: str):
    """Get full session detail from the research_detail view."""
    result = supabase.table("research_detail").select("*").eq("session_id", session_id).single().execute()
    return result.data


def get_search_results(session_id: str):
    """Get search results for a session."""
    result = supabase.table("search_results").select("*").eq("session_id", session_id).order("result_order").execute()
    return result.data


def get_dashboard_stats(user_id: str):
    """Get dashboard stats for a user."""
    result = supabase.table("dashboard_stats").select("*").eq("user_id", user_id).execute()
    if result.data:
        return result.data[0]
    return {"total_researches": 0, "average_score": 0, "this_month_count": 0, "last_research_date": None, "last_research_topic": None}


def delete_session(session_id: str):
    """Delete a research session (cascades to all related tables)."""
    supabase.table("research_sessions").delete().eq("id", session_id).execute()


def save_chat_message(session_id: str, role: str, content: str):
    """Save a chat message to the database."""
    supabase.table("chat_messages").insert({
        "session_id": session_id,
        "role": role,
        "content": content
    }).execute()


def get_chat_messages(session_id: str, limit: int = 20):
    """Get recent chat messages for a session, ordered by creation time."""
    # We fetch ordered by created_at DESC to get the latest, then reverse in Python
    # so they are chronological.
    result = supabase.table("chat_messages").select("*").eq("session_id", session_id).order("created_at", desc=True).limit(limit).execute()
    messages = result.data
    messages.reverse()
    return messages


# ── Folders ──────────────────────────────────────────────────

def get_folders(user_id: str):
    """Get all folders for a user."""
    res = supabase.table("folders").select("*").eq("user_id", user_id).order("created_at", desc=False).execute()
    return res.data

def create_folder(user_id: str, name: str):
    """Create a new folder."""
    res = supabase.table("folders").insert({
        "user_id": user_id,
        "name": name
    }).execute()
    return res.data[0] if res.data else None

def update_folder(folder_id: str, name: str):
    """Rename a folder."""
    res = supabase.table("folders").update({"name": name}).eq("id", folder_id).execute()
    return res.data[0] if res.data else None

def delete_folder(folder_id: str):
    """Delete a folder. Sessions will automatically be set to folder_id=null due to ON DELETE SET NULL."""
    supabase.table("folders").delete().eq("id", folder_id).execute()

def update_session_folder(session_id: str, folder_id: str = None):
    """Move a session to a folder, or remove it from its folder if folder_id is None."""
    res = supabase.table("research_sessions").update({"folder_id": folder_id}).eq("id", session_id).execute()
    return res.data[0] if res.data else None

