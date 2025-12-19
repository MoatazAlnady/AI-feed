-- Create table to track AI chat usage for anonymous/non-logged-in users
CREATE TABLE public.anonymous_ai_chat_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_fingerprint TEXT NOT NULL,
  ip_address TEXT,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  prompts_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(device_fingerprint, usage_date)
);

-- Enable RLS
ALTER TABLE public.anonymous_ai_chat_usage ENABLE ROW LEVEL SECURITY;

-- Policy to allow edge functions (service role) to manage this table
-- Anonymous users cannot directly access this - only through the edge function
CREATE POLICY "Service role can manage anonymous usage"
ON public.anonymous_ai_chat_usage
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_anonymous_ai_chat_usage_fingerprint_date 
ON public.anonymous_ai_chat_usage(device_fingerprint, usage_date);

-- Create trigger for updating updated_at
CREATE TRIGGER update_anonymous_ai_chat_usage_updated_at
BEFORE UPDATE ON public.anonymous_ai_chat_usage
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();