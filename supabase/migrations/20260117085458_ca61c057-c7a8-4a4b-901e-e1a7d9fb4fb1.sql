-- =============================================
-- PHASE 1: ENHANCED GROUP SYSTEM DATABASE SCHEMA
-- =============================================

-- 1. Extend groups table with new columns
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS cover_photo TEXT;
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS rules TEXT;
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS welcome_message TEXT;
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS join_type TEXT DEFAULT 'public' CHECK (join_type IN ('public', 'private', 'connections_only'));
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS join_questions JSONB;
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS require_approval BOOLEAN DEFAULT false;
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS who_can_post TEXT DEFAULT 'members' CHECK (who_can_post IN ('everyone', 'members', 'admins'));
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS who_can_comment TEXT DEFAULT 'members' CHECK (who_can_comment IN ('everyone', 'members', 'admins'));
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS who_can_discuss TEXT DEFAULT 'members' CHECK (who_can_discuss IN ('everyone', 'members', 'admins'));
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS who_can_invite TEXT DEFAULT 'members' CHECK (who_can_invite IN ('everyone', 'members', 'admins'));
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS who_can_chat TEXT DEFAULT 'members' CHECK (who_can_chat IN ('everyone', 'members', 'admins'));
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS posts_need_approval BOOLEAN DEFAULT false;
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS discussions_need_approval BOOLEAN DEFAULT false;
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS members_can_view_members BOOLEAN DEFAULT true;
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS posts_visibility TEXT DEFAULT 'members' CHECK (posts_visibility IN ('public', 'members'));
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS membership_type TEXT DEFAULT 'free' CHECK (membership_type IN ('free', 'one_time', 'recurring'));
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS membership_price DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS membership_currency TEXT DEFAULT 'USD';
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS membership_frequency TEXT CHECK (membership_frequency IN ('monthly', 'yearly'));
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

-- 2. Extend group_members with status fields
ALTER TABLE public.group_members ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'banned', 'muted'));
ALTER TABLE public.group_members ADD COLUMN IF NOT EXISTS banned_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.group_members ADD COLUMN IF NOT EXISTS banned_reason TEXT;
ALTER TABLE public.group_members ADD COLUMN IF NOT EXISTS muted_until TIMESTAMP WITH TIME ZONE;

-- 3. Create discussion_tags table
CREATE TABLE IF NOT EXISTS public.discussion_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Create group_discussion_tags junction table
CREATE TABLE IF NOT EXISTS public.group_discussion_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  discussion_id UUID NOT NULL REFERENCES public.group_discussions(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.discussion_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(discussion_id, tag_id)
);

-- 5. Extend group_discussions with new fields
ALTER TABLE public.group_discussions ADD COLUMN IF NOT EXISTS subtitle TEXT;
ALTER TABLE public.group_discussions ADD COLUMN IF NOT EXISTS media_urls TEXT[];
ALTER TABLE public.group_discussions ADD COLUMN IF NOT EXISTS attachments JSONB;
ALTER TABLE public.group_discussions ADD COLUMN IF NOT EXISTS poll_options JSONB;
ALTER TABLE public.group_discussions ADD COLUMN IF NOT EXISTS poll_end_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.group_discussions ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT true;
ALTER TABLE public.group_discussions ADD COLUMN IF NOT EXISTS has_participant_chat BOOLEAN DEFAULT false;

-- 6. Create group_discussion_participants table
CREATE TABLE IF NOT EXISTS public.group_discussion_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  discussion_id UUID NOT NULL REFERENCES public.group_discussions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(discussion_id, user_id)
);

-- 7. Create discussion_poll_votes table
CREATE TABLE IF NOT EXISTS public.discussion_poll_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  discussion_id UUID NOT NULL REFERENCES public.group_discussions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  option_index INTEGER NOT NULL,
  voted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(discussion_id, user_id)
);

-- 8. Create group_events table
CREATE TABLE IF NOT EXISTS public.group_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  start_time TIME,
  end_time TIME,
  location TEXT,
  is_online BOOLEAN DEFAULT false,
  online_link TEXT,
  is_public BOOLEAN DEFAULT false,
  max_attendees INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 9. Create group_event_attendees table
CREATE TABLE IF NOT EXISTS public.group_event_attendees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.group_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT DEFAULT 'attending' CHECK (status IN ('attending', 'maybe', 'not_attending')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- 10. Create group_event_discussions table (for event profile page)
CREATE TABLE IF NOT EXISTS public.group_event_discussions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.group_events(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 11. Create group_event_posts table (for event profile page)
CREATE TABLE IF NOT EXISTS public.group_event_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.group_events(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  media_urls TEXT[],
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 12. Create group_memberships table for paid groups
CREATE TABLE IF NOT EXISTS public.group_memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  stripe_subscription_id TEXT,
  stripe_payment_id TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- 13. Enable RLS on new tables
ALTER TABLE public.discussion_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_discussion_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_discussion_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_event_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_event_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_memberships ENABLE ROW LEVEL SECURITY;

-- 14. RLS Policies for discussion_tags (readable by all authenticated)
CREATE POLICY "Discussion tags are viewable by authenticated users"
ON public.discussion_tags FOR SELECT
TO authenticated
USING (true);

-- 15. RLS Policies for group_discussion_tags
CREATE POLICY "Group discussion tags are viewable by authenticated users"
ON public.group_discussion_tags FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Group discussion tags can be created by discussion author"
ON public.group_discussion_tags FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.group_discussions gd
    WHERE gd.id = discussion_id AND gd.author_id = auth.uid()
  )
);

-- 16. RLS Policies for group_discussion_participants
CREATE POLICY "Discussion participants are viewable by group members"
ON public.group_discussion_participants FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.group_discussions gd
    JOIN public.group_members gm ON gm.group_id = gd.group_id
    WHERE gd.id = discussion_id AND gm.user_id = auth.uid() AND gm.status = 'active'
  )
);

