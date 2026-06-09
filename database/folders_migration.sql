-- ============================================================
-- Folders & Organization Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Create the folders table
CREATE TABLE IF NOT EXISTS public.folders (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Add folder_id to research_sessions
ALTER TABLE public.research_sessions 
ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL;

-- 3. Enable Row Level Security
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for folders
-- Allow users to read their own folders
CREATE POLICY "Users can view own folders"
ON public.folders FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to insert their own folders
CREATE POLICY "Users can create own folders"
ON public.folders FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own folders
CREATE POLICY "Users can update own folders"
ON public.folders FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own folders
CREATE POLICY "Users can delete own folders"
ON public.folders FOR DELETE
USING (auth.uid() = user_id);
