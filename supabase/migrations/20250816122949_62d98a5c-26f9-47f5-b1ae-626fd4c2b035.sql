-- Create newsletter subscribers table
CREATE TABLE public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  frequency text CHECK (frequency IN ('daily','weekly','monthly')) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create interests table if it doesn't exist (for the platform)
CREATE TABLE IF NOT EXISTS public.interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create bridge table for subscriber interests
CREATE TABLE public.newsletter_subscriber_interests (
  subscriber_id uuid REFERENCES newsletter_subscribers(id) ON DELETE CASCADE,
  interest_id uuid REFERENCES interests(id) ON DELETE CASCADE,
  PRIMARY KEY (subscriber_id, interest_id)
);

-- Create newsletter issues table
CREATE TABLE public.newsletter_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  frequency text CHECK (frequency IN ('daily','weekly','monthly')) NOT NULL,
  status text CHECK (status IN ('draft','scheduled','sent')) DEFAULT 'draft',
  scheduled_for timestamptz NULL,
  subject text,
  intro_text text,
  outro_text text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create newsletter issue items table
CREATE TABLE public.newsletter_issue_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid REFERENCES newsletter_issues(id) ON DELETE CASCADE,
  content_type text CHECK (content_type IN ('tool','article','job','event','post')) NOT NULL,
  content_id uuid NOT NULL,
  title_snapshot text NOT NULL,
  url_snapshot text NOT NULL,
  blurb_snapshot text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create newsletter issue recipients table (segment snapshot)
CREATE TABLE public.newsletter_issue_recipients (
  issue_id uuid REFERENCES newsletter_issues(id) ON DELETE CASCADE,
  subscriber_id uuid REFERENCES newsletter_subscribers(id) ON DELETE CASCADE,
  PRIMARY KEY (issue_id, subscriber_id)
);

-- Create delivery log table
CREATE TABLE public.newsletter_delivery_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid REFERENCES newsletter_issues(id) ON DELETE CASCADE,
  subscriber_id uuid REFERENCES newsletter_subscribers(id) ON DELETE CASCADE,
  sent_at timestamptz DEFAULT now(),
  status text DEFAULT 'sent',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscriber_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_issue_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_issue_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_delivery_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (admin-only access)
CREATE POLICY "Only admins can manage newsletter subscribers" 
ON public.newsletter_subscribers 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_profiles 
  WHERE id = auth.uid() AND account_type = 'admin'
));

CREATE POLICY "Only admins can manage subscriber interests" 
ON public.newsletter_subscriber_interests 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_profiles 
  WHERE id = auth.uid() AND account_type = 'admin'
));

CREATE POLICY "Only admins can manage newsletter issues" 
ON public.newsletter_issues 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_profiles 
  WHERE id = auth.uid() AND account_type = 'admin'
));

CREATE POLICY "Only admins can manage issue items" 
ON public.newsletter_issue_items 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_profiles 
  WHERE id = auth.uid() AND account_type = 'admin'
));

CREATE POLICY "Only admins can manage issue recipients" 
ON public.newsletter_issue_recipients 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_profiles 
  WHERE id = auth.uid() AND account_type = 'admin'
));

CREATE POLICY "Only admins can view delivery logs" 
ON public.newsletter_delivery_log 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_profiles 
  WHERE id = auth.uid() AND account_type = 'admin'
));

CREATE POLICY "Anyone can view interests" 
ON public.interests 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage interests" 
ON public.interests 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_profiles 
  WHERE id = auth.uid() AND account_type = 'admin'
));

-- Create indexes for performance
CREATE INDEX idx_newsletter_subscribers_frequency ON newsletter_subscribers(frequency);
CREATE INDEX idx_newsletter_subscribers_email ON newsletter_subscribers(email);
CREATE INDEX idx_newsletter_issues_status ON newsletter_issues(status);
CREATE INDEX idx_newsletter_issues_frequency ON newsletter_issues(frequency);
CREATE INDEX idx_newsletter_issue_items_issue_id ON newsletter_issue_items(issue_id);
CREATE INDEX idx_newsletter_issue_items_sort_order ON newsletter_issue_items(issue_id, sort_order);

-- Add triggers for updated_at
CREATE TRIGGER update_newsletter_issues_updated_at 
  BEFORE UPDATE ON newsletter_issues 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Insert some default interests if table is empty
INSERT INTO public.interests (name, slug, description) VALUES
('Artificial Intelligence', 'ai', 'AI and machine learning technologies'),
('Web Development', 'web-dev', 'Frontend and backend web development'),
('Mobile Development', 'mobile-dev', 'iOS and Android app development'),
('Data Science', 'data-science', 'Data analysis and data science'),
('DevOps', 'devops', 'Development operations and infrastructure'),
('Design', 'design', 'UI/UX and graphic design'),
('Marketing', 'marketing', 'Digital marketing and growth'),
('Business', 'business', 'Business strategy and entrepreneurship'),
('Productivity', 'productivity', 'Tools and techniques for productivity'),
('Education', 'education', 'Learning and educational resources')
ON CONFLICT (slug) DO NOTHING;