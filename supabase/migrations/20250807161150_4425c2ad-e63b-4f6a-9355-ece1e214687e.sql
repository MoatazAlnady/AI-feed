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