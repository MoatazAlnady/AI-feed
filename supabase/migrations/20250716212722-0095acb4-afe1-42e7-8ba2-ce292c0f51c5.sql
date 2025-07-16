-- Add notification_preferences column to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN notification_preferences JSONB DEFAULT '{
  "email_newsletter": true,
  "email_messages": true,
  "email_likes": false,
  "email_comments": true,
  "email_follows": true,
  "email_events": true,
  "push_messages": true,
  "push_likes": true,
  "push_comments": true,
  "push_follows": true,
  "push_events": true
}'::jsonb;