CREATE POLICY "Users can join discussion participants"
ON public.group_discussion_participants FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 17. RLS Policies for discussion_poll_votes
CREATE POLICY "Poll votes are viewable by group members"
ON public.discussion_poll_votes FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.group_discussions gd
    JOIN public.group_members gm ON gm.group_id = gd.group_id
    WHERE gd.id = discussion_id AND gm.user_id = auth.uid() AND gm.status = 'active'
  )
);

CREATE POLICY "Users can vote in polls"
ON public.discussion_poll_votes FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 18. RLS Policies for group_events
CREATE POLICY "Public group events are viewable by all authenticated"
ON public.group_events FOR SELECT
TO authenticated
USING (
  is_public = true 
  OR EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = group_events.group_id AND gm.user_id = auth.uid() AND gm.status = 'active'
  )
);

CREATE POLICY "Group admins can create events"
ON public.group_events FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = group_id AND gm.user_id = auth.uid() AND gm.role IN ('owner', 'admin') AND gm.status = 'active'
  )
);

CREATE POLICY "Group admins can update events"
ON public.group_events FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = group_events.group_id AND gm.user_id = auth.uid() AND gm.role IN ('owner', 'admin') AND gm.status = 'active'
  )
);

CREATE POLICY "Group admins can delete events"
ON public.group_events FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = group_events.group_id AND gm.user_id = auth.uid() AND gm.role IN ('owner', 'admin') AND gm.status = 'active'
  )
);

-- 19. RLS Policies for group_event_attendees
CREATE POLICY "Event attendees are viewable by event viewers"
ON public.group_event_attendees FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.group_events ge
    WHERE ge.id = event_id AND (
      ge.is_public = true 
      OR EXISTS (
        SELECT 1 FROM public.group_members gm
        WHERE gm.group_id = ge.group_id AND gm.user_id = auth.uid() AND gm.status = 'active'
      )
    )
  )
);

CREATE POLICY "Users can RSVP to events"
ON public.group_event_attendees FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own RSVP"
ON public.group_event_attendees FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can remove their own RSVP"
ON public.group_event_attendees FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- 20. RLS Policies for group_event_discussions
CREATE POLICY "Event discussions are viewable by event viewers"
ON public.group_event_discussions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.group_events ge
    WHERE ge.id = event_id AND (
      ge.is_public = true 
      OR EXISTS (
        SELECT 1 FROM public.group_members gm
        WHERE gm.group_id = ge.group_id AND gm.user_id = auth.uid() AND gm.status = 'active'
      )
    )
  )
);

CREATE POLICY "Event viewers can create discussions"
ON public.group_event_discussions FOR INSERT
TO authenticated
WITH CHECK (author_id = auth.uid());

-- 21. RLS Policies for group_event_posts
CREATE POLICY "Event posts are viewable by event viewers"
ON public.group_event_posts FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.group_events ge
    WHERE ge.id = event_id AND (
      ge.is_public = true 
      OR EXISTS (
        SELECT 1 FROM public.group_members gm
        WHERE gm.group_id = ge.group_id AND gm.user_id = auth.uid() AND gm.status = 'active'
      )
    )
  )
);

CREATE POLICY "Event viewers can create posts"
ON public.group_event_posts FOR INSERT
TO authenticated
WITH CHECK (author_id = auth.uid());

-- 22. RLS Policies for group_memberships
CREATE POLICY "Users can view their own memberships"
ON public.group_memberships FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Group admins can view all memberships"
ON public.group_memberships FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = group_memberships.group_id AND gm.user_id = auth.uid() AND gm.role IN ('owner', 'admin') AND gm.status = 'active'
  )
);

-- 23. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_group_events_group_id ON public.group_events(group_id);
CREATE INDEX IF NOT EXISTS idx_group_events_is_public ON public.group_events(is_public);
CREATE INDEX IF NOT EXISTS idx_group_events_start_date ON public.group_events(start_date);
CREATE INDEX IF NOT EXISTS idx_group_event_attendees_event_id ON public.group_event_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_group_event_attendees_user_id ON public.group_event_attendees(user_id);
CREATE INDEX IF NOT EXISTS idx_group_discussion_tags_discussion_id ON public.group_discussion_tags(discussion_id);
CREATE INDEX IF NOT EXISTS idx_group_memberships_group_id ON public.group_memberships(group_id);
CREATE INDEX IF NOT EXISTS idx_group_memberships_user_id ON public.group_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_groups_join_type ON public.groups(join_type);
CREATE INDEX IF NOT EXISTS idx_groups_membership_type ON public.groups(membership_type);

-- 24. Insert some default discussion tags
INSERT INTO public.discussion_tags (name, color) VALUES
  ('General', '#6366f1'),
  ('Question', '#f59e0b'),
  ('Announcement', '#ef4444'),
  ('Tips & Tricks', '#10b981'),
  ('Discussion', '#8b5cf6'),
  ('Feedback', '#3b82f6'),
  ('Help Needed', '#ec4899'),
  ('Resource', '#14b8a6')
ON CONFLICT (name) DO NOTHING;