-- Create table for tracking AI chat daily usage
CREATE TABLE public.ai_chat_daily_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  prompts_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, usage_date)
);

-- Enable RLS
ALTER TABLE public.ai_chat_daily_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view their own AI chat usage" 
ON public.ai_chat_daily_usage 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own usage records
CREATE POLICY "Users can insert their own AI chat usage" 
ON public.ai_chat_daily_usage 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own usage records
CREATE POLICY "Users can update their own AI chat usage" 
ON public.ai_chat_daily_usage 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_ai_chat_daily_usage_updated_at
BEFORE UPDATE ON public.ai_chat_daily_usage
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();