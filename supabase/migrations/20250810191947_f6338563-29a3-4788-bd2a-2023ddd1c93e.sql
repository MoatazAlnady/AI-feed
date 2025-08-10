-- Fix migration: conditional policy creation without IF NOT EXISTS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND account_type = 'admin'
  );
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'user_profiles' 
      AND policyname = 'Public profiles are viewable by everyone'
  ) THEN
    EXECUTE 'DROP POLICY "Public profiles are viewable by everyone" ON public.user_profiles';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'user_profiles' 
      AND policyname = 'Users can read own profile'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can read own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = id)';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'user_profiles' 
      AND policyname = 'Admins can read all profiles'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins can read all profiles" ON public.user_profiles FOR SELECT USING (public.is_admin())';
  END IF;
END $$;

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
  bio text,
  website text,
  github text,
  linkedin text,
  twitter text,
  interests text[]
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
    up.bio,
    CASE WHEN up.contact_visible THEN up.website ELSE NULL END AS website,
    CASE WHEN up.contact_visible THEN up.github ELSE NULL END AS github,
    CASE WHEN up.contact_visible THEN up.linkedin ELSE NULL END AS linkedin,
    CASE WHEN up.contact_visible THEN up.twitter ELSE NULL END AS twitter,
    up.interests
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

CREATE OR REPLACE FUNCTION public.get_top_creators(limit_param integer DEFAULT 10)
RETURNS TABLE (
  id uuid,
  full_name text,
  profile_photo text,
  verified boolean,
  ai_nexus_top_voice boolean,
  job_title text,
  total_engagement integer
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    id,
    full_name,
    profile_photo,
    verified,
    ai_nexus_top_voice,
    job_title,
    total_engagement
  FROM public.user_profiles
  WHERE full_name IS NOT NULL AND full_name <> ''
  ORDER BY total_engagement DESC NULLS LAST
  LIMIT COALESCE(limit_param, 10);
$$;

CREATE OR REPLACE FUNCTION public.get_public_profiles_by_ids(ids uuid[])
RETURNS TABLE (
  id uuid,
  full_name text,
  profile_photo text,
  job_title text,
  verified boolean,
  ai_nexus_top_voice boolean,
  interests text[]
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    id,
    full_name,
    profile_photo,
    job_title,
    verified,
    ai_nexus_top_voice,
    interests
  FROM public.user_profiles
  WHERE id = ANY(ids);
$$;

CREATE OR REPLACE FUNCTION public.get_public_profiles_count(search text DEFAULT NULL)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*)::integer
  FROM public.user_profiles up
  WHERE (search IS NULL OR
         up.full_name ILIKE '%' || search || '%' OR
         up.job_title ILIKE '%' || search || '%' OR
         up.bio ILIKE '%' || search || '%');
$$;