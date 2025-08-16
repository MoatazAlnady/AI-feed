-- Fix RLS issues for proper profile viewing
-- Allow creators to view other profiles
ALTER POLICY "Public can view user profiles" ON public.user_profiles
USING (true);

-- Create connection request notification trigger
CREATE OR REPLACE FUNCTION notify_connection_request()
RETURNS TRIGGER AS $$
BEGIN
  -- This function would handle real-time notifications for connection requests
  -- For now, we'll just log the event
  RAISE NOTICE 'Connection request created: % -> %', NEW.requester_id, NEW.recipient_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for connection requests
DROP TRIGGER IF EXISTS connection_request_notification ON connection_requests;
CREATE TRIGGER connection_request_notification
  AFTER INSERT ON connection_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_connection_request();