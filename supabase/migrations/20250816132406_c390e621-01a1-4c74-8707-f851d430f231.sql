-- Add logo_url column to tools table if it doesn't exist
ALTER TABLE public.tools 
ADD COLUMN IF NOT EXISTS logo_url TEXT;