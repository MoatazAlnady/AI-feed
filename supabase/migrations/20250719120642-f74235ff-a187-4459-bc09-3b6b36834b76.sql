-- Add banned_features column for granular bans
ALTER TABLE public.user_profiles 
ADD COLUMN banned_features JSONB DEFAULT '[]'::jsonb;

-- Update RLS policies to prevent banned users from specific actions

-- Prevent banned users from commenting
DROP POLICY IF EXISTS "Users can create their own comments" ON public.post_comments;
CREATE POLICY "Non-banned users can create their own comments" ON public.post_comments
FOR INSERT WITH CHECK (
  auth.uid() = user_id 
  AND NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND (
      is_banned = true 
      OR banned_features ? 'comments'
    )
  )
);

-- Prevent banned users from creating articles
DROP POLICY IF EXISTS "Users can create articles" ON public.articles;
CREATE POLICY "Non-banned users can create articles" ON public.articles
FOR INSERT WITH CHECK (
  auth.uid() = user_id 
  AND NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND (
      is_banned = true 
      OR banned_features ? 'articles'
    )
  )
);

-- Prevent banned users from creating tools
DROP POLICY IF EXISTS "Users can create their own tools" ON public.tools;
CREATE POLICY "Non-banned users can create their own tools" ON public.tools
FOR INSERT WITH CHECK (
  auth.uid() = user_id 
  AND NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND (
      is_banned = true 
      OR banned_features ? 'tools'
    )
  )
);

-- Update existing posts policy to also check for posts ban
DROP POLICY IF EXISTS "Non-banned users can create their own posts" ON public.posts;
CREATE POLICY "Non-banned users can create their own posts" ON public.posts
FOR INSERT WITH CHECK (
  auth.uid() = user_id 
  AND NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND (
      is_banned = true 
      OR banned_features ? 'posts'
    )
  )
);

-- Create function to check if user is banned from specific feature
CREATE OR REPLACE FUNCTION public.is_user_banned_from_feature(user_id_param UUID, feature_param TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_banned BOOLEAN := false;
  feature_banned BOOLEAN := false;
BEGIN
  SELECT is_banned, banned_features ? feature_param
  INTO user_banned, feature_banned
  FROM user_profiles
  WHERE id = user_id_param;
  
  RETURN COALESCE(user_banned, false) OR COALESCE(feature_banned, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create function to ban/unban user from specific features
CREATE OR REPLACE FUNCTION public.update_user_ban_features(
  target_user_id UUID,
  features_to_ban TEXT[],
  admin_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if admin has permission to ban users
  IF NOT public.has_permission(admin_user_id, 'ban_user') THEN
    RAISE EXCEPTION 'Insufficient permissions to ban users';
  END IF;
  
  -- Update the banned features
  UPDATE user_profiles 
  SET banned_features = to_jsonb(features_to_ban)
  WHERE id = target_user_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;