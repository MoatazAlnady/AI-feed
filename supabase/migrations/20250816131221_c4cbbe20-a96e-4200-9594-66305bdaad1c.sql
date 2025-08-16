-- Fix shares table migration step by step
-- First, make content_type nullable temporarily
ALTER TABLE public.shares ALTER COLUMN content_type DROP NOT NULL;

-- Add new columns if they don't exist
ALTER TABLE public.shares 
ADD COLUMN IF NOT EXISTS target_type TEXT DEFAULT 'post',
ADD COLUMN IF NOT EXISTS target_id UUID;

-- Update existing shares data to use new structure
UPDATE public.shares 
SET target_type = COALESCE(content_type, 'post'), 
    target_id = content_id 
WHERE target_type IS NULL OR target_id IS NULL;

-- Now make target columns NOT NULL since they should be populated
ALTER TABLE public.shares ALTER COLUMN target_type SET NOT NULL;
ALTER TABLE public.shares ALTER COLUMN target_id SET NOT NULL;

-- Add constraint
ALTER TABLE public.shares 
DROP CONSTRAINT IF EXISTS shares_target_type_check;

ALTER TABLE public.shares 
ADD CONSTRAINT shares_target_type_check 
CHECK (target_type IN ('post', 'article', 'tool', 'job'));

-- Create unique constraint
ALTER TABLE public.shares 
DROP CONSTRAINT IF EXISTS shares_user_target_unique;

ALTER TABLE public.shares 
ADD CONSTRAINT shares_user_target_unique 
UNIQUE(user_id, target_type, target_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_shares_target_v2 ON public.shares(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_shares_user_v2 ON public.shares(user_id);