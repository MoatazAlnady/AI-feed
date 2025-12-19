-- Add unsubscribe token and is_active to creator_newsletter_subscribers
ALTER TABLE public.creator_newsletter_subscribers 
ADD COLUMN IF NOT EXISTS unsubscribe_token UUID DEFAULT gen_random_uuid() UNIQUE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add receive_newsletter preference to creator_subscriptions
ALTER TABLE public.creator_subscriptions 
ADD COLUMN IF NOT EXISTS receive_newsletter BOOLEAN DEFAULT true;

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_creator_newsletter_unsubscribe_token 
ON public.creator_newsletter_subscribers(unsubscribe_token);

-- Create index for active subscriptions
CREATE INDEX IF NOT EXISTS idx_creator_newsletter_active 
ON public.creator_newsletter_subscribers(is_active) WHERE is_active = true;