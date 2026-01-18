-- Email Templates table for caching user-created templates
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  template_type TEXT DEFAULT 'bulk_email',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own templates
CREATE POLICY "Users can view their own templates" 
ON public.email_templates FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own templates" 
ON public.email_templates FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates" 
ON public.email_templates FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates" 
ON public.email_templates FOR DELETE 
USING (auth.uid() = user_id);

-- User Engagement Preferences table for behavioral learning
CREATE TABLE IF NOT EXISTS public.user_engagement_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preference_type TEXT NOT NULL, -- 'topic', 'creator', 'content_type', 'hashtag'
  preference_value TEXT NOT NULL,
  engagement_score DECIMAL DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, preference_type, preference_value)
);

-- Enable RLS
ALTER TABLE public.user_engagement_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only view and modify their own preferences
CREATE POLICY "Users can view their own engagement preferences" 
ON public.user_engagement_preferences FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own engagement preferences" 
ON public.user_engagement_preferences FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own engagement preferences" 
ON public.user_engagement_preferences FOR UPDATE 
USING (auth.uid() = user_id);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_engagement_prefs_user_score 
ON public.user_engagement_preferences(user_id, engagement_score DESC);

CREATE INDEX IF NOT EXISTS idx_engagement_prefs_type_value 
ON public.user_engagement_preferences(preference_type, preference_value);

-- Update event_conversations constraint to accept unified 'event' type
ALTER TABLE public.event_conversations 
DROP CONSTRAINT IF EXISTS event_conversations_event_type_check;

ALTER TABLE public.event_conversations 
ADD CONSTRAINT event_conversations_event_type_check 
CHECK (event_type IN ('event', 'group_event', 'standalone_event', 'company_event'));

-- Update event_invitations constraint to accept unified 'event' type  
ALTER TABLE public.event_invitations 
DROP CONSTRAINT IF EXISTS event_invitations_event_type_check;

ALTER TABLE public.event_invitations 
ADD CONSTRAINT event_invitations_event_type_check 
CHECK (event_type IN ('event', 'group_event', 'standalone_event', 'company_event'));