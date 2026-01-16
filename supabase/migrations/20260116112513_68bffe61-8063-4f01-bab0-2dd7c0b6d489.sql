-- Create signup_reasons table with predefined reasons
CREATE TABLE public.signup_reasons (
  id SERIAL PRIMARY KEY,
  reason_text TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_other BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert predefined reasons with improved English
INSERT INTO public.signup_reasons (reason_text, display_order, is_other) VALUES
  ('Stay updated with AI trends and news', 1, false),
  ('Build connections and expand my network in AI communities', 2, false),
  ('Find employment opportunities in the AI industry', 3, false),
  ('Gain insights about AI markets and industry developments', 4, false),
  ('Showcase my AI projects, products, or business to the community', 5, false),
  ('Learn from AI experts and thought leaders', 6, false),
  ('Discover and evaluate AI tools and solutions', 7, false),
  ('Collaborate on AI research and development projects', 8, false),
  ('Other', 99, true);

-- Enable RLS
ALTER TABLE public.signup_reasons ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Anyone can view signup reasons"
  ON public.signup_reasons FOR SELECT
  USING (true);

-- Create user_signup_reasons junction table
CREATE TABLE public.user_signup_reasons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason_id INTEGER NOT NULL REFERENCES public.signup_reasons(id) ON DELETE CASCADE,
  other_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, reason_id)
);

-- Enable RLS
ALTER TABLE public.user_signup_reasons ENABLE ROW LEVEL SECURITY;

-- Users can view their own reasons
CREATE POLICY "Users can view own signup reasons"
  ON public.user_signup_reasons FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own reasons
CREATE POLICY "Users can insert own signup reasons"
  ON public.user_signup_reasons FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create user_cvs table for CV management
CREATE TABLE public.user_cvs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  is_primary BOOLEAN DEFAULT false,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  parsed_data JSONB
);

-- Enable RLS
ALTER TABLE public.user_cvs ENABLE ROW LEVEL SECURITY;

-- Users can view their own CVs
CREATE POLICY "Users can view own CVs"
  ON public.user_cvs FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own CVs
CREATE POLICY "Users can insert own CVs"
  ON public.user_cvs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own CVs
CREATE POLICY "Users can update own CVs"
  ON public.user_cvs FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own CVs
CREATE POLICY "Users can delete own CVs"
  ON public.user_cvs FOR DELETE
  USING (auth.uid() = user_id);

-- Create storage bucket for CVs
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-cvs', 'user-cvs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policy for authenticated users to upload their own CVs
CREATE POLICY "Users can upload own CVs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'user-cvs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can view their own CVs
CREATE POLICY "Users can view own CV files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'user-cvs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own CVs
CREATE POLICY "Users can delete own CV files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'user-cvs' AND auth.uid()::text = (storage.foldername(name))[1]);