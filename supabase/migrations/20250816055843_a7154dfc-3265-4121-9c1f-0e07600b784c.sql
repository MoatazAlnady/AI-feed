-- Add cover_photo column to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN cover_photo TEXT;