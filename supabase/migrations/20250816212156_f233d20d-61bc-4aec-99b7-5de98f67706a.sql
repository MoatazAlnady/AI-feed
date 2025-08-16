-- Ensure profiles has a unique handle and a simple visibility model
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS handle text,
  ADD COLUMN IF NOT EXISTS visibility text
    CHECK (visibility IN ('public','connections','private'))
    DEFAULT 'public';

-- Create unique index if not exists
CREATE UNIQUE INDEX IF NOT EXISTS uniq_profiles_handle ON public.user_profiles(handle);

-- RPC: get public profiles for UI hydration (SECURITY DEFINER, read-only)
CREATE OR REPLACE FUNCTION public.get_public_profiles(uids uuid[])
RETURNS TABLE (
  id uuid,
  handle text,
  display_name text,
  avatar_url text,
  visibility text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH base AS (
    SELECT p.id, p.handle, p.display_name, p.avatar_url, p.visibility
    FROM public.user_profiles p
    WHERE p.id = ANY(uids)
  )
  SELECT * FROM base
  WHERE visibility = 'public'
     OR (visibility = 'connections'
         AND EXISTS (
           SELECT 1 FROM public.connections c
           WHERE (c.user_1_id = base.id AND c.user_2_id = auth.uid())
              OR (c.user_2_id = base.id AND c.user_1_id = auth.uid())
         ))
     OR base.id = auth.uid(); -- owner always allowed
$$;

-- Create connections table if not exists
CREATE TABLE IF NOT EXISTS public.connections (
  user_1_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_2_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connected_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_1_id, user_2_id),
  CHECK (user_1_id < user_2_id) -- Ensure consistent ordering
);

-- Enable RLS on connections
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

-- RLS policy for connections
CREATE POLICY "Users can view their own connections" ON public.connections
  FOR SELECT USING (auth.uid() = user_1_id OR auth.uid() = user_2_id);

CREATE POLICY "Users can create their own connections" ON public.connections
  FOR INSERT WITH CHECK (auth.uid() = user_1_id OR auth.uid() = user_2_id);

-- Update the find_or_create_dm function to use conversation_messages table
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