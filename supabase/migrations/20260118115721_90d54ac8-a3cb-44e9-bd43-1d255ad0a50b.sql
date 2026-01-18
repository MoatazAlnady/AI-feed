-- Add audio columns to articles table for TTS functionality
ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS audio_url TEXT,
ADD COLUMN IF NOT EXISTS audio_generated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS audio_content_hash TEXT;

-- Create storage bucket for article audio files
INSERT INTO storage.buckets (id, name, public)
VALUES ('article-audio', 'article-audio', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for article audio bucket
CREATE POLICY "Article audio is publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'article-audio');

CREATE POLICY "Authenticated users can upload article audio"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'article-audio' AND auth.role() = 'authenticated');

CREATE POLICY "Service role can manage article audio"
ON storage.objects FOR ALL
USING (bucket_id = 'article-audio');