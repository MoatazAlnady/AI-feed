-- Add premium_tier column to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS premium_tier TEXT DEFAULT NULL;

-- Add constraint for valid tier values
ALTER TABLE public.user_profiles 
ADD CONSTRAINT valid_premium_tier CHECK (premium_tier IN ('silver', 'gold') OR premium_tier IS NULL);

-- Create index for faster queries on premium_tier
CREATE INDEX IF NOT EXISTS idx_user_profiles_premium_tier ON public.user_profiles(premium_tier);

-- Update existing premium users to silver tier (legacy)
UPDATE public.user_profiles 
SET premium_tier = 'silver' 
WHERE is_premium = true AND premium_tier IS NULL;