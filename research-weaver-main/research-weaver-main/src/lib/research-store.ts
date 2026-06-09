/**
 * Research Store — Real Supabase integration
 *
 * All data types match the Supabase database schema.
 * Functions call the FastAPI backend for pipeline execution
 * and Supabase directly for reads/deletes.
 */
import { supabase } from "./supabase";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ─── Types ──────────────────────────────────────────────────

export type ChatMessage = {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at?: string;
};

export type SearchResult = {
  id: string;
  title: string;
  url: string;
  content_snippet: string;
  result_order: number;
};

export type CategoryScores = {
  clarity: number;
  depth: number;
  accuracy: number;
  analysis: number;
  structure: number;
  sources: number;
};

export type Critique = {
  overallScore: number;
  categories: CategoryScores;
  strengths: string[];
  weaknesses: string[];
  missing: string[];
  improvements: string[];
  verdict: string;
  fullReview: string;
};

export type ResearchSession = {
  id: string;
  topic: string;
  status: string;
  createdAt: string;
  overallScore: number | null;
  reportPreview: string | null;
  // Full detail fields (populated when viewing a single session)
  searchResults?: SearchResult[];
  scrapedUrl?: string;
  scrapedContent?: string;
  reportContent?: string;
  critique?: Critique;
  timings?: {
    search: string | null;
    read: string | null;
    write: string | null;
    critique: string | null;
  };
};

export type DashboardStats = {
  total_researches: number;
  average_score: number | null;
  this_month_count: number;
  last_research_date: string | null;
  last_research_topic: string | null;
};

// ─── SSE stage update type ──────────────────────────────────

export type StageUpdate = {
  stage: string;
  status: string;
  session_id?: string;
  result_count?: number;
  preview?: string;
  chars?: number;
  url?: string;
  overall_score?: number;
  error?: string;
};

// ─── Load sessions from Supabase ────────────────────────────

export async function loadSessions(userId: string): Promise<ResearchSession[]> {
  const { data, error } = await supabase
    .from("research_sessions")
    .select(`
      id,
      topic,
      status,
      overall_score,
      created_at,
      research_reports (report_content)
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading sessions:", error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    topic: row.topic,
    status: row.status,
    createdAt: row.created_at,
    overallScore: row.overall_score,
    reportPreview: row.research_reports?.[0]?.report_content?.slice(0, 200) || null,
  }));
}

// ─── Get single session with full detail ────────────────────

export async function getSession(sessionId: string): Promise<ResearchSession | null> {
  // Fetch session
  const { data: session, error: sessionErr } = await supabase
    .from("research_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (sessionErr || !session) return null;

  // Fetch search results
  const { data: searchResults } = await supabase
    .from("search_results")
    .select("*")
    .eq("session_id", sessionId)
    .order("result_order");

  // Fetch scraped content
  const { data: scraped } = await supabase
    .from("scraped_contents")
    .select("*")
    .eq("session_id", sessionId)
    .maybeSingle();

  // Fetch report
  const { data: report } = await supabase
    .from("research_reports")
    .select("*")
    .eq("session_id", sessionId)
    .maybeSingle();

  // Fetch critic review
  const { data: critic } = await supabase
    .from("critic_reviews")
    .select("*")
    .eq("session_id", sessionId)
    .maybeSingle();

  const critique: Critique | undefined = critic
    ? {
        overallScore: critic.overall_score || 0,
        categories: {
          clarity: critic.clarity_score || 0,
          depth: critic.research_depth_score || 0,
          accuracy: critic.accuracy_score || 0,
          analysis: critic.analysis_insights_score || 0,
          structure: critic.structure_score || 0,
          sources: critic.source_quality_score || 0,
        },
        strengths: typeof critic.strengths === "string" ? JSON.parse(critic.strengths) : (critic.strengths || []),
        weaknesses: typeof critic.weaknesses === "string" ? JSON.parse(critic.weaknesses) : (critic.weaknesses || []),
        missing: typeof critic.missing_opportunities === "string" ? JSON.parse(critic.missing_opportunities) : (critic.missing_opportunities || []),
        improvements: typeof critic.specific_improvements === "string" ? JSON.parse(critic.specific_improvements) : (critic.specific_improvements || []),
        verdict: critic.final_verdict || "",
        fullReview: critic.full_review || "",
      }
    : undefined;

  return {
    id: session.id,
    topic: session.topic,
    status: session.status,
    createdAt: session.created_at,
    overallScore: session.overall_score,
    reportPreview: report?.report_content?.slice(0, 200) || null,
    searchResults: (searchResults || []).map((r: any) => ({
      id: r.id,
      title: r.title,
      url: r.url,
      content_snippet: r.content_snippet,
      result_order: r.result_order,
    })),
    scrapedUrl: scraped?.source_url || "",
    scrapedContent: scraped?.content || "",
    reportContent: report?.report_content || "",
    critique,
    timings: {
      search: session.search_completed_at,
      read: session.scrape_completed_at,
      write: session.report_completed_at,
      critique: session.critique_completed_at,
    },
  };
}

// ─── Delete session ─────────────────────────────────────────

export async function deleteSession(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from("research_sessions")
    .delete()
    .eq("id", sessionId);

  if (error) {
    console.error("Error deleting session:", error);
    throw error;
  }
}

// ─── Start research (SSE stream from FastAPI) ───────────────

export function startResearch(
  topic: string,
  depth: "quick" | "deep",
  userId: string,
  onUpdate: (update: StageUpdate) => void,
  onError: (error: string) => void,
  onComplete: (sessionId: string) => void
): () => void {
  const controller = new AbortController();

  fetch(`${API_URL}/api/research/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, user_id: userId, depth }),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE data lines
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const update: StageUpdate = JSON.parse(line.slice(6));
              onUpdate(update);

              if (update.stage === "complete" && update.session_id) {
                onComplete(update.session_id);
              }
              if (update.stage === "error") {
                onError(update.error || "Unknown pipeline error");
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }
    })
    .catch((err) => {
      if (err.name !== "AbortError") {
        onError(err.message || "Failed to connect to research API");
      }
    });

  // Return abort function
  return () => controller.abort();
}

