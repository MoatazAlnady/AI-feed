-- Add follow_status column to follows table
ALTER TABLE follows ADD COLUMN IF NOT EXISTS follow_status TEXT DEFAULT 'following' 
  CHECK (follow_status IN ('following', 'notify', 'favorite', 'normal'));

-- Create favorite_post_views table for tracking view time of favorite creators' posts
CREATE TABLE IF NOT EXISTS favorite_post_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  view_count INTEGER DEFAULT 1,
  last_viewed_at TIMESTAMPTZ DEFAULT NOW(),
  total_view_time_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Enable RLS on favorite_post_views
ALTER TABLE favorite_post_views ENABLE ROW LEVEL SECURITY;

-- Users can view their own post views
CREATE POLICY "Users can view their own post views"
ON favorite_post_views FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own post views
CREATE POLICY "Users can insert their own post views"
ON favorite_post_views FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own post views
CREATE POLICY "Users can update their own post views"
ON favorite_post_views FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own post views
CREATE POLICY "Users can delete their own post views"
ON favorite_post_views FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_favorite_post_views_user_post ON favorite_post_views(user_id, post_id);
CREATE INDEX IF NOT EXISTS idx_follows_status ON follows(follower_id, follow_status);