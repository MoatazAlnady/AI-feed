-- Set admin user as premium permanently
UPDATE public.user_profiles 
SET 
  is_premium = true,
  premium_until = '2099-12-31'
WHERE id = 'f603cf89-6e48-4fd4-b3f8-dadeed2f949c';