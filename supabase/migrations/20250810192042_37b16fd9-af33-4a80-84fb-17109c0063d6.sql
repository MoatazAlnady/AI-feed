-- Extend public profiles RPC with additional non-sensitive fields used by UI
CREATE OR REPLACE FUNCTION public.get_public_user_profiles(
  search text DEFAULT NULL,
  limit_param integer DEFAULT 50,
  offset_param integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  full_name text,
  job_title text,
  company text,
  profile_photo text,
  verified boolean,
  ai_nexus_top_voice boolean,
  total_engagement integer,
  total_reach integer,
  location text,
  country text,
  city text,
  bio text,
  website text,
  github text,
  linkedin text,
  twitter text,
  interests text[],
  languages jsonb
) 
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    up.id,
    up.full_name,
    up.job_title,
    up.company,
    up.profile_photo,
    up.verified,
    up.ai_nexus_top_voice,
    up.total_engagement,
    up.total_reach,
    up.location,
    up.country,
    up.city,
    up.bio,
    CASE WHEN up.contact_visible THEN up.website ELSE NULL END AS website,
    CASE WHEN up.contact_visible THEN up.github ELSE NULL END AS github,
    CASE WHEN up.contact_visible THEN up.linkedin ELSE NULL END AS linkedin,
    CASE WHEN up.contact_visible THEN up.twitter ELSE NULL END AS twitter,
    up.interests,
    up.languages
  FROM public.user_profiles up
  WHERE 
    (search IS NULL OR
      up.full_name ILIKE '%' || search || '%' OR
      up.job_title ILIKE '%' || search || '%' OR
      up.bio ILIKE '%' || search || '%')
  ORDER BY up.total_engagement DESC NULLS LAST, up.created_at DESC
  LIMIT COALESCE(limit_param, 50)
  OFFSET COALESCE(offset_param, 0);
$$;