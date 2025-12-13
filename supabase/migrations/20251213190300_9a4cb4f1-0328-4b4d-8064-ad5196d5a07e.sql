-- Create saved_items table for bookmarks/saved content
CREATE TABLE public.saved_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('tool', 'article', 'post', 'job')),
  content_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, content_type, content_id)
);

-- Enable RLS
ALTER TABLE public.saved_items ENABLE ROW LEVEL SECURITY;

-- Users can view their own saved items
CREATE POLICY "Users can view their own saved items"
ON public.saved_items
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own saved items
CREATE POLICY "Users can create their own saved items"
ON public.saved_items
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own saved items
CREATE POLICY "Users can delete their own saved items"
ON public.saved_items
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_saved_items_user_id ON public.saved_items(user_id);
CREATE INDEX idx_saved_items_content ON public.saved_items(content_type, content_id);