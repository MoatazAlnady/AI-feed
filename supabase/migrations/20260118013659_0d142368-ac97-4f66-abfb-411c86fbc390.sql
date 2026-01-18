-- Phase 1: Drop legacy event tables (data already migrated)
DROP TABLE IF EXISTS group_event_attendees CASCADE;
DROP TABLE IF EXISTS standalone_event_attendees CASCADE;
DROP TABLE IF EXISTS group_event_discussions CASCADE;
DROP TABLE IF EXISTS group_event_posts CASCADE;
DROP TABLE IF EXISTS group_events CASCADE;
DROP TABLE IF EXISTS standalone_events CASCADE;

-- Clean up shared_posts columns - remove legacy columns
ALTER TABLE shared_posts DROP COLUMN IF EXISTS original_group_event_id;
ALTER TABLE shared_posts DROP COLUMN IF EXISTS original_standalone_event_id;

-- Phase 2: Add preferred_language to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en';

-- Phase 3: Create content translations cache table
CREATE TABLE IF NOT EXISTS content_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL, -- 'post', 'article', 'discussion', 'tool', 'event'
  content_id UUID NOT NULL,
  source_language TEXT NOT NULL,
  target_language TEXT NOT NULL,
  original_text TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  translated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(content_type, content_id, target_language)
);

-- Enable RLS on content_translations
ALTER TABLE content_translations ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read translations (they are cached for performance)
CREATE POLICY "Anyone can read cached translations" 
ON content_translations FOR SELECT 
USING (true);

-- Allow authenticated users to insert translations
CREATE POLICY "Authenticated users can create translations" 
ON content_translations FOR INSERT 
WITH CHECK (true);

-- Add detected_language to content tables
ALTER TABLE posts ADD COLUMN IF NOT EXISTS detected_language TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS detected_language TEXT;
ALTER TABLE group_discussions ADD COLUMN IF NOT EXISTS detected_language TEXT;
ALTER TABLE tools ADD COLUMN IF NOT EXISTS detected_language TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS detected_language TEXT;

-- Create index for fast translation lookups
CREATE INDEX IF NOT EXISTS idx_translations_lookup 
ON content_translations(content_type, content_id, target_language);