-- Handle profiles if not exists (idempotent)
DO $$ 
BEGIN
    -- Add handle column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'handle') THEN
        ALTER TABLE public.user_profiles ADD COLUMN handle text UNIQUE;
    END IF;
    
    -- Add display_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'display_name') THEN
        ALTER TABLE public.user_profiles ADD COLUMN display_name text;
    END IF;
    
    -- Add avatar_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'avatar_url') THEN
        ALTER TABLE public.user_profiles ADD COLUMN avatar_url text;
    END IF;
    
    -- Add headline column if it doesn't exist  
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'headline') THEN
        ALTER TABLE public.user_profiles ADD COLUMN headline text;
    END IF;
END $$;

-- Create conversations table if not exists
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_dm boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create conversation_participants table if not exists
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

-- Create messages table if not exists (check if it already exists to avoid conflicts)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversation_messages') THEN
        CREATE TABLE public.conversation_messages (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
          sender_id uuid NOT NULL,
          body text NOT NULL,
          created_at timestamptz DEFAULT now(),
          updated_at timestamptz DEFAULT now()
        );
    END IF;
END $$;

-- Create mentions table for @mentions functionality
CREATE TABLE IF NOT EXISTS public.mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL, -- 'comment', 'post', 'message'
  content_id uuid NOT NULL,
  mentioned_user_id uuid NOT NULL,
  mentioner_user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL, -- 'like', 'comment', 'follow', 'share', 'mention', 'system'
  title text NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  action_url text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;
CREATE POLICY "Users can view conversations they participate in" ON public.conversations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.conversation_participants cp
            WHERE cp.conversation_id = conversations.id AND cp.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
CREATE POLICY "Users can create conversations" ON public.conversations
  FOR INSERT WITH CHECK (true);

-- RLS Policies for conversation_participants  
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON public.conversation_participants;
CREATE POLICY "Users can view participants in their conversations" ON public.conversation_participants
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.conversation_participants cp
            WHERE cp.conversation_id = conversation_participants.conversation_id AND cp.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can add participants to conversations" ON public.conversation_participants;
CREATE POLICY "Users can add participants to conversations" ON public.conversation_participants
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.conversation_participants cp
            WHERE cp.conversation_id = conversation_participants.conversation_id AND cp.user_id = auth.uid())
  );

-- RLS Policies for conversation_messages
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.conversation_messages;
CREATE POLICY "Users can view messages in their conversations" ON public.conversation_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.conversation_participants cp
            WHERE cp.conversation_id = conversation_messages.conversation_id AND cp.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can send messages to their conversations" ON public.conversation_messages;
CREATE POLICY "Users can send messages to their conversations" ON public.conversation_messages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.conversation_participants cp
            WHERE cp.conversation_id = conversation_messages.conversation_id AND cp.user_id = auth.uid())
    AND sender_id = auth.uid()
  );

-- RLS Policies for mentions
DROP POLICY IF EXISTS "Users can view mentions that involve them" ON public.mentions;
CREATE POLICY "Users can view mentions that involve them" ON public.mentions
  FOR SELECT USING (mentioned_user_id = auth.uid() OR mentioner_user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create mentions" ON public.mentions;
CREATE POLICY "Users can create mentions" ON public.mentions
  FOR INSERT WITH CHECK (mentioner_user_id = auth.uid());

-- RLS Policies for notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Function to find or create DM conversation
CREATE OR REPLACE FUNCTION public.find_or_create_dm(other_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  conv_id uuid;
  current_user_id uuid := auth.uid();
BEGIN
  -- Check if conversation already exists between these two users
  SELECT c.id INTO conv_id
  FROM public.conversations c
  JOIN public.conversation_participants cp1 ON c.id = cp1.conversation_id
  JOIN public.conversation_participants cp2 ON c.id = cp2.conversation_id
  WHERE c.is_dm = true
    AND cp1.user_id = current_user_id
    AND cp2.user_id = other_user_id
    AND (SELECT COUNT(*) FROM public.conversation_participants cp WHERE cp.conversation_id = c.id) = 2;

  -- If conversation doesn't exist, create it
  IF conv_id IS NULL THEN
    -- Create conversation
    INSERT INTO public.conversations (is_dm) VALUES (true) RETURNING id INTO conv_id;
    
    -- Add both participants
    INSERT INTO public.conversation_participants (conversation_id, user_id) VALUES (conv_id, current_user_id);
    INSERT INTO public.conversation_participants (conversation_id, user_id) VALUES (conv_id, other_user_id);
  END IF;

  RETURN conv_id;
END;
$$;

-- Function to create mention notification
CREATE OR REPLACE FUNCTION public.create_mention_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create notification for the mentioned user
  INSERT INTO public.notifications (user_id, type, title, message, action_url, metadata)
  VALUES (
    NEW.mentioned_user_id,
    'mention',
    'You were mentioned',
    'Someone mentioned you in a ' || NEW.content_type,
    '/notifications', -- You can customize this based on content_type
    jsonb_build_object('content_type', NEW.content_type, 'content_id', NEW.content_id, 'mentioner_id', NEW.mentioner_user_id)
  );
  
  RETURN NEW;
END;
$$;

-- Trigger for mention notifications
DROP TRIGGER IF EXISTS create_mention_notification_trigger ON public.mentions;
CREATE TRIGGER create_mention_notification_trigger
  AFTER INSERT ON public.mentions
  FOR EACH ROW
  EXECUTE FUNCTION public.create_mention_notification();

-- Public view for chat headers (no private fields)
CREATE OR REPLACE VIEW public.profiles_public_v AS
SELECT 
  id, 
  handle, 
  COALESCE(display_name, full_name) as display_name, 
  COALESCE(avatar_url, profile_photo) as avatar_url,
  headline,
  job_title,
  visibility
FROM public.user_profiles
WHERE visibility IN ('public', 'connections');