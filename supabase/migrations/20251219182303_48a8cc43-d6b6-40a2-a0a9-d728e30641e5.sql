-- Create event_attendees table for RSVP tracking
CREATE TABLE public.event_attendees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'attending' CHECK (status IN ('attending', 'maybe', 'not_attending')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view event attendees" 
ON public.event_attendees FOR SELECT USING (true);

CREATE POLICY "Users can manage their own attendance" 
ON public.event_attendees FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attendance" 
ON public.event_attendees FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own attendance" 
ON public.event_attendees FOR DELETE 
USING (auth.uid() = user_id);

-- Create community_discussions table
CREATE TABLE public.community_discussions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  category TEXT,
  is_pinned BOOLEAN DEFAULT false,
  reply_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.community_discussions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for community_discussions
CREATE POLICY "Anyone can view discussions" 
ON public.community_discussions FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create discussions" 
ON public.community_discussions FOR INSERT 
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own discussions" 
ON public.community_discussions FOR UPDATE 
USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own discussions" 
ON public.community_discussions FOR DELETE 
USING (auth.uid() = author_id);

-- Add trigger for updated_at
CREATE TRIGGER update_event_attendees_updated_at
BEFORE UPDATE ON public.event_attendees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_community_discussions_updated_at
BEFORE UPDATE ON public.community_discussions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();