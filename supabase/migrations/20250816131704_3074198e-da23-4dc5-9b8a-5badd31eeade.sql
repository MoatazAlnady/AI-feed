-- Add some test newsletter subscribers to verify the display works
INSERT INTO public.newsletter_subscribers (email, frequency, user_id) VALUES
('test1@example.com', 'weekly', NULL),
('test2@example.com', 'daily', NULL),
('test3@example.com', 'monthly', NULL);

-- Verify the data was inserted
SELECT id, email, frequency, user_id, created_at FROM public.newsletter_subscribers;