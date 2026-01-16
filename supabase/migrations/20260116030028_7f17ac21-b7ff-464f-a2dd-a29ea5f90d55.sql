-- Drop and recreate the RPC function with premium fields
DROP FUNCTION IF EXISTS public.get_public_profiles_by_ids(uuid[]);

CREATE FUNCTION public.get_public_profiles_by_ids(ids uuid[])
RETURNS TABLE(
  id uuid,
  handle text,
  full_name text,
  profile_photo text,
  job_title text,
  verified boolean,
  ai_feed_top_voice boolean,
  interests text[],
  premium_tier text,
  role_id integer,
  account_type text
) AS $$
  SELECT 
    id, handle, full_name, profile_photo, job_title, verified, ai_feed_top_voice, interests,
    premium_tier, role_id::integer, account_type
  FROM public.user_profiles
  WHERE id = ANY(ids);
$$ LANGUAGE sql STABLE SECURITY DEFINER;