-- Update reject_pending_tool function to create notifications for users
CREATE OR REPLACE FUNCTION public.reject_pending_tool(tool_id_param uuid, admin_notes_param text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  tool_user_id uuid;
  tool_name text;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND account_type = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can reject tools';
  END IF;

  -- Get tool details for notification
  SELECT user_id, name INTO tool_user_id, tool_name
  FROM tools 
  WHERE id = tool_id_param AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tool not found or already processed';
  END IF;

  -- Update tool status to rejected
  UPDATE tools SET
    status = 'rejected',
    updated_at = now()
  WHERE id = tool_id_param;

  -- Create notification for the tool submitter
  INSERT INTO notifications (user_id, type, title, message, action_url, metadata)
  VALUES (
    tool_user_id,
    'tool_rejection',
    'Tool Submission Rejected',
    'Your tool submission "' || tool_name || '" has been rejected. Reason: ' || admin_notes_param,
    '/notifications',
    jsonb_build_object('tool_id', tool_id_param, 'tool_name', tool_name, 'rejection_reason', admin_notes_param)
  );
END;
$function$;