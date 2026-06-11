-- ============================================================
-- Add Follow-Up Chat Table and RLS Policies
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Create the table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID NOT NULL REFERENCES public.research_sessions(id) ON DELETE CASCADE,
    role            TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content         TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookup by session_id
CREATE INDEX idx_chat_messages_session_id ON public.chat_messages(session_id);

COMMENT ON TABLE  public.chat_messages IS 'Stores chat history for research sessions';
COMMENT ON COLUMN public.chat_messages.role IS 'The role of the message sender (user or assistant)';

-- 2. Enable Row Level Security
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 3. Add RLS Policies
-- Users can view messages for their own sessions
CREATE POLICY "Users can view own chat messages"
    ON public.chat_messages
    FOR SELECT
    USING (
        session_id IN (
            SELECT id FROM public.research_sessions
            WHERE user_id = auth.uid()
        )
    );

-- Users can insert messages into their own sessions
CREATE POLICY "Users can insert own chat messages"
    ON public.chat_messages
    FOR INSERT
    WITH CHECK (
        session_id IN (
            SELECT id FROM public.research_sessions
            WHERE user_id = auth.uid()
        )
    );

-- Users can delete messages from their own sessions (optional, but good for cleanup)
CREATE POLICY "Users can delete own chat messages"
    ON public.chat_messages
    FOR DELETE
    USING (
        session_id IN (
            SELECT id FROM public.research_sessions
            WHERE user_id = auth.uid()
        )
    );
