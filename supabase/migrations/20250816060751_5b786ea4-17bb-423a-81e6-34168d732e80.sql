-- Fix final remaining database functions with proper search paths
CREATE OR REPLACE FUNCTION public.update_shared_post_reach()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  new_reach_score DECIMAL;
BEGIN
  -- Calculate new reach score for the original post when it gets shared
  new_reach_score := calculate_post_reach_score(NEW.original_post_id);
  
  -- Update the original post's reach score
  UPDATE posts 
  SET reach_score = new_reach_score 
  WHERE id = NEW.original_post_id;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.approve_pending_tool(tool_id_param uuid, admin_notes_param text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
$function$;

CREATE OR REPLACE FUNCTION public.reject_pending_tool(tool_id_param uuid, admin_notes_param text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
$function$;

CREATE OR REPLACE FUNCTION public.approve_tool_edit_request(request_id_param uuid, admin_notes_param text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  edit_request record;
  changes_json jsonb;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND account_type = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can approve edit requests';
  END IF;

  -- Get the edit request
  SELECT * INTO edit_request
  FROM tool_edit_requests
  WHERE id = request_id_param AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Edit request not found or already processed';
  END IF;

  -- Apply the changes to the tool
  UPDATE tools SET
    name = COALESCE((edit_request.requested_changes->>'name')::text, name),
    description = COALESCE((edit_request.requested_changes->>'description')::text, description),
    category_id = COALESCE((edit_request.requested_changes->>'category_id')::uuid, category_id),
    subcategory = COALESCE((edit_request.requested_changes->>'subcategory')::text, subcategory),
    website = COALESCE((edit_request.requested_changes->>'website')::text, website),
    pricing = COALESCE((edit_request.requested_changes->>'pricing')::text, pricing),
    features = CASE 
      WHEN edit_request.requested_changes->'features' IS NOT NULL 
      THEN ARRAY(SELECT jsonb_array_elements_text(edit_request.requested_changes->'features'))
      ELSE features
    END,
    pros = CASE 
      WHEN edit_request.requested_changes->'pros' IS NOT NULL 
      THEN ARRAY(SELECT jsonb_array_elements_text(edit_request.requested_changes->'pros'))
      ELSE pros
    END,
    cons = CASE 
      WHEN edit_request.requested_changes->'cons' IS NOT NULL 
      THEN ARRAY(SELECT jsonb_array_elements_text(edit_request.requested_changes->'cons'))
      ELSE cons
    END,
    tags = CASE 
      WHEN edit_request.requested_changes->'tags' IS NOT NULL 
      THEN ARRAY(SELECT jsonb_array_elements_text(edit_request.requested_changes->'tags'))
      ELSE tags
    END,
    updated_at = now()
  WHERE id = edit_request.tool_id;

  -- Update the edit request status
  UPDATE tool_edit_requests SET
    status = 'approved',
    admin_notes = admin_notes_param,
    reviewed_at = now(),
    reviewed_by = auth.uid(),
    updated_at = now()
  WHERE id = request_id_param;
END;
$function$;

CREATE OR REPLACE FUNCTION public.reject_tool_edit_request(request_id_param uuid, admin_notes_param text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND account_type = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can reject edit requests';
  END IF;

  -- Update the edit request status
  UPDATE tool_edit_requests SET
    status = 'rejected',
    admin_notes = admin_notes_param,
    reviewed_at = now(),
    reviewed_by = auth.uid(),
    updated_at = now()
  WHERE id = request_id_param AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Edit request not found or already processed';
  END IF;
END;
$function$;