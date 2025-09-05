-- Fix infinite recursion in conversation_participants policies
-- Drop the problematic policies first
DROP POLICY IF EXISTS "Users can add participants to conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON conversation_participants;

-- Create security definer function to check conversation access
CREATE OR REPLACE FUNCTION public.user_can_access_conversation(conversation_uuid uuid, user_uuid uuid)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user is already a participant in the conversation
  RETURN EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE id = conversation_uuid 
    AND (participant_1_id = user_uuid OR participant_2_id = user_uuid)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Create new policies using the security definer function
CREATE POLICY "Users can add participants to conversations" 
ON conversation_participants 
FOR INSERT 
WITH CHECK (public.user_can_access_conversation(conversation_id, auth.uid()));

CREATE POLICY "Users can view participants in their conversations" 
ON conversation_participants 
FOR SELECT 
USING (public.user_can_access_conversation(conversation_id, auth.uid()));