-- Add foreign key constraint between shared_posts and posts tables
ALTER TABLE public.shared_posts 
ADD CONSTRAINT shared_posts_original_post_id_fkey 
FOREIGN KEY (original_post_id) REFERENCES public.posts(id) ON DELETE CASCADE;