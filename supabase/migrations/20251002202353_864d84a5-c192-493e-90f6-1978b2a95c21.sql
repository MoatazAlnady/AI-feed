-- Add foreign key from conversation_messages.sender_id to user_profiles.id
ALTER TABLE public.conversation_messages
ADD CONSTRAINT conversation_messages_sender_id_fkey
FOREIGN KEY (sender_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;