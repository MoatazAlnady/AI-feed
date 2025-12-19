-- Drop existing function first
DROP FUNCTION IF EXISTS public.are_users_connected(uuid, uuid);

-- Drop the problematic policy that exposes all profile data
DROP POLICY IF EXISTS "Public can view public profiles" ON public.user_profiles;

-- Create a helper function to check if users are connected
CREATE OR REPLACE FUNCTION public.are_users_connected(user_a uuid, user_b uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.connections
    WHERE (user_1_id = user_a AND user_2_id = user_b)
       OR (user_2_id = user_a AND user_1_id = user_b)
  );
$$;

-- Create a more restrictive policy for viewing profiles
-- Users can see public profiles and profiles of their connections
CREATE POLICY "Users can view accessible profiles"
ON public.user_profiles
FOR SELECT
USING (
  -- Own profile
  auth.uid() = id
  -- OR public profile (any authenticated user can see basic info of public profiles)
  OR (visibility = 'public' AND auth.uid() IS NOT NULL)
  -- OR connected users can see each other's profiles
  OR public.are_users_connected(auth.uid(), id)
);

-- Create a secure view that hides sensitive fields for non-owners/non-connections
DROP VIEW IF EXISTS public.user_profiles_safe;
CREATE VIEW public.user_profiles_safe AS
SELECT 
  id,
  full_name,
  display_name,
  handle,
  headline,
  job_title,
  company,
  company_text,
  company_page_id,
  bio,
  location,
  country,
  city,
  website,
  github,
  linkedin,
  twitter,
  profile_photo,
  avatar_url,
  cover_photo,
  interests,
  verified,
  ai_feed_top_voice,
  tools_submitted,
  articles_written,
  total_reach,
  total_engagement,
  account_type,
  visibility,
  followers_count,
  following_count,
  online_status_mode,
  is_premium,
  created_at,
  -- Sensitive fields: only show if viewing own profile or connected
  CASE 
    WHEN auth.uid() = id 
      OR public.are_users_connected(auth.uid(), id)
      OR (contact_visible = true AND visibility = 'public')
    THEN phone 
    ELSE NULL 
  END as phone,
  CASE 
    WHEN auth.uid() = id 
      OR public.are_users_connected(auth.uid(), id)
      OR (contact_visible = true AND visibility = 'public')
    THEN phone_country_code 
    ELSE NULL 
  END as phone_country_code,
  CASE 
    WHEN auth.uid() = id 
      OR public.are_users_connected(auth.uid(), id)
    THEN birth_date 
    ELSE NULL 
  END as birth_date,
  CASE 
    WHEN auth.uid() = id 
      OR public.are_users_connected(auth.uid(), id)
    THEN age 
    ELSE NULL 
  END as age,
  CASE 
    WHEN auth.uid() = id 
      OR public.are_users_connected(auth.uid(), id)
    THEN gender 
    ELSE NULL 
  END as gender,
  CASE 
    WHEN auth.uid() = id 
      OR public.are_users_connected(auth.uid(), id)
    THEN languages 
    ELSE NULL 
  END as languages,
  -- These fields are always owner-only
  CASE WHEN auth.uid() = id THEN newsletter_subscription ELSE NULL END as newsletter_subscription,
  CASE WHEN auth.uid() = id THEN notification_preferences ELSE NULL END as notification_preferences,
  CASE WHEN auth.uid() = id THEN newsletter_frequency ELSE NULL END as newsletter_frequency,
  CASE WHEN auth.uid() = id THEN default_post_visibility ELSE NULL END as default_post_visibility,
  CASE WHEN auth.uid() = id THEN default_post_groups ELSE NULL END as default_post_groups,
  -- Contact visibility flag (public)
  contact_visible,
  -- Role and ban status (admin-visible or own)
  CASE WHEN auth.uid() = id THEN role_id ELSE NULL END as role_id,
  CASE WHEN auth.uid() = id THEN is_banned ELSE NULL END as is_banned,
  CASE WHEN auth.uid() = id THEN banned_features ELSE NULL END as banned_features,
  CASE WHEN auth.uid() = id THEN admin_access_level ELSE NULL END as admin_access_level,
  CASE WHEN auth.uid() = id THEN organization_id ELSE NULL END as organization_id,
  updated_at,
  premium_until
FROM public.user_profiles;

-- Grant access to the view
GRANT SELECT ON public.user_profiles_safe TO authenticated;
GRANT SELECT ON public.user_profiles_safe TO anon;