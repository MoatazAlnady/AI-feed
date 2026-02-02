-- Rename pricing to pricing_type
ALTER TABLE public.tools RENAME COLUMN pricing TO pricing_type;

-- Add tool_type column to store platform types (Web App, Desktop App, Mobile App, etc.)
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS tool_type TEXT[];

-- Drop the redundant is_dark_logo column
ALTER TABLE public.tools DROP COLUMN IF EXISTS is_dark_logo;