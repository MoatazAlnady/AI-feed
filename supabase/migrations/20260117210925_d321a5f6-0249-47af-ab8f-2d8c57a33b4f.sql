-- Add original_tool_id column to shared_posts
ALTER TABLE public.shared_posts 
ADD COLUMN IF NOT EXISTS original_tool_id UUID REFERENCES public.tools(id) ON DELETE CASCADE;

-- Make original_post_id nullable (needed when sharing tools/articles)
ALTER TABLE public.shared_posts 
ALTER COLUMN original_post_id DROP NOT NULL;

-- Create index for tool lookups
CREATE INDEX IF NOT EXISTS idx_shared_posts_tool ON shared_posts(original_tool_id) WHERE original_tool_id IS NOT NULL;