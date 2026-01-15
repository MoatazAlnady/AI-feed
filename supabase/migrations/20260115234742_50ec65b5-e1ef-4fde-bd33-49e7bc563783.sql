-- Step 1: Drop existing functions that need signature changes
DROP FUNCTION IF EXISTS public.approve_tool_edit_request(UUID, TEXT);

-- Step 2: Update create_tool_edit_request to not include subcategory text
CREATE OR REPLACE FUNCTION public.create_tool_edit_request(
  tool_id_param UUID,
  name_param TEXT,
  description_param TEXT,
  category_id_param UUID,
  sub_category_ids_param UUID[],
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
  -- Get category name
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
      'sub_category_ids', sub_category_ids_param,
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

-- Step 3: Recreate approve_tool_edit_request to not update subcategory column
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
  -- Get request details
  SELECT tool_id, requested_changes INTO tool_id_val, changes
  FROM tool_edit_requests
  WHERE id = request_id_param AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or already processed';
  END IF;
  
  -- Update the tool (without subcategory text field)
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
  
  -- Handle sub_category_ids from the request
  IF changes ? 'sub_category_ids' THEN
    sub_cat_ids := ARRAY(SELECT jsonb_array_elements_text(changes->'sub_category_ids')::UUID);
    
    -- Delete existing relationships
    DELETE FROM tool_sub_categories WHERE tool_id = tool_id_val;
    
    -- Insert new relationships
    INSERT INTO tool_sub_categories (tool_id, sub_category_id)
    SELECT tool_id_val, unnest(sub_cat_ids);
  END IF;
  
  -- Update request status
  UPDATE tool_edit_requests SET
    status = 'approved',
    admin_notes = admin_notes_param,
    reviewed_at = NOW(),
    reviewed_by = auth.uid()
  WHERE id = request_id_param;
  
  RETURN TRUE;
END;
$$;

-- Step 4: Drop the subcategory column from tools table
ALTER TABLE public.tools DROP COLUMN IF EXISTS subcategory;