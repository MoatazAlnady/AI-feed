-- Step 1: Rename the column from sub_category_ids to sub_category_id
ALTER TABLE public.tools RENAME COLUMN sub_category_ids TO sub_category_id;

-- Step 2: Drop and recreate the sync function with new column name
DROP FUNCTION IF EXISTS public.sync_tool_sub_category_ids() CASCADE;

CREATE OR REPLACE FUNCTION public.sync_tool_sub_category_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE tools 
    SET sub_category_id = (
      SELECT COALESCE(array_agg(tsc.sub_category_id), ARRAY[]::uuid[])
      FROM tool_sub_categories tsc
      WHERE tsc.tool_id = NEW.tool_id
    )
    WHERE id = NEW.tool_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE tools 
    SET sub_category_id = (
      SELECT COALESCE(array_agg(tsc.sub_category_id), ARRAY[]::uuid[])
      FROM tool_sub_categories tsc
      WHERE tsc.tool_id = OLD.tool_id
    )
    WHERE id = OLD.tool_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Step 3: Recreate the trigger with the new function
CREATE TRIGGER sync_tool_sub_category_id_trigger
AFTER INSERT OR DELETE ON public.tool_sub_categories
FOR EACH ROW
EXECUTE FUNCTION public.sync_tool_sub_category_id();

-- Step 4: Drop and recreate create_tool_edit_request with renamed parameter
DROP FUNCTION IF EXISTS public.create_tool_edit_request(uuid, text, text, uuid, uuid[], text, text, text[], text[], text[], text[]);
DROP FUNCTION IF EXISTS public.create_tool_edit_request(uuid, text, text, uuid, text, text, text, text[], text[], text[], text[]);
DROP FUNCTION IF EXISTS public.create_tool_edit_request(uuid, text, text, uuid, text, text, text, text[], text[], text[], text[], uuid[]);

CREATE OR REPLACE FUNCTION public.create_tool_edit_request(
  tool_id_param UUID,
  name_param TEXT,
  description_param TEXT,
  category_id_param UUID,
  sub_category_id_param UUID[],
  website_param TEXT,
  pricing_param TEXT,
  features_param TEXT[],
  pros_param TEXT[],
  cons_param TEXT[],
  tags_param TEXT[]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_id UUID;
  category_name_val TEXT;
BEGIN
  SELECT name INTO category_name_val FROM categories WHERE id = category_id_param;
  
  INSERT INTO tool_edit_requests (
    tool_id,
    user_id,
    requested_changes,
    status
  )
  VALUES (
    tool_id_param,
    auth.uid(),
    jsonb_build_object(
      'name', name_param,
      'description', description_param,
      'category_id', category_id_param,
      'category_name', category_name_val,
      'sub_category_id', sub_category_id_param,
      'website', website_param,
      'pricing', pricing_param,
      'features', features_param,
      'pros', pros_param,
      'cons', cons_param,
      'tags', tags_param
    ),
    'pending'
  )
  RETURNING id INTO request_id;
  
  RETURN request_id;
END;
$$;

-- Step 5: Update get_pending_edit_requests to use new key name
DROP FUNCTION IF EXISTS public.get_pending_edit_requests(integer, integer);

CREATE OR REPLACE FUNCTION public.get_pending_edit_requests(
  limit_param INTEGER DEFAULT 50,
  offset_param INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  tool_id UUID,
  tool_name TEXT,
  user_id UUID,
  user_name TEXT,
  name TEXT,
  description TEXT,
  category_id UUID,
  category_name TEXT,
  subcategory TEXT,
  website TEXT,
  pricing TEXT,
  features TEXT[],
  pros TEXT[],
  cons TEXT[],
  tags TEXT[],
  sub_category_id UUID[],
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
      WHEN ter.requested_changes->'sub_category_id' IS NOT NULL 
      THEN ARRAY(SELECT (jsonb_array_elements_text(ter.requested_changes->'sub_category_id'))::uuid)
      ELSE NULL
    END as sub_category_id,
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
$$;

-- Step 6: Update approve_tool_edit_request to use new key name
DROP FUNCTION IF EXISTS public.approve_tool_edit_request(uuid, text);

CREATE OR REPLACE FUNCTION public.approve_tool_edit_request(
  request_id_param UUID,
  admin_notes_param TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tool_id_val UUID;
  changes JSONB;
  sub_cat_ids UUID[];
BEGIN
  SELECT tool_id, requested_changes INTO tool_id_val, changes
  FROM tool_edit_requests
  WHERE id = request_id_param AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or already processed';
  END IF;
  
  UPDATE tools SET
    name = COALESCE(changes->>'name', name),
    description = COALESCE(changes->>'description', description),
    category_id = COALESCE((changes->>'category_id')::UUID, category_id),
    website = COALESCE(changes->>'website', website),
    pricing = COALESCE(changes->>'pricing', pricing),
    features = COALESCE(ARRAY(SELECT jsonb_array_elements_text(changes->'features')), features),
    pros = COALESCE(ARRAY(SELECT jsonb_array_elements_text(changes->'pros')), pros),
    cons = COALESCE(ARRAY(SELECT jsonb_array_elements_text(changes->'cons')), cons),
    tags = COALESCE(ARRAY(SELECT jsonb_array_elements_text(changes->'tags')), tags),
    updated_at = NOW()
  WHERE id = tool_id_val;
  
  IF changes ? 'sub_category_id' THEN
    sub_cat_ids := ARRAY(SELECT jsonb_array_elements_text(changes->'sub_category_id')::UUID);
    
    DELETE FROM tool_sub_categories WHERE tool_id = tool_id_val;
    
    INSERT INTO tool_sub_categories (tool_id, sub_category_id)
    SELECT tool_id_val, unnest(sub_cat_ids);
  END IF;
  
  UPDATE tool_edit_requests SET
    status = 'approved',
    admin_notes = admin_notes_param,
    reviewed_at = NOW(),
    reviewed_by = auth.uid()
  WHERE id = request_id_param;
  
  RETURN TRUE;
END;
$$;