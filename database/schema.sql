-- ============================================================
-- ResearchAI — Supabase Database Schema
-- ============================================================
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- This creates all tables needed for the full application.
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 1. PROFILES TABLE
-- ────────────────────────────────────────────────────────────
-- Extends Supabase Auth (auth.users) with app-specific fields.
-- Every user who signs up gets a row here via a trigger.
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.profiles (
    id                          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name                   TEXT NOT NULL DEFAULT '',
    email                       TEXT UNIQUE NOT NULL,
    avatar_url                  TEXT DEFAULT NULL,
    email_notifications         BOOLEAN NOT NULL DEFAULT TRUE,
    research_completion_alerts  BOOLEAN NOT NULL DEFAULT TRUE,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.profiles IS 'User profile data extending Supabase auth.users';
COMMENT ON COLUMN public.profiles.email_notifications IS 'Whether to send email when a research pipeline completes';
COMMENT ON COLUMN public.profiles.research_completion_alerts IS 'Whether to show in-app alerts when a pipeline finishes';


-- ────────────────────────────────────────────────────────────
-- 2. RESEARCH SESSIONS TABLE
-- ────────────────────────────────────────────────────────────
-- One row per research pipeline execution.
-- Tracks the topic, current status, overall score, and
-- timestamps for each pipeline stage.
-- ────────────────────────────────────────────────────────────

CREATE TYPE public.pipeline_status AS ENUM (
    'pending',
    'searching',
    'scraping',
    'writing',
    'critiquing',
    'completed',
    'failed'
);

CREATE TABLE IF NOT EXISTS public.research_sessions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    topic                   TEXT NOT NULL,
    status                  public.pipeline_status NOT NULL DEFAULT 'pending',
    overall_score           NUMERIC(3,1) DEFAULT NULL,          -- e.g. 7.5
    failed_stage            TEXT DEFAULT NULL,                   -- which stage failed (if any)
    error_message           TEXT DEFAULT NULL,                   -- error details (if any)
    search_completed_at     TIMESTAMPTZ DEFAULT NULL,
    scrape_completed_at     TIMESTAMPTZ DEFAULT NULL,
    report_completed_at     TIMESTAMPTZ DEFAULT NULL,
    critique_completed_at   TIMESTAMPTZ DEFAULT NULL,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_research_sessions_user_id    ON public.research_sessions(user_id);
CREATE INDEX idx_research_sessions_created_at ON public.research_sessions(created_at DESC);
CREATE INDEX idx_research_sessions_status     ON public.research_sessions(status);

COMMENT ON TABLE  public.research_sessions IS 'Each row is one full research pipeline run';
COMMENT ON COLUMN public.research_sessions.overall_score IS 'Critic overall score out of 10 (e.g. 7.5)';
COMMENT ON COLUMN public.research_sessions.failed_stage IS 'Stage name where failure occurred (searching/scraping/writing/critiquing)';


-- ────────────────────────────────────────────────────────────
-- 3. SEARCH RESULTS TABLE
-- ────────────────────────────────────────────────────────────
-- Stores the individual search results returned by the
-- Search Agent (via Tavily). Up to 5 results per session.
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.search_results (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID NOT NULL REFERENCES public.research_sessions(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    url             TEXT NOT NULL,
    content_snippet TEXT NOT NULL DEFAULT '',
    result_order    INTEGER NOT NULL DEFAULT 0,                 -- 0-indexed position in results
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_search_results_session_id ON public.search_results(session_id);

COMMENT ON TABLE  public.search_results IS 'Search results from Tavily returned by the Search Agent';
COMMENT ON COLUMN public.search_results.result_order IS 'Position/rank of this result (0 = top result)';
COMMENT ON COLUMN public.search_results.content_snippet IS 'Preview snippet of page content (up to ~500 chars)';


-- ────────────────────────────────────────────────────────────
-- 4. SCRAPED CONTENTS TABLE
-- ────────────────────────────────────────────────────────────
-- Stores the full scraped text from the Reader Agent.
-- One row per session (the agent picks the best URL and
-- scrapes it).
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.scraped_contents (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id  UUID NOT NULL UNIQUE REFERENCES public.research_sessions(id) ON DELETE CASCADE,
    source_url  TEXT NOT NULL,
    content     TEXT NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_scraped_contents_session_id ON public.scraped_contents(session_id);

COMMENT ON TABLE  public.scraped_contents IS 'Scraped page content from the Reader Agent';
COMMENT ON COLUMN public.scraped_contents.source_url IS 'The URL that was scraped';
COMMENT ON COLUMN public.scraped_contents.content IS 'Clean text extracted from the page (scripts/nav/footer removed)';


-- ────────────────────────────────────────────────────────────
-- 5. RESEARCH REPORTS TABLE
-- ────────────────────────────────────────────────────────────
-- Stores the full research report generated by the Writer
-- Agent. One row per session. Content is markdown-formatted.
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.research_reports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID NOT NULL UNIQUE REFERENCES public.research_sessions(id) ON DELETE CASCADE,
    report_content  TEXT NOT NULL DEFAULT '',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_research_reports_session_id ON public.research_reports(session_id);

COMMENT ON TABLE  public.research_reports IS 'Markdown-formatted research report from the Writer Agent';
COMMENT ON COLUMN public.research_reports.report_content IS 'Full report text (Introduction, Key Findings, Conclusion, Sources)';


-- ────────────────────────────────────────────────────────────
-- 6. CRITIC REVIEWS TABLE
-- ────────────────────────────────────────────────────────────
-- Stores the full critique from the Critic Agent including
-- individual category scores, strengths/weaknesses, and
-- the final verdict. One row per session.
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.critic_reviews (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id                  UUID NOT NULL UNIQUE REFERENCES public.research_sessions(id) ON DELETE CASCADE,

    -- Category scores (each out of 10)
    overall_score               NUMERIC(3,1) NOT NULL DEFAULT 0,
    clarity_score               NUMERIC(3,1) NOT NULL DEFAULT 0,
    research_depth_score        NUMERIC(3,1) NOT NULL DEFAULT 0,
    accuracy_score              NUMERIC(3,1) NOT NULL DEFAULT 0,
    analysis_insights_score     NUMERIC(3,1) NOT NULL DEFAULT 0,
    structure_score             NUMERIC(3,1) NOT NULL DEFAULT 0,
    source_quality_score        NUMERIC(3,1) NOT NULL DEFAULT 0,

    -- Qualitative feedback (stored as JSON arrays of strings)
    strengths                   JSONB NOT NULL DEFAULT '[]'::jsonb,
    weaknesses                  JSONB NOT NULL DEFAULT '[]'::jsonb,
    missing_opportunities       JSONB NOT NULL DEFAULT '[]'::jsonb,
    specific_improvements       JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Final summary
    final_verdict               TEXT NOT NULL DEFAULT '',

    -- Raw full review text (for display/export)
    full_review                 TEXT NOT NULL DEFAULT '',

    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_critic_reviews_session_id ON public.critic_reviews(session_id);

COMMENT ON TABLE  public.critic_reviews IS 'Structured critique from the Critic Agent with scores and feedback';
COMMENT ON COLUMN public.critic_reviews.strengths IS 'JSON array of strength bullet points';
COMMENT ON COLUMN public.critic_reviews.weaknesses IS 'JSON array of weakness bullet points';
COMMENT ON COLUMN public.critic_reviews.missing_opportunities IS 'JSON array of missing opportunity points';
COMMENT ON COLUMN public.critic_reviews.specific_improvements IS 'JSON array of numbered improvement suggestions';
COMMENT ON COLUMN public.critic_reviews.final_verdict IS '2-3 sentence summary assessment';
COMMENT ON COLUMN public.critic_reviews.full_review IS 'Complete raw review text from the Critic Agent';
