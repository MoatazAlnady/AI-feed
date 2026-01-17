-- Add columns to shared_posts for groups, events, and discussions
ALTER TABLE public.shared_posts 
ADD COLUMN IF NOT EXISTS original_group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS original_group_event_id UUID REFERENCES public.group_events(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS original_standalone_event_id UUID REFERENCES public.standalone_events(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS original_discussion_id UUID REFERENCES public.group_discussions(id) ON DELETE CASCADE;

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_shared_posts_group ON shared_posts(original_group_id) WHERE original_group_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shared_posts_group_event ON shared_posts(original_group_event_id) WHERE original_group_event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shared_posts_standalone_event ON shared_posts(original_standalone_event_id) WHERE original_standalone_event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shared_posts_discussion ON shared_posts(original_discussion_id) WHERE original_discussion_id IS NOT NULL;

-- Add interests and tags to groups table
ALTER TABLE public.groups 
ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add interests and tags to group_events table
ALTER TABLE public.group_events 
ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add interests and tags to standalone_events table
ALTER TABLE public.standalone_events 
ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add interests and tags to group_discussions table
ALTER TABLE public.group_discussions 
ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';