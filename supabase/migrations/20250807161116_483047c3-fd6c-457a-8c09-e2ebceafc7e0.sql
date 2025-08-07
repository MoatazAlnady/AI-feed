-- Create function to get pending tools with user information
CREATE OR REPLACE FUNCTION public.get_pending_tools(limit_param integer DEFAULT 50, offset_param integer DEFAULT 0)
 RETURNS TABLE(
   id uuid, 
   name text, 
   description text, 
   category_id uuid,
   category_name text,
   subcategory text,
   website text, 
   logo_url text,
   pricing text, 
   features text[], 
   pros text[], 
   cons text[], 
   tags text[],
   user_id uuid,
   user_name text,
   created_at timestamp with time zone
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.name,
    t.description,
    t.category_id,
    tc.name as category_name,
    t.subcategory,
    t.website,
    t.logo_url,
    t.pricing,
    t.features,
    t.pros,
    t.cons,
    t.tags,
    t.user_id,
    COALESCE(up.full_name, 'Unknown User') as user_name,
    t.created_at
  FROM tools t
  LEFT JOIN user_profiles up ON t.user_id = up.id
  LEFT JOIN tool_categories tc ON t.category_id = tc.id
  WHERE t.status = 'pending'
  ORDER BY t.created_at DESC
  LIMIT limit_param
  OFFSET offset_param;
END;
$function$

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