-- Fix Function Search Path Security Issues
-- All functions need to have SET search_path for security

-- Fix update_jobs_updated_at function
CREATE OR REPLACE FUNCTION public.update_jobs_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix update_trending_tools function
CREATE OR REPLACE FUNCTION public.update_trending_tools()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  -- This function can be called manually or by external schedulers
  -- to update trending tools based on engagement metrics
  
  -- Placeholder for trending logic - can be implemented when needed
  -- Example: UPDATE tools SET trending = true WHERE engagement_score > threshold;
  
  RAISE NOTICE 'Trending tools update function executed successfully';
END;
$function$;

-- Fix update_trending_tools_weekly function
CREATE OR REPLACE FUNCTION public.update_trending_tools_weekly()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  PERFORM update_trending_tools();
  RAISE NOTICE 'Weekly trending tools update completed';
END;
$function$;

-- Fix update_articles_updated_at function
CREATE OR REPLACE FUNCTION public.update_articles_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- Fix update_tools_updated_at function
CREATE OR REPLACE FUNCTION public.update_tools_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix handle_new_user function (already has SECURITY DEFINER, just add search_path)
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
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

-- Fix create_tool_edit_request function (already has SECURITY DEFINER, just add search_path)
CREATE OR REPLACE FUNCTION public.create_tool_edit_request(tool_id_param uuid, name_param text, description_param text, category_id_param uuid, subcategory_param text, website_param text, pricing_param text, features_param text[], pros_param text[], cons_param text[], tags_param text[])
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
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

-- Fix get_pending_edit_requests function (already has SECURITY DEFINER, just add search_path)
CREATE OR REPLACE FUNCTION public.get_pending_edit_requests(limit_param integer DEFAULT 50, offset_param integer DEFAULT 0)
 RETURNS TABLE(id uuid, tool_id uuid, tool_name text, user_id uuid, user_name text, name text, description text, category_id uuid, category_name text, subcategory text, website text, pricing text, features text[], pros text[], cons text[], tags text[], created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
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

-- Fix approve_tool_edit_request function (already has SECURITY DEFINER, just add search_path)
CREATE OR REPLACE FUNCTION public.approve_tool_edit_request(request_id_param uuid, admin_notes_param text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
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

-- Fix reject_tool_edit_request function (already has SECURITY DEFINER, just add search_path)
CREATE OR REPLACE FUNCTION public.reject_tool_edit_request(request_id_param uuid, admin_notes_param text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
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

-- Fix update_tool_edit_requests_updated_at function
CREATE OR REPLACE FUNCTION public.update_tool_edit_requests_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;