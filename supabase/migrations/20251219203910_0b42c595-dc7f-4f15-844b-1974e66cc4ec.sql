-- Create promotions table to track promotion campaigns
CREATE TABLE public.promotions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('tool', 'article', 'post', 'job', 'event', 'profile')),
  content_id TEXT NOT NULL,
  content_title TEXT NOT NULL,
  
  -- Campaign settings
  budget DECIMAL(10,2) NOT NULL,
  duration INTEGER NOT NULL, -- days
  objective TEXT NOT NULL,
  
  -- Targeting data stored as JSONB
  targeting_data JSONB NOT NULL DEFAULT '{}',
  
  -- Status and payment
  status TEXT NOT NULL DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'active', 'paused', 'completed', 'cancelled', 'failed')),
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  
  -- Campaign timeline
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  
  -- Analytics
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- Users can view their own promotions
CREATE POLICY "Users can view their own promotions" 
ON public.promotions 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can create their own promotions
CREATE POLICY "Users can create their own promotions" 
ON public.promotions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own promotions
CREATE POLICY "Users can update their own promotions" 
ON public.promotions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_promotions_user_id ON public.promotions(user_id);
CREATE INDEX idx_promotions_status ON public.promotions(status);
CREATE INDEX idx_promotions_content ON public.promotions(content_type, content_id);

-- Create trigger to update updated_at
CREATE TRIGGER update_promotions_updated_at
BEFORE UPDATE ON public.promotions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();