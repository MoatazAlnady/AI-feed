-- Create function to approve pending tools
CREATE OR REPLACE FUNCTION public.approve_pending_tool(
  tool_id_param uuid,
  admin_notes_param text DEFAULT NULL
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND account_type = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can approve tools';
  END IF;

  -- Update tool status to published
  UPDATE tools SET
    status = 'published',
    updated_at = now()
  WHERE id = tool_id_param AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tool not found or already processed';
  END IF;
END;
$function$

-- Create function to reject pending tools
CREATE OR REPLACE FUNCTION public.reject_pending_tool(
  tool_id_param uuid,
  admin_notes_param text
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND account_type = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can reject tools';
  END IF;

  -- Update tool status to rejected
  UPDATE tools SET
    status = 'rejected',
    updated_at = now()
  WHERE id = tool_id_param AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tool not found or already processed';
  END IF;
END;
$function$