-- Drop the existing view
DROP VIEW IF EXISTS public.user_profiles_safe;

-- Recreate the view with SECURITY INVOKER (not SECURITY DEFINER)
CREATE VIEW public.user_profiles_safe
WITH (security_invoker = true)
AS SELECT 
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
  -- Sensitive fields: only show to owner, connected users, or if contact_visible + public
  CASE 
    WHEN auth.uid() = id OR are_users_connected(auth.uid(), id) OR (contact_visible = true AND visibility = 'public') 
    THEN phone 
    ELSE NULL 
  END AS phone,
  CASE 
    WHEN auth.uid() = id OR are_users_connected(auth.uid(), id) OR (contact_visible = true AND visibility = 'public') 
    THEN phone_country_code 
    ELSE NULL 
  END AS phone_country_code,
  -- Private fields: only show to owner or connected users
  CASE WHEN auth.uid() = id OR are_users_connected(auth.uid(), id) THEN birth_date ELSE NULL END AS birth_date,
  CASE WHEN auth.uid() = id OR are_users_connected(auth.uid(), id) THEN age ELSE NULL END AS age,
  CASE WHEN auth.uid() = id OR are_users_connected(auth.uid(), id) THEN gender ELSE NULL END AS gender,
  CASE WHEN auth.uid() = id OR are_users_connected(auth.uid(), id) THEN languages ELSE NULL END AS languages,
  -- Owner-only fields
  CASE WHEN auth.uid() = id THEN newsletter_subscription ELSE NULL END AS newsletter_subscription,
  CASE WHEN auth.uid() = id THEN notification_preferences ELSE NULL END AS notification_preferences,
  CASE WHEN auth.uid() = id THEN newsletter_frequency ELSE NULL END AS newsletter_frequency,
  CASE WHEN auth.uid() = id THEN default_post_visibility ELSE NULL END AS default_post_visibility,
  CASE WHEN auth.uid() = id THEN default_post_groups ELSE NULL END AS default_post_groups,
  contact_visible,
  CASE WHEN auth.uid() = id THEN role_id ELSE NULL END AS role_id,
  CASE WHEN auth.uid() = id THEN is_banned ELSE NULL END AS is_banned,
  CASE WHEN auth.uid() = id THEN banned_features ELSE NULL END AS banned_features,
  CASE WHEN auth.uid() = id THEN admin_access_level ELSE NULL END AS admin_access_level,
  CASE WHEN auth.uid() = id THEN organization_id ELSE NULL END AS organization_id,
  updated_at,
  premium_until
FROM public.user_profiles;

-- Grant access to authenticated and anonymous users
GRANT SELECT ON public.user_profiles_safe TO authenticated;
GRANT SELECT ON public.user_profiles_safe TO anon;