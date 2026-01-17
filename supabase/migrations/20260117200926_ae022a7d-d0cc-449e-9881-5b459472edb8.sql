-- Part 1: Creator Cancellation Questions table
CREATE TABLE IF NOT EXISTS public.creator_cancellation_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('text', 'textarea', 'select', 'multiselect', 'radio', 'checkbox', 'number', 'rating')),
  options JSONB, -- For select/multiselect/radio: [{value: 'option1', label: 'Option 1'}]
  is_mandatory BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Part 2: Creator Retention Offers table
CREATE TABLE IF NOT EXISTS public.creator_retention_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  offer_type TEXT NOT NULL CHECK (offer_type IN ('unconditional', 'conditional')),
  title TEXT NOT NULL,
  description TEXT,
  discount_percent INTEGER, -- e.g., 50 for 50% off
  discount_months INTEGER, -- e.g., 2 for 2 months
  free_months INTEGER, -- e.g., 1 for 1 month free
  condition_rules JSONB, -- For conditional: {question_id: 'uuid', answer_values: ['value1'], operator: 'equals|contains|greater_than'}
  priority INTEGER DEFAULT 0, -- Higher priority shows first
  is_active BOOLEAN DEFAULT true,
  max_uses_per_subscriber INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Part 3: Creator Cancellation Responses table
CREATE TABLE IF NOT EXISTS public.creator_cancellation_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.creator_subscriptions(id) ON DELETE CASCADE,
  subscriber_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  responses JSONB NOT NULL, -- {question_id: answer_value}
  offer_shown_id UUID REFERENCES public.creator_retention_offers(id),
  offer_accepted BOOLEAN DEFAULT false,
  cancelled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.creator_cancellation_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_retention_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_cancellation_responses ENABLE ROW LEVEL SECURITY;

-- RLS policies for creator_cancellation_questions
CREATE POLICY "Creators can manage their own questions"
  ON public.creator_cancellation_questions
  FOR ALL
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Anyone can view active questions for cancellation"
  ON public.creator_cancellation_questions
  FOR SELECT
  USING (is_active = true);

-- RLS policies for creator_retention_offers
CREATE POLICY "Creators can manage their own offers"
  ON public.creator_retention_offers
  FOR ALL
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Subscribers can view active offers"
  ON public.creator_retention_offers
  FOR SELECT
  USING (is_active = true);

-- RLS policies for creator_cancellation_responses
CREATE POLICY "Subscribers can insert their own responses"
  ON public.creator_cancellation_responses
  FOR INSERT
  WITH CHECK (subscriber_id = auth.uid());

CREATE POLICY "Creators can view responses for their subscriptions"
  ON public.creator_cancellation_responses
  FOR SELECT
  USING (creator_id = auth.uid());

CREATE POLICY "Subscribers can view their own responses"
  ON public.creator_cancellation_responses
  FOR SELECT
  USING (subscriber_id = auth.uid());

-- Indexes
CREATE INDEX idx_cancellation_questions_creator ON public.creator_cancellation_questions(creator_id);
CREATE INDEX idx_retention_offers_creator ON public.creator_retention_offers(creator_id);
CREATE INDEX idx_cancellation_responses_subscription ON public.creator_cancellation_responses(subscription_id);
CREATE INDEX idx_cancellation_responses_creator ON public.creator_cancellation_responses(creator_id);

-- Part 4: Notification triggers for creator content (Notify For Updates)
CREATE OR REPLACE FUNCTION public.notify_creator_followers()
RETURNS TRIGGER AS $$
DECLARE
  content_type TEXT;
  content_title TEXT;
  action_url TEXT;
  creator_user_id UUID;
  creator_name TEXT;
BEGIN
  -- Determine content type and details based on table
  IF TG_TABLE_NAME = 'tools' THEN
    content_type := 'tool';
    content_title := NEW.name;
    action_url := '/tool/' || NEW.id;
    creator_user_id := NEW.user_id;
  ELSIF TG_TABLE_NAME = 'posts' THEN
    content_type := 'post';
    content_title := LEFT(COALESCE(NEW.content, ''), 50);
    action_url := '/post/' || NEW.id;
    creator_user_id := NEW.user_id;
  ELSIF TG_TABLE_NAME = 'articles' THEN
    content_type := 'article';
    content_title := NEW.title;
    action_url := '/article/' || NEW.id;
    creator_user_id := NEW.user_id;
  ELSIF TG_TABLE_NAME = 'groups' AND NEW.visibility = 'public' THEN
    content_type := 'group';
    content_title := NEW.name;
    action_url := '/group/' || NEW.id;
    creator_user_id := NEW.created_by;
  ELSIF TG_TABLE_NAME = 'group_events' AND NEW.is_public = true THEN
    content_type := 'event';
    content_title := NEW.title;
    action_url := '/event/' || NEW.id;
    creator_user_id := NEW.created_by;
  ELSIF TG_TABLE_NAME = 'standalone_events' AND NEW.is_public = true THEN
    content_type := 'event';
    content_title := NEW.title;
    action_url := '/standalone-event/' || NEW.id;
    creator_user_id := NEW.organizer_id;
  ELSE
    RETURN NEW;
  END IF;

  IF creator_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get creator name
  SELECT full_name INTO creator_name FROM public.user_profiles WHERE id = creator_user_id;

  -- Insert notifications for followers with 'notify' status
  INSERT INTO public.notifications (user_id, type, title, message, action_url, metadata)
  SELECT 
    f.follower_id,
    'creator_update',
    COALESCE(creator_name, 'Someone you follow') || ' posted a new ' || content_type,
    content_title,
    action_url,
    jsonb_build_object(
      'creator_id', creator_user_id,
      'content_type', content_type,
      'content_id', NEW.id
    )
  FROM public.follows f
  WHERE f.following_id = creator_user_id 
    AND f.follow_status = 'notify';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers on relevant tables
DROP TRIGGER IF EXISTS notify_followers_on_tool ON public.tools;
CREATE TRIGGER notify_followers_on_tool
  AFTER INSERT ON public.tools
  FOR EACH ROW EXECUTE FUNCTION public.notify_creator_followers();

DROP TRIGGER IF EXISTS notify_followers_on_post ON public.posts;
CREATE TRIGGER notify_followers_on_post
  AFTER INSERT ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.notify_creator_followers();

DROP TRIGGER IF EXISTS notify_followers_on_article ON public.articles;
CREATE TRIGGER notify_followers_on_article
  AFTER INSERT ON public.articles
  FOR EACH ROW EXECUTE FUNCTION public.notify_creator_followers();

DROP TRIGGER IF EXISTS notify_followers_on_group ON public.groups;
CREATE TRIGGER notify_followers_on_group
  AFTER INSERT ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.notify_creator_followers();

DROP TRIGGER IF EXISTS notify_followers_on_group_event ON public.group_events;
CREATE TRIGGER notify_followers_on_group_event
  AFTER INSERT ON public.group_events
  FOR EACH ROW EXECUTE FUNCTION public.notify_creator_followers();

DROP TRIGGER IF EXISTS notify_followers_on_standalone_event ON public.standalone_events;
CREATE TRIGGER notify_followers_on_standalone_event
  AFTER INSERT ON public.standalone_events
  FOR EACH ROW EXECUTE FUNCTION public.notify_creator_followers();