-- Add admin RLS policies for country_codes table
CREATE POLICY "Admins can insert country codes" 
ON public.country_codes 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.account_type = 'admin'
  )
);

CREATE POLICY "Admins can update country codes" 
ON public.country_codes 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.account_type = 'admin'
  )
);

CREATE POLICY "Admins can delete country codes" 
ON public.country_codes 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.account_type = 'admin'
  )
);