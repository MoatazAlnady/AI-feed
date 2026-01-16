-- Create user_experience table for detailed work history
CREATE TABLE public.user_experience (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_title TEXT NOT NULL,
  company TEXT NOT NULL,
  company_logo_url TEXT,
  location TEXT,
  employment_type TEXT, -- 'full-time', 'part-time', 'contract', 'freelance', 'internship'
  start_month INTEGER CHECK (start_month >= 1 AND start_month <= 12),
  start_year INTEGER NOT NULL,
  end_month INTEGER CHECK (end_month >= 1 AND end_month <= 12),
  end_year INTEGER,
  is_current BOOLEAN DEFAULT false,
  description TEXT,
  skills_used TEXT[],
  display_order INTEGER DEFAULT 0,
  source TEXT DEFAULT 'manual', -- 'manual', 'cv_import'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_experience ENABLE ROW LEVEL SECURITY;

-- Users can view their own experience
CREATE POLICY "Users can view own experience"
  ON public.user_experience FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own experience
CREATE POLICY "Users can insert own experience"
  ON public.user_experience FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own experience
CREATE POLICY "Users can update own experience"
  ON public.user_experience FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own experience
CREATE POLICY "Users can delete own experience"
  ON public.user_experience FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_user_experience_user_id ON public.user_experience(user_id);

-- Create trigger for updating updated_at
CREATE TRIGGER update_user_experience_updated_at
  BEFORE UPDATE ON public.user_experience
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();