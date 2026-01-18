-- Phase 2 & 3: Add event pricing and review tables

-- Add pricing columns to events table for paid events
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS ticket_price DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS ticket_currency TEXT DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

-- Add average_rating columns to groups and events
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0;
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Group reviews (for members only)
CREATE TABLE IF NOT EXISTS public.group_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (group_id, reviewer_id)
);

-- Enable RLS on group_reviews
ALTER TABLE public.group_reviews ENABLE ROW LEVEL SECURITY;

-- RLS policies for group_reviews
CREATE POLICY "Anyone can view group reviews" 
ON public.group_reviews FOR SELECT 
USING (true);

CREATE POLICY "Members can create group reviews" 
ON public.group_reviews FOR INSERT 
WITH CHECK (
  auth.uid() = reviewer_id AND
  EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_id = group_reviews.group_id 
    AND user_id = auth.uid() 
    AND status = 'active'
  )
);

CREATE POLICY "Users can update their own group reviews" 
ON public.group_reviews FOR UPDATE 
USING (auth.uid() = reviewer_id);

CREATE POLICY "Users can delete their own group reviews" 
ON public.group_reviews FOR DELETE 
USING (auth.uid() = reviewer_id);

-- Event reviews (for attendees only)
CREATE TABLE IF NOT EXISTS public.event_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (event_id, reviewer_id)
);

-- Enable RLS on event_reviews
ALTER TABLE public.event_reviews ENABLE ROW LEVEL SECURITY;

-- RLS policies for event_reviews
CREATE POLICY "Anyone can view event reviews" 
ON public.event_reviews FOR SELECT 
USING (true);

CREATE POLICY "Attendees can create event reviews" 
ON public.event_reviews FOR INSERT 
WITH CHECK (
  auth.uid() = reviewer_id AND
  EXISTS (
    SELECT 1 FROM public.event_attendees 
    WHERE event_id = event_reviews.event_id 
    AND user_id = auth.uid() 
    AND status = 'attending'
  )
);

CREATE POLICY "Users can update their own event reviews" 
ON public.event_reviews FOR UPDATE 
USING (auth.uid() = reviewer_id);

CREATE POLICY "Users can delete their own event reviews" 
ON public.event_reviews FOR DELETE 
USING (auth.uid() = reviewer_id);

-- Creator content reviews (for subscribers only)
CREATE TABLE IF NOT EXISTS public.creator_content_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'article', 'tool', 'event', 'group')),
  content_id UUID NOT NULL,
  creator_id UUID NOT NULL,
  reviewer_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (content_type, content_id, reviewer_id)
);

-- Enable RLS on creator_content_reviews
ALTER TABLE public.creator_content_reviews ENABLE ROW LEVEL SECURITY;

-- RLS policies for creator_content_reviews
CREATE POLICY "Anyone can view creator content reviews" 
ON public.creator_content_reviews FOR SELECT 
USING (true);

CREATE POLICY "Subscribers can create creator content reviews" 
ON public.creator_content_reviews FOR INSERT 
WITH CHECK (
  auth.uid() = reviewer_id AND
  EXISTS (
    SELECT 1 FROM public.creator_subscriptions 
    WHERE creator_id = creator_content_reviews.creator_id 
    AND subscriber_id = auth.uid() 
    AND status = 'active'
  )
);

CREATE POLICY "Users can update their own creator content reviews" 
ON public.creator_content_reviews FOR UPDATE 
USING (auth.uid() = reviewer_id);

CREATE POLICY "Users can delete their own creator content reviews" 
ON public.creator_content_reviews FOR DELETE 
USING (auth.uid() = reviewer_id);

-- Add creator average rating column to user_profiles
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS creator_average_rating DECIMAL(3,2) DEFAULT 0;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS creator_review_count INTEGER DEFAULT 0;

-- Function to update group average rating
CREATE OR REPLACE FUNCTION public.update_group_average_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.groups 
  SET 
    average_rating = COALESCE((SELECT AVG(rating)::DECIMAL(3,2) FROM public.group_reviews WHERE group_id = COALESCE(NEW.group_id, OLD.group_id)), 0),
    review_count = (SELECT COUNT(*) FROM public.group_reviews WHERE group_id = COALESCE(NEW.group_id, OLD.group_id))
  WHERE id = COALESCE(NEW.group_id, OLD.group_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for group reviews
DROP TRIGGER IF EXISTS update_group_rating_trigger ON public.group_reviews;
CREATE TRIGGER update_group_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.group_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_group_average_rating();

-- Function to update event average rating
CREATE OR REPLACE FUNCTION public.update_event_average_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.events 
  SET 
    average_rating = COALESCE((SELECT AVG(rating)::DECIMAL(3,2) FROM public.event_reviews WHERE event_id = COALESCE(NEW.event_id, OLD.event_id)), 0),
    review_count = (SELECT COUNT(*) FROM public.event_reviews WHERE event_id = COALESCE(NEW.event_id, OLD.event_id))
  WHERE id = COALESCE(NEW.event_id, OLD.event_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for event reviews
DROP TRIGGER IF EXISTS update_event_rating_trigger ON public.event_reviews;
CREATE TRIGGER update_event_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.event_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_event_average_rating();

-- Function to update creator average rating
CREATE OR REPLACE FUNCTION public.update_creator_average_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.user_profiles 
  SET 
    creator_average_rating = COALESCE((SELECT AVG(rating)::DECIMAL(3,2) FROM public.creator_content_reviews WHERE creator_id = COALESCE(NEW.creator_id, OLD.creator_id)), 0),
    creator_review_count = (SELECT COUNT(*) FROM public.creator_content_reviews WHERE creator_id = COALESCE(NEW.creator_id, OLD.creator_id))
  WHERE id = COALESCE(NEW.creator_id, OLD.creator_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for creator content reviews
DROP TRIGGER IF EXISTS update_creator_rating_trigger ON public.creator_content_reviews;
CREATE TRIGGER update_creator_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.creator_content_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_creator_average_rating();