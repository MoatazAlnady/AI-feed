DROP FUNCTION IF EXISTS public.get_top_creators(integer);

CREATE FUNCTION public.get_top_creators(limit_param integer DEFAULT 10)
RETURNS TABLE(
  id uuid,
  handle text,
  full_name text,
  profile_photo text,
  verified boolean,
  ai_feed_top_voice boolean,
  job_title text,
  total_engagement integer,
  premium_tier text
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    id, handle, full_name, profile_photo, verified, ai_feed_top_voice, job_title, total_engagement, premium_tier
  FROM public.user_profiles
  WHERE full_name IS NOT NULL AND full_name <> ''
  ORDER BY total_engagement DESC NULLS LAST
  LIMIT COALESCE(limit_param, 10);
$$;