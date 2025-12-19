-- Add unsubscribe_token to newsletter_subscribers
ALTER TABLE public.newsletter_subscribers 
ADD COLUMN IF NOT EXISTS unsubscribe_token UUID DEFAULT gen_random_uuid() UNIQUE;

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_newsletter_unsubscribe_token 
ON public.newsletter_subscribers(unsubscribe_token);