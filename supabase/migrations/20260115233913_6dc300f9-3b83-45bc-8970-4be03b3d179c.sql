-- 1. Backfill tools.sub_category_ids from tool_sub_categories junction table
UPDATE tools t
SET sub_category_ids = (
  SELECT COALESCE(array_agg(tsc.sub_category_id), ARRAY[]::uuid[])
  FROM tool_sub_categories tsc
  WHERE tsc.tool_id = t.id
)
WHERE EXISTS (
  SELECT 1 FROM tool_sub_categories tsc WHERE tsc.tool_id = t.id
);

-- 2. Update the check_subcategory_deletion function to use junction table instead of tools.sub_category_ids
CREATE OR REPLACE FUNCTION check_subcategory_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if any tools are assigned to this sub-category via the junction table
  IF EXISTS (
    SELECT 1 FROM tool_sub_categories WHERE sub_category_id = OLD.id
  ) THEN
    RAISE EXCEPTION 'Cannot delete sub-category: tools are still assigned to it';
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 3. Fix tool_sub_categories INSERT RLS policy to only allow tool owners or admins
DROP POLICY IF EXISTS "Users can insert tool sub-categories for their own tools" ON tool_sub_categories;

CREATE POLICY "Users can insert tool sub-categories for their own tools" ON tool_sub_categories
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tools WHERE tools.id = tool_id AND tools.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.account_type = 'admin'
    )
  );

-- 4. Update create_tool_edit_request to accept sub_category_ids as UUID array
CREATE OR REPLACE FUNCTION public.create_tool_edit_request(
  tool_id_param uuid,
  name_param text,
  description_param text,
  category_id_param uuid,
  subcategory_param text,
  website_param text,
  pricing_param text,
  features_param text[],
  pros_param text[],
  cons_param text[],
  tags_param text[],
  sub_category_ids_param uuid[] DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  request_id uuid;
  changes_json jsonb;
BEGIN
  -- Build the changes JSON with sub_category_ids as array
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
    'tags', tags_param,
    'sub_category_ids', sub_category_ids_param
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

-- 5. Drop the old function first, then recreate with new return type
DROP FUNCTION IF EXISTS public.get_pending_edit_requests(integer, integer);

CREATE FUNCTION public.get_pending_edit_requests(limit_param integer DEFAULT 50, offset_param integer DEFAULT 0)
RETURNS TABLE(
  id uuid,
  tool_id uuid,
  tool_name text,
  user_id uuid,
  user_name text,
  name text,
  description text,
  category_id uuid,
  category_name text,
  subcategory text,
  website text,
  pricing text,
  features text[],
  pros text[],
  cons text[],
  tags text[],
  sub_category_ids uuid[],
  created_at timestamp with time zone
)
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
    CASE 
      WHEN ter.requested_changes->'sub_category_ids' IS NOT NULL 
      THEN ARRAY(SELECT (jsonb_array_elements_text(ter.requested_changes->'sub_category_ids'))::uuid)
      ELSE NULL
    END as sub_category_ids,
    ter.created_at
  FROM tool_edit_requests ter
  LEFT JOIN tools t ON ter.tool_id = t.id
  LEFT JOIN user_profiles up ON ter.user_id = up.id
  LEFT JOIN categories tc ON (ter.requested_changes->>'category_id')::uuid = tc.id
  WHERE ter.status = 'pending'
  ORDER BY ter.created_at DESC
  LIMIT limit_param
  OFFSET offset_param;
END;
$function$;

-- 6. Update approve_tool_edit_request to manage junction table
CREATE OR REPLACE FUNCTION public.approve_tool_edit_request(request_id_param uuid, admin_notes_param text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  edit_request record;
  new_sub_category_ids uuid[];
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

  -- Apply the changes to the tool (excluding sub_category_ids which goes to junction table)
  UPDATE tools SET
    name = COALESCE((edit_request.requested_changes->>'name')::text, name),
    description = COALESCE((edit_request.requested_changes->>'description')::text, description),
    category_id = COALESCE((edit_request.requested_changes->>'category_id')::uuid, category_id),
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

  -- Handle sub_category_ids via junction table
  IF edit_request.requested_changes->'sub_category_ids' IS NOT NULL THEN
    -- Extract the new sub_category_ids
    new_sub_category_ids := ARRAY(
      SELECT (jsonb_array_elements_text(edit_request.requested_changes->'sub_category_ids'))::uuid
    );
    
    -- Delete old relationships
    DELETE FROM tool_sub_categories WHERE tool_id = edit_request.tool_id;
    
    -- Insert new relationships
    IF array_length(new_sub_category_ids, 1) > 0 THEN
      INSERT INTO tool_sub_categories (tool_id, sub_category_id)
      SELECT edit_request.tool_id, unnest(new_sub_category_ids);
    END IF;
    
    -- Update the cache column on tools table
    UPDATE tools SET sub_category_ids = new_sub_category_ids WHERE id = edit_request.tool_id;
  END IF;

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

-- 7. Create a trigger function to keep tools.sub_category_ids in sync with junction table
CREATE OR REPLACE FUNCTION sync_tool_sub_category_ids()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE tools 
    SET sub_category_ids = (
      SELECT COALESCE(array_agg(tsc.sub_category_id), ARRAY[]::uuid[])
      FROM tool_sub_categories tsc
      WHERE tsc.tool_id = NEW.tool_id
    )
    WHERE id = NEW.tool_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE tools 
    SET sub_category_ids = (
      SELECT COALESCE(array_agg(tsc.sub_category_id), ARRAY[]::uuid[])
      FROM tool_sub_categories tsc
      WHERE tsc.tool_id = OLD.tool_id
    )
    WHERE id = OLD.tool_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS sync_tool_sub_categories_trigger ON tool_sub_categories;
CREATE TRIGGER sync_tool_sub_categories_trigger
AFTER INSERT OR DELETE ON tool_sub_categories
FOR EACH ROW
EXECUTE FUNCTION sync_tool_sub_category_ids();