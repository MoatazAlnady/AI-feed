-- Add logo detection columns to tools table
ALTER TABLE public.tools 
ADD COLUMN IF NOT EXISTS is_light_logo boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_dark_logo boolean DEFAULT false;

-- Add computed columns for case-insensitive uniqueness
ALTER TABLE public.tools
ADD COLUMN IF NOT EXISTS name_ci text GENERATED ALWAYS AS (lower(name)) STORED,
ADD COLUMN IF NOT EXISTS link_ci text GENERATED ALWAYS AS (lower(website)) STORED;

-- Create unique index to prevent duplicate tools (by name and website)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_tool_name_link
ON public.tools (name_ci, link_ci);