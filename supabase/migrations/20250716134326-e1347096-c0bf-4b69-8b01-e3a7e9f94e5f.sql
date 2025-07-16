-- Create site_content table for admin content management
CREATE TABLE public.site_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_key TEXT NOT NULL UNIQUE,
  content_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  content_type TEXT NOT NULL DEFAULT 'text',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- Create policies for site_content
CREATE POLICY "Anyone can view site content" 
ON public.site_content 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage site content" 
ON public.site_content 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_profiles 
  WHERE id = auth.uid() AND account_type = 'admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM user_profiles 
  WHERE id = auth.uid() AND account_type = 'admin'
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_site_content_updated_at
BEFORE UPDATE ON public.site_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default content for the website
INSERT INTO public.site_content (content_key, content_value, content_type, description) VALUES
('hero_title', '"Welcome to AI Nexus"', 'text', 'Main hero title on homepage'),
('hero_subtitle', '"The unified SaaS platform connecting AI-skilled creators"', 'text', 'Hero subtitle text'),
('about_us', '"AI Nexus is the premier platform for discovering AI tools and connecting with talented creators in the artificial intelligence space."', 'textarea', 'About us page content'),
('features_section_title', '"Everything you need in one platform"', 'text', 'Features section title'),
('features_section_subtitle', '"Discover, connect, and collaborate in the AI ecosystem"', 'text', 'Features section subtitle'),
('stats_tools', '500', 'number', 'Number of AI tools listed'),
('stats_creators', '10000', 'number', 'Number of active creators'),
('stats_projects', '50000', 'number', 'Number of projects completed'),
('cta_title', '"Ready to join the AI revolution?"', 'text', 'Call to action title'),
('cta_subtitle', '"Start your journey with AI Nexus today and connect with the future of technology."', 'text', 'Call to action subtitle');