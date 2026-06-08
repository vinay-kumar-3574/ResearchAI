-- ============================================================
-- ResearchAI — Supabase Storage Configuration
-- ============================================================
-- Run this AFTER schema.sql.
-- Creates storage buckets for user avatars and sets up
-- access policies.
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- STORAGE BUCKET: avatars
-- ────────────────────────────────────────────────────────────
-- Stores user profile pictures.
-- Files are organized as: avatars/{user_id}/{filename}
-- Allowed types: JPG, PNG, GIF
-- Max file size: 5MB (enforced in the app, not in SQL)
-- ────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    TRUE,                                               -- Public bucket (avatar URLs are shareable)
    5242880,                                            -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif']      -- Allowed file types
)
ON CONFLICT (id) DO NOTHING;


-- ────────────────────────────────────────────────────────────
-- STORAGE POLICIES: avatars bucket
-- ────────────────────────────────────────────────────────────

-- Anyone can view avatars (they are public profile pictures)
CREATE POLICY "Anyone can view avatars"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'avatars');

-- Authenticated users can upload their own avatar
-- Files must be stored under their user ID folder
CREATE POLICY "Users can upload own avatar"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can update (overwrite) their own avatar
CREATE POLICY "Users can update own avatar"
    ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.foldername(name))[1]
    )
    WITH CHECK (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can delete their own avatar
CREATE POLICY "Users can delete own avatar"
    ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );
