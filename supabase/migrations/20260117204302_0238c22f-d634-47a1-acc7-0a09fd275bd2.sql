-- Add original_article_id column to shared_posts for article sharing
ALTER TABLE public.shared_posts 
ADD COLUMN IF NOT EXISTS original_article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE;

-- Add content_type column to distinguish between posts and articles
ALTER TABLE public.shared_posts 
ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'post';

-- Create index for article lookups
CREATE INDEX IF NOT EXISTS idx_shared_posts_article ON shared_posts(original_article_id) WHERE original_article_id IS NOT NULL;

-- Function to notify followers when a creator attends an event
CREATE OR REPLACE FUNCTION notify_followers_on_event_attendance()
RETURNS TRIGGER AS $$
DECLARE
  event_title TEXT;
  event_type_val TEXT;
  action_url TEXT;
  creator_name TEXT;
  notify_setting BOOLEAN;
  event_table TEXT;
BEGIN
  -- Only trigger on 'attending' status
  IF NEW.status != 'attending' THEN
    RETURN NEW;
  END IF;

  -- Get creator's notification settings
  SELECT 
    COALESCE((notification_preferences->>'notify_followers_event_attendance')::boolean, true),
    full_name
  INTO notify_setting, creator_name
  FROM user_profiles
  WHERE id = NEW.user_id;

  -- If creator disabled this notification, skip
  IF NOT notify_setting THEN
    RETURN NEW;
  END IF;

  -- Determine event type and get title based on which table triggered this
  event_table := TG_TABLE_NAME;
  
  IF event_table = 'group_event_attendees' THEN
    SELECT title INTO event_title FROM group_events WHERE id = NEW.event_id;
    event_type_val := 'group_event';
    action_url := '/event/' || NEW.event_id;
  ELSIF event_table = 'standalone_event_attendees' THEN
    SELECT title INTO event_title FROM standalone_events WHERE id = NEW.event_id;
    event_type_val := 'standalone_event';
    action_url := '/standalone-event/' || NEW.event_id;
  ELSIF event_table = 'event_attendees' THEN
    SELECT title INTO event_title FROM events WHERE id = NEW.event_id;
    event_type_val := 'event';
    action_url := '/event/' || NEW.event_id;
  END IF;

  -- If we couldn't find the event, exit gracefully
  IF event_title IS NULL THEN
    RETURN NEW;
  END IF;

  -- Insert notifications for all followers with 'notify' or 'favorite' status
  INSERT INTO notifications (user_id, type, title, message, action_url, metadata)
  SELECT 
    f.follower_id,
    'creator_event_attendance',
    creator_name || ' is attending an event',
    'Check out "' || event_title || '" - they might enjoy your company!',
    action_url,
    jsonb_build_object(
      'creator_id', NEW.user_id,
      'event_id', NEW.event_id,
      'event_type', event_type_val,
      'event_title', event_title
    )
  FROM follows f
  WHERE f.following_id = NEW.user_id 
    AND f.follow_status IN ('notify', 'favorite');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS notify_on_group_event_attendance ON group_event_attendees;
DROP TRIGGER IF EXISTS notify_on_standalone_event_attendance ON standalone_event_attendees;
DROP TRIGGER IF EXISTS notify_on_event_attendance ON event_attendees;

-- Create triggers on attendee tables
CREATE TRIGGER notify_on_group_event_attendance
  AFTER INSERT ON group_event_attendees
  FOR EACH ROW EXECUTE FUNCTION notify_followers_on_event_attendance();

CREATE TRIGGER notify_on_standalone_event_attendance
  AFTER INSERT ON standalone_event_attendees
  FOR EACH ROW EXECUTE FUNCTION notify_followers_on_event_attendance();

CREATE TRIGGER notify_on_event_attendance
  AFTER INSERT ON event_attendees
  FOR EACH ROW EXECUTE FUNCTION notify_followers_on_event_attendance();