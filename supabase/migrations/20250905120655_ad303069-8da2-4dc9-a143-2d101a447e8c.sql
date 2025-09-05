-- Fix infinite recursion in conversation_participants policies
-- Drop the problematic policies first
DROP POLICY IF EXISTS "Users can add participants to conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON conversation_participants;

-- Drop and recreate has_permission function to fix search path
DROP FUNCTION IF EXISTS public.has_permission(uuid, text);

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

-- Fix function search paths for security
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND account_type = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Recreate has_permission function with proper search path
CREATE OR REPLACE FUNCTION public.has_permission(user_uuid uuid, permission_name text)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_profiles up
    JOIN public.roles r ON up.role_id = r.id
    JOIN public.role_permissions rp ON r.id = rp.role_id
    WHERE up.id = user_uuid 
    AND rp.permission_key = permission_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;