-- Add engagement columns to group_discussions
ALTER TABLE public.group_discussions
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS share_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS bookmarks_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Create discussion reactions table
CREATE TABLE IF NOT EXISTS public.discussion_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID NOT NULL REFERENCES public.group_discussions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reaction_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(discussion_id, user_id)
);

-- Create discussion bookmarks table
CREATE TABLE IF NOT EXISTS public.discussion_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID NOT NULL REFERENCES public.group_discussions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(discussion_id, user_id)
);

-- Enable RLS
ALTER TABLE public.discussion_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS policies for discussion_reactions
CREATE POLICY "Users can view all discussion reactions"
ON public.discussion_reactions FOR SELECT
USING (true);

CREATE POLICY "Users can create their own reactions"
ON public.discussion_reactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions"
ON public.discussion_reactions FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own reactions"
ON public.discussion_reactions FOR UPDATE
USING (auth.uid() = user_id);

-- RLS policies for discussion_bookmarks
CREATE POLICY "Users can view their own bookmarks"
ON public.discussion_bookmarks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookmarks"
ON public.discussion_bookmarks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks"
ON public.discussion_bookmarks FOR DELETE
USING (auth.uid() = user_id);