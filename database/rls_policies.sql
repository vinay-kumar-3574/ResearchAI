-- ============================================================
-- ResearchAI — Row Level Security (RLS) Policies
-- ============================================================
-- Run this AFTER schema.sql in the Supabase SQL Editor.
-- These policies ensure users can only access their own data.
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- Enable RLS on all tables
-- ────────────────────────────────────────────────────────────

ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_results     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraped_contents   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_reports   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.critic_reviews     ENABLE ROW LEVEL SECURITY;


-- ════════════════════════════════════════════════════════════
-- PROFILES POLICIES
-- ════════════════════════════════════════════════════════════

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Allow insert for the trigger function (service role) and the user themselves
CREATE POLICY "Users can insert own profile"
    ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Users can delete their own profile (account deletion)
CREATE POLICY "Users can delete own profile"
    ON public.profiles
    FOR DELETE
    USING (auth.uid() = id);


-- ════════════════════════════════════════════════════════════
-- RESEARCH SESSIONS POLICIES
-- ════════════════════════════════════════════════════════════

-- Users can view their own sessions
CREATE POLICY "Users can view own research sessions"
    ON public.research_sessions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create their own sessions
CREATE POLICY "Users can create own research sessions"
    ON public.research_sessions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions (status changes, score updates)
CREATE POLICY "Users can update own research sessions"
    ON public.research_sessions
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own sessions
CREATE POLICY "Users can delete own research sessions"
    ON public.research_sessions
    FOR DELETE
    USING (auth.uid() = user_id);


-- ════════════════════════════════════════════════════════════
-- SEARCH RESULTS POLICIES
-- ════════════════════════════════════════════════════════════

-- Users can view search results for their own sessions
CREATE POLICY "Users can view own search results"
    ON public.search_results
    FOR SELECT
    USING (
        session_id IN (
            SELECT id FROM public.research_sessions
            WHERE user_id = auth.uid()
        )
    );

-- Users can insert search results into their own sessions
CREATE POLICY "Users can insert own search results"
    ON public.search_results
    FOR INSERT
    WITH CHECK (
        session_id IN (
            SELECT id FROM public.research_sessions
            WHERE user_id = auth.uid()
        )
    );

-- Users can delete search results from their own sessions
CREATE POLICY "Users can delete own search results"
    ON public.search_results
    FOR DELETE
    USING (
        session_id IN (
            SELECT id FROM public.research_sessions
            WHERE user_id = auth.uid()
        )
    );


-- ════════════════════════════════════════════════════════════
-- SCRAPED CONTENTS POLICIES
-- ════════════════════════════════════════════════════════════

CREATE POLICY "Users can view own scraped contents"
    ON public.scraped_contents
    FOR SELECT
    USING (
        session_id IN (
            SELECT id FROM public.research_sessions
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own scraped contents"
    ON public.scraped_contents
    FOR INSERT
    WITH CHECK (
        session_id IN (
            SELECT id FROM public.research_sessions
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own scraped contents"
    ON public.scraped_contents
    FOR DELETE
    USING (
        session_id IN (
            SELECT id FROM public.research_sessions
            WHERE user_id = auth.uid()
        )
    );


-- ════════════════════════════════════════════════════════════
-- RESEARCH REPORTS POLICIES
-- ════════════════════════════════════════════════════════════

CREATE POLICY "Users can view own research reports"
    ON public.research_reports
    FOR SELECT
    USING (
        session_id IN (
            SELECT id FROM public.research_sessions
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own research reports"
    ON public.research_reports
    FOR INSERT
    WITH CHECK (
        session_id IN (
            SELECT id FROM public.research_sessions
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own research reports"
    ON public.research_reports
    FOR DELETE
    USING (
        session_id IN (
            SELECT id FROM public.research_sessions
            WHERE user_id = auth.uid()
        )
    );


-- ════════════════════════════════════════════════════════════
-- CRITIC REVIEWS POLICIES
-- ════════════════════════════════════════════════════════════

CREATE POLICY "Users can view own critic reviews"
    ON public.critic_reviews
    FOR SELECT
    USING (
        session_id IN (
            SELECT id FROM public.research_sessions
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own critic reviews"
    ON public.critic_reviews
    FOR INSERT
    WITH CHECK (
        session_id IN (
            SELECT id FROM public.research_sessions
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own critic reviews"
    ON public.critic_reviews
    FOR DELETE
    USING (
        session_id IN (
            SELECT id FROM public.research_sessions
            WHERE user_id = auth.uid()
        )
    );
