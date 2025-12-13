-- Rename ai_nexus_top_voice column to ai_feed_top_voice
ALTER TABLE public.user_profiles 
RENAME COLUMN ai_nexus_top_voice TO ai_feed_top_voice;

-- Drop existing functions first
DROP FUNCTION IF EXISTS public.get_profile_by_handle_or_id(text);
DROP FUNCTION IF EXISTS public.get_public_profiles_by_ids(uuid[]);
DROP FUNCTION IF EXISTS public.get_top_creators(integer);
DROP FUNCTION IF EXISTS public.get_public_user_profiles(text, integer, integer);

-- Recreate get_profile_by_handle_or_id with new column name
CREATE OR REPLACE FUNCTION public.get_profile_by_handle_or_id(identifier text)
 RETURNS TABLE(id uuid, handle text, full_name text, job_title text, company text, bio text, location text, profile_photo text, cover_photo text, verified boolean, ai_feed_top_voice boolean, visibility text, total_engagement integer, total_reach integer, tools_submitted integer, articles_written integer, website text, github text, linkedin text, twitter text, interests text[], contact_visible boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    up.id, up.handle, up.full_name, up.job_title, up.company, up.bio, up.location,
    up.profile_photo, up.cover_photo, up.verified, up.ai_feed_top_voice, up.visibility,
    up.total_engagement, up.total_reach, up.tools_submitted, up.articles_written,
    CASE WHEN up.contact_visible THEN up.website ELSE NULL END,
    CASE WHEN up.contact_visible THEN up.github ELSE NULL END,
    CASE WHEN up.contact_visible THEN up.linkedin ELSE NULL END,
    CASE WHEN up.contact_visible THEN up.twitter ELSE NULL END,
    up.interests, up.contact_visible
  FROM public.user_profiles up
  WHERE up.handle = identifier
  LIMIT 1;
  
  IF NOT FOUND AND identifier ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN QUERY
    SELECT 
      up.id, up.handle, up.full_name, up.job_title, up.company, up.bio, up.location,
      up.profile_photo, up.cover_photo, up.verified, up.ai_feed_top_voice, up.visibility,
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

-- Recreate get_public_profiles_by_ids with new column name
CREATE OR REPLACE FUNCTION public.get_public_profiles_by_ids(ids uuid[])
 RETURNS TABLE(id uuid, handle text, full_name text, profile_photo text, job_title text, verified boolean, ai_feed_top_voice boolean, interests text[])
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    id, handle, full_name, profile_photo, job_title, verified, ai_feed_top_voice, interests
  FROM public.user_profiles
  WHERE id = ANY(ids);
$function$;

-- Recreate get_top_creators with new column name
CREATE OR REPLACE FUNCTION public.get_top_creators(limit_param integer DEFAULT 10)
 RETURNS TABLE(id uuid, handle text, full_name text, profile_photo text, verified boolean, ai_feed_top_voice boolean, job_title text, total_engagement integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    id, handle, full_name, profile_photo, verified, ai_feed_top_voice, job_title, total_engagement
  FROM public.user_profiles
  WHERE full_name IS NOT NULL AND full_name <> ''
  ORDER BY total_engagement DESC NULLS LAST
  LIMIT COALESCE(limit_param, 10);
$function$;

-- Recreate get_public_user_profiles with new column name
CREATE OR REPLACE FUNCTION public.get_public_user_profiles(search text DEFAULT NULL::text, limit_param integer DEFAULT 50, offset_param integer DEFAULT 0)
 RETURNS TABLE(id uuid, full_name text, job_title text, company text, profile_photo text, verified boolean, ai_feed_top_voice boolean, total_engagement integer, total_reach integer, location text, country text, city text, bio text, website text, github text, linkedin text, twitter text, interests text[], languages jsonb)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    up.id, up.full_name, up.job_title, up.company, up.profile_photo, up.verified,
    up.ai_feed_top_voice, up.total_engagement, up.total_reach, up.location,
    up.country, up.city, up.bio,
    CASE WHEN up.contact_visible THEN up.website ELSE NULL END AS website,
    CASE WHEN up.contact_visible THEN up.github ELSE NULL END AS github,
    CASE WHEN up.contact_visible THEN up.linkedin ELSE NULL END AS linkedin,
    CASE WHEN up.contact_visible THEN up.twitter ELSE NULL END AS twitter,
    up.interests, up.languages
  FROM public.user_profiles up
  WHERE 
    (search IS NULL OR
      up.full_name ILIKE '%' || search || '%' OR
      up.job_title ILIKE '%' || search || '%' OR
      up.bio ILIKE '%' || search || '%')
  ORDER BY up.total_engagement DESC NULLS LAST, up.created_at DESC
  LIMIT COALESCE(limit_param, 50)
  OFFSET COALESCE(offset_param, 0);
$function$;

-- Update site_content table values from AI Nexus to AI Feed
UPDATE public.site_content 
SET content_value = replace(content_value::text, 'AI Nexus', 'AI Feed')::jsonb
WHERE content_value::text LIKE '%AI Nexus%';