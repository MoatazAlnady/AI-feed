-- Add online_status_mode column to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS online_status_mode text DEFAULT 'auto';

-- Add check constraint
ALTER TABLE public.user_profiles 
ADD CONSTRAINT check_online_status_mode 
CHECK (online_status_mode IN ('auto', 'online', 'offline'));

COMMENT ON COLUMN public.user_profiles.online_status_mode IS 'Controls how user appears: auto (real-time detection), online (always appear online), offline (always appear offline)';