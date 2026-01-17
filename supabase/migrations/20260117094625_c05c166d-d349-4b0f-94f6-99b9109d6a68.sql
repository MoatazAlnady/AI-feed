-- =====================================================
-- SCALABILITY: Critical indexes for billions of users
-- =====================================================

-- User profiles - critical for lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_handle 
ON user_profiles(handle) WHERE handle IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_profiles_account_type 
ON user_profiles(account_type);

-- Groups - for efficient filtering
CREATE INDEX IF NOT EXISTS idx_groups_is_private 
ON groups(is_private);

CREATE INDEX IF NOT EXISTS idx_groups_category 
ON groups(category) WHERE category IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_groups_created_at 
ON groups(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_groups_creator_id
ON groups(creator_id);

-- Group members - critical for membership checks
CREATE INDEX IF NOT EXISTS idx_group_members_group_status 
ON group_members(group_id, status) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_group_members_user_status 
ON group_members(user_id, status) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_group_members_user_group 
ON group_members(user_id, group_id);

-- Group events - for date filtering
CREATE INDEX IF NOT EXISTS idx_group_events_group_date 
ON group_events(group_id, start_date);

CREATE INDEX IF NOT EXISTS idx_group_events_public 
ON group_events(is_public, start_date DESC) WHERE is_public = true;

CREATE INDEX IF NOT EXISTS idx_group_events_created_by
ON group_events(created_by);

-- Standalone events - for listing
CREATE INDEX IF NOT EXISTS idx_standalone_events_date 
ON standalone_events(event_date DESC);

CREATE INDEX IF NOT EXISTS idx_standalone_events_creator 
ON standalone_events(creator_id);

-- Standalone event attendees
CREATE INDEX IF NOT EXISTS idx_standalone_event_attendees_event
ON standalone_event_attendees(event_id);

CREATE INDEX IF NOT EXISTS idx_standalone_event_attendees_user
ON standalone_event_attendees(user_id);

CREATE INDEX IF NOT EXISTS idx_standalone_event_attendees_event_user
ON standalone_event_attendees(event_id, user_id);

-- Event conversations - for chat lookup
CREATE INDEX IF NOT EXISTS idx_event_conversations_event 
ON event_conversations(event_id, event_type);

-- Event messages - for message pagination
CREATE INDEX IF NOT EXISTS idx_event_messages_conversation_created 
ON event_messages(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_event_messages_sender
ON event_messages(sender_id);

-- Connections - for mutual friends calculation
CREATE INDEX IF NOT EXISTS idx_connections_user1 
ON connections(user_1_id);

CREATE INDEX IF NOT EXISTS idx_connections_user2 
ON connections(user_2_id);

-- Group discussions - for public filtering
CREATE INDEX IF NOT EXISTS idx_group_discussions_public 
ON group_discussions(is_public, created_at DESC) WHERE is_public = true;

CREATE INDEX IF NOT EXISTS idx_group_discussions_group 
ON group_discussions(group_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_group_discussions_author
ON group_discussions(author_id);

-- Community discussions - for pagination
CREATE INDEX IF NOT EXISTS idx_community_discussions_pinned_created 
ON community_discussions(is_pinned DESC, created_at DESC);

-- Posts - for feed
CREATE INDEX IF NOT EXISTS idx_posts_created_at 
ON posts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_posts_user_created 
ON posts(user_id, created_at DESC);

-- Notifications - for real-time (using read column)
CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
ON notifications(user_id, read, created_at DESC);

-- Group event attendees
CREATE INDEX IF NOT EXISTS idx_group_event_attendees_event
ON group_event_attendees(event_id);

CREATE INDEX IF NOT EXISTS idx_group_event_attendees_user
ON group_event_attendees(user_id);

CREATE INDEX IF NOT EXISTS idx_group_event_attendees_event_user
ON group_event_attendees(event_id, user_id);

-- =====================================================
-- RLS POLICIES: Standalone events & Event chat
-- =====================================================

-- Enable RLS on standalone_events if not enabled
ALTER TABLE standalone_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public can view standalone events" ON standalone_events;
DROP POLICY IF EXISTS "Authenticated users can create standalone events" ON standalone_events;
DROP POLICY IF EXISTS "Creators can update their events" ON standalone_events;
DROP POLICY IF EXISTS "Creators can delete their events" ON standalone_events;

-- Standalone events policies
CREATE POLICY "Public can view standalone events" ON standalone_events
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create standalone events" ON standalone_events
FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their events" ON standalone_events
FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete their events" ON standalone_events
FOR DELETE USING (auth.uid() = creator_id);

-- Enable RLS on standalone_event_attendees if not enabled
ALTER TABLE standalone_event_attendees ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view attendees" ON standalone_event_attendees;
DROP POLICY IF EXISTS "Authenticated can RSVP" ON standalone_event_attendees;
DROP POLICY IF EXISTS "Users can update own RSVP" ON standalone_event_attendees;
DROP POLICY IF EXISTS "Users can delete own RSVP" ON standalone_event_attendees;

-- Standalone event attendees policies
CREATE POLICY "Public can view attendees" ON standalone_event_attendees
FOR SELECT USING (true);

CREATE POLICY "Authenticated can RSVP" ON standalone_event_attendees
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own RSVP" ON standalone_event_attendees
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own RSVP" ON standalone_event_attendees
FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS on event_conversations if not enabled
ALTER TABLE event_conversations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view event conversations" ON event_conversations;
DROP POLICY IF EXISTS "Authenticated can create conversations" ON event_conversations;

-- Event conversations policies
CREATE POLICY "Anyone can view event conversations" ON event_conversations
FOR SELECT USING (true);

CREATE POLICY "Authenticated can create conversations" ON event_conversations
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Enable RLS on event_messages if not enabled
ALTER TABLE event_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view event messages" ON event_messages;
DROP POLICY IF EXISTS "Authenticated can send messages" ON event_messages;

-- Event messages policies
CREATE POLICY "Anyone can view event messages" ON event_messages
FOR SELECT USING (true);

CREATE POLICY "Authenticated can send messages" ON event_messages
FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- =====================================================
-- HELPER FUNCTION: Batch mutual connections
-- =====================================================

CREATE OR REPLACE FUNCTION get_mutual_connections_for_groups(
  p_user_id UUID,
  p_group_ids UUID[]
)
RETURNS TABLE(group_id UUID, mutual_count BIGINT) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH user_connections AS (
    SELECT CASE 
      WHEN user_1_id = p_user_id THEN user_2_id 
      ELSE user_1_id 
    END as connected_id
    FROM connections
    WHERE user_1_id = p_user_id OR user_2_id = p_user_id
  )
  SELECT 
    gm.group_id,
    COUNT(DISTINCT uc.connected_id)::BIGINT as mutual_count
  FROM group_members gm
  JOIN user_connections uc ON gm.user_id = uc.connected_id
  WHERE gm.group_id = ANY(p_group_ids)
    AND gm.status = 'active'
  GROUP BY gm.group_id;
END;
$$;

-- =====================================================
-- HELPER FUNCTION: Check if user is event attendee
-- =====================================================

CREATE OR REPLACE FUNCTION is_event_attendee(
  p_user_id UUID,
  p_event_id UUID,
  p_event_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_event_type = 'group_event' THEN
    RETURN EXISTS (
      SELECT 1 FROM group_event_attendees
      WHERE event_id = p_event_id AND user_id = p_user_id
    );
  ELSIF p_event_type = 'standalone_event' THEN
    RETURN EXISTS (
      SELECT 1 FROM standalone_event_attendees
      WHERE event_id = p_event_id AND user_id = p_user_id
    );
  ELSE
    RETURN FALSE;
  END IF;
END;
$$;