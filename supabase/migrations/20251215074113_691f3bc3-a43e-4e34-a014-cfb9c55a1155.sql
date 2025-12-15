-- Create "AI Feed" company page
INSERT INTO company_pages (
  id,
  name,
  slug,
  created_by,
  subscription_status,
  max_employees,
  description,
  industry
) VALUES (
  gen_random_uuid(),
  'AI Feed',
  'ai-feed',
  '862a4293-ec9b-48ff-9211-81f52371289e',
  'active',
  10,
  'Your AI-powered content and tools platform',
  'Technology'
);

-- Add user as admin of the company
INSERT INTO company_employees (
  user_id,
  company_page_id,
  role
) 
SELECT 
  '862a4293-ec9b-48ff-9211-81f52371289e',
  id,
  'admin'
FROM company_pages 
WHERE slug = 'ai-feed';

-- Update user profile to employer and link to company
UPDATE user_profiles 
SET 
  account_type = 'employer',
  company_page_id = (SELECT id FROM company_pages WHERE slug = 'ai-feed')
WHERE id = '862a4293-ec9b-48ff-9211-81f52371289e';