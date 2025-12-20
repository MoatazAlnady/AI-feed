-- Fix premium access for admin user and add views column to tools

-- Update user profile to ensure premium access
UPDATE public.user_profiles 
SET role_id = 1, is_premium = true, premium_until = '2099-12-31'::timestamp with time zone
WHERE id = 'f603cf89-6e48-4fd4-b3f8-dadeed2f949c';

-- Add views column to tools table for tracking
ALTER TABLE public.tools 
ADD COLUMN IF NOT EXISTS views integer DEFAULT 0;