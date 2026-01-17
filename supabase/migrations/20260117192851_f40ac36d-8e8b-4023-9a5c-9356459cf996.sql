-- Create event_invitations table for both group events and standalone events
CREATE TABLE public.event_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('group_event', 'standalone_event')),
  inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  UNIQUE(event_id, event_type, invitee_id)
);

-- Enable RLS
ALTER TABLE public.event_invitations ENABLE ROW LEVEL SECURITY;

-- Users can view invitations they sent or received
CREATE POLICY "Users can view their own invitations"
ON public.event_invitations
FOR SELECT
USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

-- Users can create invitations (with additional checks in application layer)
CREATE POLICY "Users can create invitations"
ON public.event_invitations
FOR INSERT
WITH CHECK (auth.uid() = inviter_id);

-- Users can update invitations they received (accept/decline)
CREATE POLICY "Users can respond to received invitations"
ON public.event_invitations
FOR UPDATE
USING (auth.uid() = invitee_id);

-- Users can delete invitations they sent
CREATE POLICY "Users can delete invitations they sent"
ON public.event_invitations
FOR DELETE
USING (auth.uid() = inviter_id);

-- Add index for faster lookups
CREATE INDEX idx_event_invitations_event ON public.event_invitations(event_id, event_type);
CREATE INDEX idx_event_invitations_invitee ON public.event_invitations(invitee_id, status);
CREATE INDEX idx_event_invitations_inviter ON public.event_invitations(inviter_id);