-- Event recordings table for storing live stream recordings, transcripts, and summaries
CREATE TABLE public.event_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  event_type TEXT DEFAULT 'event' CHECK (event_type IN ('event', 'group_event', 'standalone_event')),
  recording_url TEXT,
  duration_seconds INTEGER DEFAULT 0,
  file_size_bytes BIGINT DEFAULT 0,
  transcript TEXT,
  transcript_language TEXT,
  summary TEXT,
  status TEXT DEFAULT 'uploading' CHECK (status IN ('uploading', 'processing', 'transcribing', 'summarizing', 'ready', 'failed')),
  error_message TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NOT NULL
);

-- Enable RLS
ALTER TABLE public.event_recordings ENABLE ROW LEVEL SECURITY;

-- Policies for event_recordings
-- Anyone can view recordings for events they can access (public events or attendees)
CREATE POLICY "Anyone can view recordings of public events"
ON public.event_recordings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_recordings.event_id
    AND e.is_public = true
  )
);

CREATE POLICY "Attendees can view event recordings"
ON public.event_recordings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.event_attendees ea
    WHERE ea.event_id = event_recordings.event_id
    AND ea.user_id = auth.uid()
    AND ea.status = 'attending'
  )
);

-- Only event creators can insert recordings
CREATE POLICY "Event creators can insert recordings"
ON public.event_recordings FOR INSERT
WITH CHECK (
  auth.uid() = created_by AND
  (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_recordings.event_id
      AND (e.creator_id = auth.uid() OR e.organizer_id = auth.uid())
    )
  )
);

-- Event creators can update their recordings
CREATE POLICY "Event creators can update recordings"
ON public.event_recordings FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_recordings.event_id
    AND (e.creator_id = auth.uid() OR e.organizer_id = auth.uid())
  )
);

-- Create storage bucket for recordings if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-recordings', 'event-recordings', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for event recordings bucket
CREATE POLICY "Anyone can view event recordings"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-recordings');

CREATE POLICY "Authenticated users can upload recordings"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'event-recordings' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their recordings"
ON storage.objects FOR UPDATE
USING (bucket_id = 'event-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their recordings"
ON storage.objects FOR DELETE
USING (bucket_id = 'event-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);