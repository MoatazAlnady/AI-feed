-- Add newsletter frequency field to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS newsletter_frequency TEXT DEFAULT 'weekly' CHECK (newsletter_frequency IN ('daily', 'weekly', 'monthly', 'off'));

-- Update existing users to have 'weekly' frequency if they have newsletter subscription enabled
UPDATE public.user_profiles 
SET newsletter_frequency = CASE 
  WHEN newsletter_subscription = true THEN 'weekly'
  ELSE 'off'
END
WHERE newsletter_frequency IS NULL;