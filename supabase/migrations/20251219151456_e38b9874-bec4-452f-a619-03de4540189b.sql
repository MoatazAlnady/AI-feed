-- Create events table with live video columns
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  event_end_date TIMESTAMP WITH TIME ZONE,
  location TEXT,
  event_type TEXT DEFAULT 'in-person',
  category TEXT,
  organizer_id UUID REFERENCES auth.users(id),
  company_page_id UUID REFERENCES public.company_pages(id),
  is_live_video BOOLEAN DEFAULT false,
  live_video_url TEXT,
  live_video_room_id UUID DEFAULT gen_random_uuid(),
  max_attendees INTEGER,
  is_public BOOLEAN DEFAULT true,
  cover_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view public events" 
ON public.events FOR SELECT 
USING (is_public = true);

CREATE POLICY "Organizers can view their own events" 
ON public.events FOR SELECT 
USING (auth.uid() = organizer_id);

CREATE POLICY "Authenticated users can create events" 
ON public.events FOR INSERT 
WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Organizers can update their events" 
ON public.events FOR UPDATE 
USING (auth.uid() = organizer_id);

CREATE POLICY "Organizers can delete their events" 
ON public.events FOR DELETE 
USING (auth.uid() = organizer_id);

-- Create index for performance
CREATE INDEX idx_events_organizer ON public.events(organizer_id);
CREATE INDEX idx_events_date ON public.events(event_date);
CREATE INDEX idx_events_live_video ON public.events(is_live_video) WHERE is_live_video = true;