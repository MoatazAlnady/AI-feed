-- Update user_profiles_safe view to include premium_tier and expose role_id for admin detection
DROP VIEW IF EXISTS public.user_profiles_safe;

CREATE VIEW public.user_profiles_safe
WITH (security_invoker = on) AS
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
    premium_tier,
    premium_until,
    role_id,
    created_at,
    updated_at,
    contact_visible,
    CASE
        WHEN ((auth.uid() = id) OR are_users_connected(auth.uid(), id) OR ((contact_visible = true) AND (visibility = 'public'::text))) THEN phone
        ELSE NULL::text
    END AS phone,
    CASE
        WHEN ((auth.uid() = id) OR are_users_connected(auth.uid(), id) OR ((contact_visible = true) AND (visibility = 'public'::text))) THEN phone_country_code
        ELSE NULL::text
    END AS phone_country_code,
    CASE
        WHEN ((auth.uid() = id) OR are_users_connected(auth.uid(), id)) THEN birth_date
        ELSE NULL::date
    END AS birth_date,
    CASE
        WHEN ((auth.uid() = id) OR are_users_connected(auth.uid(), id)) THEN age
        ELSE NULL::integer
    END AS age,
    CASE
        WHEN ((auth.uid() = id) OR are_users_connected(auth.uid(), id)) THEN gender
        ELSE NULL::text
    END AS gender,
    CASE
        WHEN ((auth.uid() = id) OR are_users_connected(auth.uid(), id)) THEN languages
        ELSE NULL::jsonb
    END AS languages,
    CASE
        WHEN (auth.uid() = id) THEN newsletter_subscription
        ELSE NULL::boolean
    END AS newsletter_subscription,
    CASE
        WHEN (auth.uid() = id) THEN notification_preferences
        ELSE NULL::jsonb
    END AS notification_preferences,
    CASE
        WHEN (auth.uid() = id) THEN newsletter_frequency
        ELSE NULL::text
    END AS newsletter_frequency,
    CASE
        WHEN (auth.uid() = id) THEN default_post_visibility
        ELSE NULL::text
    END AS default_post_visibility,
    CASE
        WHEN (auth.uid() = id) THEN default_post_groups
        ELSE NULL::uuid[]
    END AS default_post_groups,
    CASE
        WHEN (auth.uid() = id) THEN is_banned
        ELSE NULL::boolean
    END AS is_banned,
    CASE
        WHEN (auth.uid() = id) THEN banned_features
        ELSE NULL::jsonb
    END AS banned_features,
    CASE
        WHEN (auth.uid() = id) THEN admin_access_level
        ELSE NULL::text
    END AS admin_access_level,
    CASE
        WHEN (auth.uid() = id) THEN organization_id
        ELSE NULL::uuid
    END AS organization_id
FROM user_profiles;