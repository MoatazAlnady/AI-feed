-- Phase 1B: Fix remaining database security issues

-- 1. Drop and recreate tool_ratings_v view without SECURITY DEFINER
DROP VIEW IF EXISTS public.tool_ratings_v;

CREATE VIEW public.tool_ratings_v AS
SELECT 
  tool_id,
  AVG(rating) as avg_rating,
  COUNT(*) as reviews_count
FROM public.tool_reviews
WHERE status = 'approved'
GROUP BY tool_id;

-- 2. Fix get_profile_by_handle_or_id function - Add SET search_path = public
CREATE OR REPLACE FUNCTION public.get_profile_by_handle_or_id(identifier text)
 RETURNS TABLE(id uuid, handle text, full_name text, job_title text, company text, bio text, location text, profile_photo text, cover_photo text, verified boolean, ai_nexus_top_voice boolean, visibility text, total_engagement integer, total_reach integer, tools_submitted integer, articles_written integer, website text, github text, linkedin text, twitter text, interests text[], contact_visible boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  -- First try to find by handle
  RETURN QUERY
  SELECT 
    up.id, up.handle, up.full_name, up.job_title, up.company, up.bio, up.location,
    up.profile_photo, up.cover_photo, up.verified, up.ai_nexus_top_voice, up.visibility,
    up.total_engagement, up.total_reach, up.tools_submitted, up.articles_written,
    CASE WHEN up.contact_visible THEN up.website ELSE NULL END,
    CASE WHEN up.contact_visible THEN up.github ELSE NULL END,
    CASE WHEN up.contact_visible THEN up.linkedin ELSE NULL END,
    CASE WHEN up.contact_visible THEN up.twitter ELSE NULL END,
    up.interests, up.contact_visible
  FROM public.user_profiles up
  WHERE up.handle = identifier
  LIMIT 1;
  
  -- If not found by handle and identifier looks like UUID, try by ID
  IF NOT FOUND AND identifier ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN QUERY
    SELECT 
      up.id, up.handle, up.full_name, up.job_title, up.company, up.bio, up.location,
      up.profile_photo, up.cover_photo, up.verified, up.ai_nexus_top_voice, up.visibility,
      up.total_engagement, up.total_reach, up.tools_submitted, up.articles_written,
      CASE WHEN up.contact_visible THEN up.website ELSE NULL END,
      CASE WHEN up.contact_visible THEN up.github ELSE NULL END,
      CASE WHEN up.contact_visible THEN up.linkedin ELSE NULL END,
      CASE WHEN up.contact_visible THEN up.twitter ELSE NULL END,
      up.interests, up.contact_visible
    FROM public.user_profiles up
    WHERE up.id = identifier::uuid
    LIMIT 1;
  END IF;
END;
$function$;