// ─── Dashboard stats ────────────────────────────────────────

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  // Query directly since views might not be set up
  const { data: sessions, error } = await supabase
    .from("research_sessions")
    .select("overall_score, created_at, topic")
    .eq("user_id", userId)
    .eq("status", "completed");

  if (error || !sessions || sessions.length === 0) {
    return {
      total_researches: 0,
      average_score: null,
      this_month_count: 0,
      last_research_date: null,
      last_research_topic: null,
    };
  }

  const now = new Date();
  const thisMonth = sessions.filter((s: any) => {
    const d = new Date(s.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const scores = sessions.filter((s: any) => s.overall_score != null).map((s: any) => s.overall_score);
  const avgScore = scores.length > 0 ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : null;

  const sorted = [...sessions].sort(
    (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return {
    total_researches: sessions.length,
    average_score: avgScore ? Math.round(avgScore * 10) / 10 : null,
    this_month_count: thisMonth.length,
    last_research_date: sorted[0]?.created_at || null,
    last_research_topic: sorted[0]?.topic || null,
  };
}

// ─── Chat Api ───────────────────────────────────────────────

export async function getChatHistory(sessionId: string): Promise<ChatMessage[]> {
  try {
    const res = await fetch(`${API_URL}/api/sessions/${sessionId}/chat`);
    if (!res.ok) throw new Error("Failed to load chat history");
    const data = await res.json();
    return data.messages || [];
  } catch (err) {
    console.error(err);
    return [];
  }
}

export function chatWithAssistant(
  sessionId: string,
  message: string,
  onChunk: (chunk: string) => void,
  onError: (error: string) => void,
  onComplete: () => void
): () => void {
  const controller = new AbortController();

  fetch(`${API_URL}/api/sessions/${sessionId}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6);
            if (dataStr === "[DONE]") {
              onComplete();
              return;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.error) {
                onError(parsed.error);
              } else if (parsed.content) {
                onChunk(parsed.content);
              }
            } catch {
              // Ignore parse errors for incomplete chunks if any
            }
          }
        }
      }
      onComplete();
    })
    .catch((err) => {
      if (err.name !== "AbortError") {
        onError(err.message || "Failed to chat with assistant");
      }
    });

  return () => controller.abort();
}

