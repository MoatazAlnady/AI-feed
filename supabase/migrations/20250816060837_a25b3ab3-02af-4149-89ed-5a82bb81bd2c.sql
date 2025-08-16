-- Fix the last remaining functions with search paths
CREATE OR REPLACE FUNCTION public.update_trending_tools()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- This function can be called manually or by external schedulers
  -- to update trending tools based on engagement metrics
  
  -- Placeholder for trending logic - can be implemented when needed
  -- Example: UPDATE tools SET trending = true WHERE engagement_score > threshold;
  
  RAISE NOTICE 'Trending tools update function executed successfully';
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_trending_tools_weekly()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  PERFORM update_trending_tools();
  RAISE NOTICE 'Weekly trending tools update completed';
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_tool_edit_request(tool_id_param uuid, name_param text, description_param text, category_id_param uuid, subcategory_param text, website_param text, pricing_param text, features_param text[], pros_param text[], cons_param text[], tags_param text[])
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  request_id uuid;
  changes_json jsonb;
BEGIN
  -- Build the changes JSON
  changes_json := jsonb_build_object(
    'name', name_param,
    'description', description_param,
    'category_id', category_id_param,
    'subcategory', subcategory_param,
    'website', website_param,
    'pricing', pricing_param,
    'features', features_param,
    'pros', pros_param,
    'cons', cons_param,
    'tags', tags_param
  );

  -- Insert the edit request
  INSERT INTO tool_edit_requests (
    tool_id,
    user_id,
    requested_changes,
    status
  ) VALUES (
    tool_id_param,
    auth.uid(),
    changes_json,
    'pending'
  ) RETURNING id INTO request_id;

  RETURN request_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_pending_edit_requests(limit_param integer DEFAULT 50, offset_param integer DEFAULT 0)
RETURNS TABLE(id uuid, tool_id uuid, tool_name text, user_id uuid, user_name text, name text, description text, category_id uuid, category_name text, subcategory text, website text, pricing text, features text[], pros text[], cons text[], tags text[], created_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ter.id,
    ter.tool_id,
    t.name as tool_name,
    ter.user_id,
    COALESCE(up.full_name, 'Unknown User') as user_name,
    (ter.requested_changes->>'name')::text as name,
    (ter.requested_changes->>'description')::text as description,
    (ter.requested_changes->>'category_id')::uuid as category_id,
    tc.name as category_name,
    (ter.requested_changes->>'subcategory')::text as subcategory,
    (ter.requested_changes->>'website')::text as website,
    (ter.requested_changes->>'pricing')::text as pricing,
    CASE 
      WHEN ter.requested_changes->'features' IS NOT NULL 
      THEN ARRAY(SELECT jsonb_array_elements_text(ter.requested_changes->'features'))
      ELSE NULL
    END as features,
    CASE 
      WHEN ter.requested_changes->'pros' IS NOT NULL 
      THEN ARRAY(SELECT jsonb_array_elements_text(ter.requested_changes->'pros'))
      ELSE NULL
    END as pros,
    CASE 
      WHEN ter.requested_changes->'cons' IS NOT NULL 
      THEN ARRAY(SELECT jsonb_array_elements_text(ter.requested_changes->'cons'))
      ELSE NULL
    END as cons,
    CASE 
      WHEN ter.requested_changes->'tags' IS NOT NULL 
      THEN ARRAY(SELECT jsonb_array_elements_text(ter.requested_changes->'tags'))
      ELSE NULL
    END as tags,
    ter.created_at
  FROM tool_edit_requests ter
  LEFT JOIN tools t ON ter.tool_id = t.id
  LEFT JOIN user_profiles up ON ter.user_id = up.id
  LEFT JOIN tool_categories tc ON (ter.requested_changes->>'category_id')::uuid = tc.id
  WHERE ter.status = 'pending'
  ORDER BY ter.created_at DESC
  LIMIT limit_param
  OFFSET offset_param;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_pending_tools(limit_param integer DEFAULT 50, offset_param integer DEFAULT 0)
RETURNS TABLE(id uuid, name text, description text, category_id uuid, category_name text, subcategory text, website text, pricing text, features text[], pros text[], cons text[], tags text[], user_id uuid, user_name text, created_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.name,
    t.description,
    t.category_id,
    tc.name AS category_name,
    t.subcategory,
    t.website,
    t.pricing,
    t.features,
    t.pros,
    t.cons,
    t.tags,
    t.user_id,
    COALESCE(up.full_name, 'Unknown User') AS user_name,
    t.created_at
  FROM public.tools t
  LEFT JOIN public.user_profiles up ON t.user_id = up.id
  LEFT JOIN public.tool_categories tc ON t.category_id = tc.id
  WHERE t.status = 'pending'
  ORDER BY t.created_at DESC
  LIMIT limit_param
  OFFSET offset_param;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.user_profiles (
    id,
    full_name,
    account_type,
    newsletter_subscription
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'account_type', 'creator'),
    COALESCE((NEW.raw_user_meta_data->>'newsletter_subscription')::boolean, false)
  );
  RETURN NEW;
END;
$function$;