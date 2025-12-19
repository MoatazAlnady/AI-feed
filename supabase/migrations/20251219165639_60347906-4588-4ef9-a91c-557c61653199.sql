-- Create newsletter_batches table
CREATE TABLE IF NOT EXISTS newsletter_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  frequency TEXT NOT NULL,
  total_subscribers INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE newsletter_batches ENABLE ROW LEVEL SECURITY;

-- Admin-only policy for newsletter_batches
CREATE POLICY "Admins can manage newsletter batches" ON newsletter_batches
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND account_type = 'admin')
  );

-- Create newsletter_sent_content table if not exists
CREATE TABLE IF NOT EXISTS newsletter_sent_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID REFERENCES newsletter_subscribers(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL,
  content_id TEXT NOT NULL,
  newsletter_batch_id UUID REFERENCES newsletter_batches(id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(subscriber_id, content_type, content_id)
);

-- Enable RLS
ALTER TABLE newsletter_sent_content ENABLE ROW LEVEL SECURITY;

-- Admin-only policy for newsletter_sent_content
CREATE POLICY "Admins can manage newsletter sent content" ON newsletter_sent_content
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND account_type = 'admin')
  );

-- Add columns to groups table for enhanced functionality
ALTER TABLE groups ADD COLUMN IF NOT EXISTS auto_approve_members BOOLEAN DEFAULT false;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS auto_approve_posts BOOLEAN DEFAULT true;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS category TEXT;

-- Create group_join_requests table
CREATE TABLE IF NOT EXISTS group_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES user_profiles(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  UNIQUE(group_id, user_id)
);

-- Enable RLS
ALTER TABLE group_join_requests ENABLE ROW LEVEL SECURITY;

-- Policies for group_join_requests
CREATE POLICY "Users can view their own join requests" ON group_join_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Group admins can view join requests" ON group_join_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = group_join_requests.group_id 
      AND user_id = auth.uid() 
      AND role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Users can create join requests" ON group_join_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Group admins can update join requests" ON group_join_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = group_join_requests.group_id 
      AND user_id = auth.uid() 
      AND role IN ('admin', 'owner')
    )
  );

-- Create group_posts table
CREATE TABLE IF NOT EXISTS group_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  author_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_urls TEXT[],
  is_approved BOOLEAN DEFAULT true,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE group_posts ENABLE ROW LEVEL SECURITY;

-- Policies for group_posts
CREATE POLICY "Group members can view posts" ON group_posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = group_posts.group_id 
      AND user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM groups 
      WHERE id = group_posts.group_id 
      AND is_private = false
    )
  );

CREATE POLICY "Group members can create posts" ON group_posts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = group_posts.group_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Authors can update their posts" ON group_posts
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Authors and admins can delete posts" ON group_posts
  FOR DELETE USING (
    auth.uid() = author_id 
    OR EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = group_posts.group_id 
      AND user_id = auth.uid() 
      AND role IN ('admin', 'owner')
    )
  );

-- Create group_notification_preferences table
CREATE TABLE IF NOT EXISTS group_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  notify_new_posts BOOLEAN DEFAULT true,
  notify_new_members BOOLEAN DEFAULT true,
  notify_mentions BOOLEAN DEFAULT true,
  notify_admin_actions BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Enable RLS
ALTER TABLE group_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Policies for group_notification_preferences
CREATE POLICY "Users can manage their notification preferences" ON group_notification_preferences
  FOR ALL USING (auth.uid() = user_id);