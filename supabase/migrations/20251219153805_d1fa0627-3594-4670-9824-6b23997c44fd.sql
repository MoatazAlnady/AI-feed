-- Group Discussions (topics within groups)
CREATE TABLE public.group_discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  author_id UUID NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  reply_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Discussion Replies
CREATE TABLE public.discussion_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID NOT NULL REFERENCES public.group_discussions(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  parent_reply_id UUID REFERENCES public.discussion_replies(id) ON DELETE CASCADE,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Group Conversations (group chats)
CREATE TABLE public.group_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  name TEXT,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id)
);

-- Group Messages
CREATE TABLE public.group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_conversation_id UUID NOT NULL REFERENCES public.group_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_group_discussions_group ON public.group_discussions(group_id);
CREATE INDEX idx_group_discussions_author ON public.group_discussions(author_id);
CREATE INDEX idx_discussion_replies_discussion ON public.discussion_replies(discussion_id);
CREATE INDEX idx_discussion_replies_author ON public.discussion_replies(author_id);
CREATE INDEX idx_group_messages_conversation ON public.group_messages(group_conversation_id);
CREATE INDEX idx_group_messages_sender ON public.group_messages(sender_id);

-- Enable RLS
ALTER TABLE public.group_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for group_discussions
CREATE POLICY "Group members can view discussions"
  ON public.group_discussions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_members.group_id = group_discussions.group_id 
    AND group_members.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.groups 
    WHERE groups.id = group_discussions.group_id 
    AND groups.is_private = false
  ));

CREATE POLICY "Group members can create discussions"
  ON public.group_discussions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_members.group_id = group_discussions.group_id 
    AND group_members.user_id = auth.uid()
  ));

CREATE POLICY "Authors can update their discussions"
  ON public.group_discussions FOR UPDATE
  USING (author_id = auth.uid());

CREATE POLICY "Authors can delete their discussions"
  ON public.group_discussions FOR DELETE
  USING (author_id = auth.uid());

-- RLS Policies for discussion_replies
CREATE POLICY "Users can view replies in accessible discussions"
  ON public.discussion_replies FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.group_discussions gd
    JOIN public.group_members gm ON gm.group_id = gd.group_id
    WHERE gd.id = discussion_replies.discussion_id 
    AND gm.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.group_discussions gd
    JOIN public.groups g ON g.id = gd.group_id
    WHERE gd.id = discussion_replies.discussion_id 
    AND g.is_private = false
  ));

CREATE POLICY "Group members can reply to discussions"
  ON public.discussion_replies FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.group_discussions gd
    JOIN public.group_members gm ON gm.group_id = gd.group_id
    WHERE gd.id = discussion_replies.discussion_id 
    AND gm.user_id = auth.uid()
  ));

CREATE POLICY "Authors can update their replies"
  ON public.discussion_replies FOR UPDATE
  USING (author_id = auth.uid());

CREATE POLICY "Authors can delete their replies"
  ON public.discussion_replies FOR DELETE
  USING (author_id = auth.uid());

-- RLS Policies for group_conversations
CREATE POLICY "Group members can view group conversations"
  ON public.group_conversations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_members.group_id = group_conversations.group_id 
    AND group_members.user_id = auth.uid()
  ));

CREATE POLICY "Group admins can create group conversations"
  ON public.group_conversations FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_members.group_id = group_conversations.group_id 
    AND group_members.user_id = auth.uid()
    AND group_members.role IN ('admin', 'owner')
  ) OR EXISTS (
    SELECT 1 FROM public.groups 
    WHERE groups.id = group_conversations.group_id 
    AND groups.creator_id = auth.uid()
  ));

-- RLS Policies for group_messages
CREATE POLICY "Group members can view group messages"
  ON public.group_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.group_conversations gc
    JOIN public.group_members gm ON gm.group_id = gc.group_id
    WHERE gc.id = group_messages.group_conversation_id 
    AND gm.user_id = auth.uid()
  ));

CREATE POLICY "Group members can send messages"
  ON public.group_messages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.group_conversations gc
    JOIN public.group_members gm ON gm.group_id = gc.group_id
    WHERE gc.id = group_messages.group_conversation_id 
    AND gm.user_id = auth.uid()
  ));

CREATE POLICY "Senders can delete their messages"
  ON public.group_messages FOR DELETE
  USING (sender_id = auth.uid());

-- Trigger to update reply_count on group_discussions
CREATE OR REPLACE FUNCTION update_discussion_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.group_discussions 
    SET reply_count = reply_count + 1, updated_at = now()
    WHERE id = NEW.discussion_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.group_discussions 
    SET reply_count = reply_count - 1, updated_at = now()
    WHERE id = OLD.discussion_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_discussion_reply_change
  AFTER INSERT OR DELETE ON public.discussion_replies
  FOR EACH ROW
  EXECUTE FUNCTION update_discussion_reply_count();

-- Trigger to update last_message_at on group_conversations
CREATE OR REPLACE FUNCTION update_group_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.group_conversations 
  SET last_message_at = now()
  WHERE id = NEW.group_conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_group_message_insert
  AFTER INSERT ON public.group_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_group_conversation_last_message();