-- Add post visibility columns to posts table
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS visible_to_groups UUID[] DEFAULT '{}';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS link_metadata JSONB DEFAULT NULL;

-- Add default post privacy settings to user_profiles
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS default_post_visibility TEXT DEFAULT 'public';
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS default_post_groups UUID[] DEFAULT '{}';

-- Create group_members table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Enable RLS on group_members
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for group_members
CREATE POLICY "Users can view group members" 
ON public.group_members 
FOR SELECT 
USING (true);

CREATE POLICY "Group admins can manage members" 
ON public.group_members 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.group_members gm 
    WHERE gm.group_id = group_members.group_id 
    AND gm.user_id = auth.uid() 
    AND gm.role IN ('admin', 'moderator')
  )
  OR EXISTS (
    SELECT 1 FROM public.groups g 
    WHERE g.id = group_members.group_id 
    AND g.creator_id = auth.uid()
  )
);

CREATE POLICY "Users can join public groups" 
ON public.group_members 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM public.groups g 
    WHERE g.id = group_id 
    AND g.is_private = false
  )
);

CREATE POLICY "Users can leave groups" 
ON public.group_members 
FOR DELETE 
USING (user_id = auth.uid());

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_posts_visibility ON public.posts(visibility);