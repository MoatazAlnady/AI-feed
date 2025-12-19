-- Drop the overly permissive SELECT policies
DROP POLICY IF EXISTS "Users can view accessible profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.user_profiles;

-- Create a more restrictive SELECT policy:
-- 1. Users can always see their own profile
-- 2. Authenticated users can see basic public profile info of other users with visibility = 'public'
-- 3. Connected users can see more details of each other
-- 4. Admins can see all profiles
CREATE POLICY "Profile visibility policy"
ON public.user_profiles
FOR SELECT
USING (
  -- Owner can always see their own profile
  auth.uid() = id
  OR
  -- Admins can see all profiles
  public.is_admin()
  OR
  -- Connected users can see each other's profiles
  public.are_users_connected(auth.uid(), id)
  OR
  -- Authenticated users can see public profiles (basic info only - sensitive fields should be filtered at view/application level)
  (auth.uid() IS NOT NULL AND visibility = 'public')
);

-- Add comment explaining the policy
COMMENT ON POLICY "Profile visibility policy" ON public.user_profiles IS 
'Controls who can read user profiles. Sensitive fields like phone, birth_date should be accessed via user_profiles_safe view which filters based on relationship.';