-- 1. Add missing columns to standalone_events (including organizer_id)
ALTER TABLE standalone_events 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS organizer_id UUID REFERENCES user_profiles(id);

-- Update organizer_id from creator_id if not already set
UPDATE standalone_events SET organizer_id = creator_id WHERE organizer_id IS NULL AND creator_id IS NOT NULL;

-- 2. Add missing columns to tool_reviews
ALTER TABLE tool_reviews 
ADD COLUMN IF NOT EXISTS pros TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS cons TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS content TEXT;

-- Copy comment to content for consistency
UPDATE tool_reviews SET content = comment WHERE content IS NULL AND comment IS NOT NULL;

-- 3. Create tool_comments table
CREATE TABLE IF NOT EXISTS tool_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  parent_id UUID REFERENCES tool_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_tool_comments_tool_id ON tool_comments(tool_id);
CREATE INDEX IF NOT EXISTS idx_tool_comments_user_id ON tool_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_tool_comments_parent_id ON tool_comments(parent_id);

-- Enable RLS
ALTER TABLE tool_comments ENABLE ROW LEVEL SECURITY;

-- Policies for tool_comments
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tool_comments' AND policyname = 'Anyone can view tool comments') THEN
    CREATE POLICY "Anyone can view tool comments" ON tool_comments FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tool_comments' AND policyname = 'Authenticated users can create comments') THEN
    CREATE POLICY "Authenticated users can create comments" ON tool_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tool_comments' AND policyname = 'Users can update own comments') THEN
    CREATE POLICY "Users can update own comments" ON tool_comments FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tool_comments' AND policyname = 'Users can delete own comments') THEN
    CREATE POLICY "Users can delete own comments" ON tool_comments FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- 4. Add event_id to group_discussions for event-linked discussions
ALTER TABLE group_discussions 
ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES group_events(id) ON DELETE SET NULL;

-- Make group_id optional for solo discussions
ALTER TABLE group_discussions ALTER COLUMN group_id DROP NOT NULL;

-- Add index for event_id
CREATE INDEX IF NOT EXISTS idx_group_discussions_event_id ON group_discussions(event_id);

-- 5. Create or replace trending tools function
CREATE OR REPLACE FUNCTION update_trending_tools()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Reset all trending flags
  UPDATE tools SET trending = false WHERE trending = true;
  
  -- Mark top 20 tools as trending based on engagement
  UPDATE tools 
  SET trending = true
  WHERE id IN (
    SELECT id FROM tools
    WHERE status = 'published'
    ORDER BY (
      COALESCE(views, 0) * 0.3 + 
      COALESCE(share_count, 0) * 0.4 + 
      COALESCE(average_rating, 0) * 50 * 0.3
    ) DESC
    LIMIT 20
  );
END;
$$;