-- =============================================================================
-- EVENTS TABLE CONSOLIDATION MIGRATION - Part 1: Add columns
-- =============================================================================

-- Step 1: Add new columns to the existing events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS creator_id UUID,
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS online_link TEXT,
ADD COLUMN IF NOT EXISTS is_live_stream BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS live_stream_url TEXT,
ADD COLUMN IF NOT EXISTS live_stream_room_id TEXT,
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS rsvp_email_template TEXT,
ADD COLUMN IF NOT EXISTS rsvp_email_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS start_time TIME,
ADD COLUMN IF NOT EXISTS end_time TIME;

-- Step 2: Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_events_group_id ON public.events(group_id);
CREATE INDEX IF NOT EXISTS idx_events_creator_id ON public.events(creator_id);
CREATE INDEX IF NOT EXISTS idx_events_is_online ON public.events(is_online);
CREATE INDEX IF NOT EXISTS idx_events_is_live_stream ON public.events(is_live_stream);
CREATE INDEX IF NOT EXISTS idx_events_timezone ON public.events(timezone);

-- Step 3: Add original_event_id to shared_posts for unified event sharing
ALTER TABLE public.shared_posts
ADD COLUMN IF NOT EXISTS original_event_id UUID REFERENCES public.events(id) ON DELETE SET NULL;

-- Step 4: Enable RLS on events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Step 5: Drop and recreate policies safely
DROP POLICY IF EXISTS "Anyone can view public events" ON public.events;
DROP POLICY IF EXISTS "Users can create events" ON public.events;
DROP POLICY IF EXISTS "Organizers can manage their events" ON public.events;
DROP POLICY IF EXISTS "Organizers can update their events" ON public.events;
DROP POLICY IF EXISTS "Organizers can delete their events" ON public.events;

-- Create comprehensive RLS policies
CREATE POLICY "Anyone can view public events" 
ON public.events 
FOR SELECT 
USING (
  is_public = true 
  OR creator_id = auth.uid() 
  OR organizer_id = auth.uid()
  OR (group_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_id = events.group_id 
    AND user_id = auth.uid()
  ))
);

CREATE POLICY "Users can create events" 
ON public.events 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Organizers can update their events" 
ON public.events 
FOR UPDATE 
USING (
  creator_id = auth.uid() 
  OR organizer_id = auth.uid()
  OR (group_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_id = events.group_id 
    AND user_id = auth.uid() 
    AND role IN ('admin', 'moderator', 'owner')
  ))
);

CREATE POLICY "Organizers can delete their events" 
ON public.events 
FOR DELETE 
USING (
  creator_id = auth.uid() 
  OR organizer_id = auth.uid()
  OR (group_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_id = events.group_id 
    AND user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  ))
);

-- Step 6: Create function to handle RSVP confirmation email trigger
CREATE OR REPLACE FUNCTION public.notify_event_rsvp()
RETURNS TRIGGER AS $$
DECLARE
  event_title TEXT;
  event_creator_id UUID;
BEGIN
  -- Get event details
  SELECT title, COALESCE(creator_id, organizer_id) INTO event_title, event_creator_id
  FROM public.events 
  WHERE id = NEW.event_id;
  
  -- Create notification for event creator if different from attendee
  IF event_creator_id IS NOT NULL AND event_creator_id != NEW.user_id THEN
    INSERT INTO public.notifications (user_id, title, message, type, action_url)
    VALUES (
      event_creator_id,
      'New RSVP',
      'Someone has RSVP''d to your event: ' || event_title,
      'event_rsvp',
      '/event/' || NEW.event_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for RSVP notifications
DROP TRIGGER IF EXISTS trigger_event_rsvp_notification ON public.event_attendees;
CREATE TRIGGER trigger_event_rsvp_notification
AFTER INSERT ON public.event_attendees
FOR EACH ROW
EXECUTE FUNCTION public.notify_event_rsvp();