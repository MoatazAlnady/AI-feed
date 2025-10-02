-- Drop the security definer view as it bypasses RLS
DROP VIEW IF EXISTS public.profiles_public_v;

-- Note: Applications should query the user_profiles table directly
-- The existing RLS policies on user_profiles already handle public access properly:
-- - Public profiles (visibility = 'public') are readable by everyone
-- - Users can always read their own profiles
-- This is more secure than a SECURITY DEFINER view