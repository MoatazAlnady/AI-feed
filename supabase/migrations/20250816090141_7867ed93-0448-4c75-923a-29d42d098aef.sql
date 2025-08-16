-- Create function to check if user profile exists
CREATE OR REPLACE FUNCTION public.user_profile_exists(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = user_id_param
  );
END;
$$;

-- Update user_profiles RLS policies to allow viewing for everyone
DROP POLICY IF EXISTS "Public can view user profiles" ON public.user_profiles;

CREATE POLICY "Public can view user profiles"
ON public.user_profiles
FOR SELECT
USING (true);