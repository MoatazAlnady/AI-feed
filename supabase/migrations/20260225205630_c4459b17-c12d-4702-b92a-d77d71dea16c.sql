
-- Drop the old function with its old signature first
DROP FUNCTION IF EXISTS public.get_pending_edit_requests(integer, integer);

-- Recreate with new return type (single sub_category_id + sub_category_name)
CREATE OR REPLACE FUNCTION public.get_pending_edit_requests(
  limit_param integer DEFAULT 50,
  offset_param integer DEFAULT 0
)
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
  sub_category_id uuid,
  sub_category_name text,
  website text,
  pricing text,
  features text[],
  pros text[],
  cons text[],
  tags text[],
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
    (ter.requested_changes->>'sub_category_id')::uuid as sub_category_id,
    sc.name as sub_category_name,
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
  LEFT JOIN categories tc ON (ter.requested_changes->>'category_id')::uuid = tc.id
  LEFT JOIN sub_categories sc ON (ter.requested_changes->>'sub_category_id')::uuid = sc.id
  WHERE ter.status = 'pending'
  ORDER BY ter.created_at DESC
  LIMIT limit_param
  OFFSET offset_param;
END;
$function$;
