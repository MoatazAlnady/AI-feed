-- Add shared_post_id column for reshare-specific comments
ALTER TABLE public.post_comments
ADD COLUMN shared_post_id UUID REFERENCES public.shared_posts(id) ON DELETE CASCADE;

-- Add parent_comment_id column for reply threading
ALTER TABLE public.post_comments
ADD COLUMN parent_comment_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE;

-- Create indexes for efficient querying
CREATE INDEX idx_post_comments_shared_post ON public.post_comments(shared_post_id);
CREATE INDEX idx_post_comments_parent ON public.post_comments(parent_comment_id);