-- Drop the existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Profile visibility policy" ON public.user_profiles;

-- Create a more restrictive policy for the BASE table:
-- Only owner, admins, and connected users can access the raw table with all columns
-- Public profile access should go through user_profiles_safe view instead
CREATE POLICY "Restricted profile access"
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
);

-- Grant SELECT on the safe view to authenticated users (already done, but ensure it's there)
GRANT SELECT ON public.user_profiles_safe TO authenticated;

-- Revoke direct SELECT from anon on the base table to force use of safe view
REVOKE SELECT ON public.user_profiles FROM anon;

-- Add comment explaining the security model
COMMENT ON TABLE public.user_profiles IS 
'Base user profiles table. Direct access restricted to owner/admin/connections. 
Public profile viewing should use user_profiles_safe view which filters sensitive columns.';