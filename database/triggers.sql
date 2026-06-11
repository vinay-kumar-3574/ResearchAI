-- ============================================================
-- ResearchAI — Database Triggers & Functions
-- ============================================================
-- Run this AFTER schema.sql and rls_policies.sql.
-- These automate profile creation, timestamp updates, and
-- score syncing.
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- TRIGGER 1: Auto-create profile on user signup
-- ────────────────────────────────────────────────────────────
-- When a new user registers via Supabase Auth, this trigger
-- automatically creates a corresponding row in profiles table
-- using data from the auth.users record.
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', ''),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', NULL)
    );
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user IS 'Creates a profile row when a new user signs up (email or OAuth)';


-- ────────────────────────────────────────────────────────────
-- TRIGGER 2: Auto-update `updated_at` on profiles
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();


-- ────────────────────────────────────────────────────────────
-- TRIGGER 3: Auto-update `updated_at` on research_sessions
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE TRIGGER set_research_sessions_updated_at
    BEFORE UPDATE ON public.research_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();


-- ────────────────────────────────────────────────────────────
-- TRIGGER 4: Sync overall_score from critic_reviews to
--            research_sessions when a review is inserted
-- ────────────────────────────────────────────────────────────
-- When the Critic Agent inserts a review, this trigger
-- copies the overall_score to the parent research_session
-- and sets the status to 'completed'.
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.sync_critic_score_to_session()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.research_sessions
    SET
        overall_score         = NEW.overall_score,
        status                = 'completed',
        critique_completed_at = now(),
        updated_at            = now()
    WHERE id = NEW.session_id;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_critic_review_inserted
    AFTER INSERT ON public.critic_reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_critic_score_to_session();

COMMENT ON FUNCTION public.sync_critic_score_to_session IS 'Copies critic overall_score to research_sessions and marks status as completed';
