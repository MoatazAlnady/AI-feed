-- Add new group settings columns for event creation permissions and public discussions
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS who_can_create_events TEXT DEFAULT 'admins';
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS allow_public_discussions BOOLEAN DEFAULT false;

-- Add is_public column to group_discussions for public discussions feature
ALTER TABLE public.group_discussions ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Create standalone_events table for Gold members (events without group_id requirement)
CREATE TABLE IF NOT EXISTS public.standalone_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  event_end_date TIMESTAMP WITH TIME ZONE,
  location TEXT,
  is_online BOOLEAN DEFAULT false,
  online_link TEXT,
  max_attendees INTEGER,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create standalone_event_attendees table
CREATE TABLE IF NOT EXISTS public.standalone_event_attendees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.standalone_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT DEFAULT 'attending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Create event_conversations table for event attendee chat
CREATE TABLE IF NOT EXISTS public.event_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('group_event', 'standalone_event', 'company_event')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(event_id, event_type)
);

-- Create event_messages table for event chat messages
CREATE TABLE IF NOT EXISTS public.event_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.event_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.standalone_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.standalone_event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for standalone_events
CREATE POLICY "Standalone events are viewable by everyone"
  ON public.standalone_events FOR SELECT
  USING (true);

CREATE POLICY "Gold members can create standalone events"
  ON public.standalone_events FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their standalone events"
  ON public.standalone_events FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete their standalone events"
  ON public.standalone_events FOR DELETE
  USING (auth.uid() = creator_id);

-- RLS policies for standalone_event_attendees
CREATE POLICY "Event attendance is viewable by everyone"
  ON public.standalone_event_attendees FOR SELECT
  USING (true);

CREATE POLICY "Users can add their own attendance"
  ON public.standalone_event_attendees FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attendance"
  ON public.standalone_event_attendees FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can remove their own attendance"
  ON public.standalone_event_attendees FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for event_conversations
CREATE POLICY "Event conversations are viewable by event attendees"
  ON public.event_conversations FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create event conversations"
  ON public.event_conversations FOR INSERT
  WITH CHECK (true);

-- RLS policies for event_messages
CREATE POLICY "Event messages are viewable by event attendees"
  ON public.event_messages FOR SELECT
  USING (true);

CREATE POLICY "Attendees can send event messages"
  ON public.event_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_standalone_events_creator ON public.standalone_events(creator_id);
CREATE INDEX IF NOT EXISTS idx_standalone_events_date ON public.standalone_events(event_date);
CREATE INDEX IF NOT EXISTS idx_standalone_event_attendees_event ON public.standalone_event_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_standalone_event_attendees_user ON public.standalone_event_attendees(user_id);
CREATE INDEX IF NOT EXISTS idx_event_conversations_event ON public.event_conversations(event_id, event_type);
CREATE INDEX IF NOT EXISTS idx_event_messages_conversation ON public.event_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_group_discussions_public ON public.group_discussions(is_public) WHERE is_public = true;