-- First, let's create the categories and sub_categories tables for the CRUD UI

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create sub_categories table  
CREATE TABLE IF NOT EXISTS public.sub_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(category_id, name)
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for categories
CREATE POLICY "Anyone can view categories" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories" ON public.categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND account_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND account_type = 'admin'
    )
  );

-- Create RLS policies for sub_categories  
CREATE POLICY "Anyone can view sub_categories" ON public.sub_categories
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage sub_categories" ON public.sub_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND account_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND account_type = 'admin'
    )
  );

-- Create triggers for updated_at
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sub_categories_updated_at
  BEFORE UPDATE ON public.sub_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add some initial categories data
INSERT INTO public.categories (name, slug, description) VALUES
('Conversational AI', 'conversational-ai', 'AI tools for chatbots and conversation'),
('Image Generation', 'image-generation', 'AI tools for creating images'),
('Video AI', 'video-ai', 'AI tools for video creation and editing'),
('Code Assistant', 'code-assistant', 'AI tools for coding and development'),
('Data Analysis', 'data-analysis', 'AI tools for data processing and analysis'),
('Audio AI', 'audio-ai', 'AI tools for audio processing'),
('Writing & Content', 'writing-content', 'AI tools for writing and content creation'),
('Productivity', 'productivity', 'AI tools for productivity and automation')
ON CONFLICT (name) DO NOTHING;

-- Add initial sub-categories  
INSERT INTO public.sub_categories (category_id, name, slug) VALUES
((SELECT id FROM categories WHERE slug = 'conversational-ai'), 'Customer Support', 'customer-support'),
((SELECT id FROM categories WHERE slug = 'conversational-ai'), 'Virtual Assistants', 'virtual-assistants'),
((SELECT id FROM categories WHERE slug = 'conversational-ai'), 'Chatbots', 'chatbots'),
((SELECT id FROM categories WHERE slug = 'image-generation'), 'Art & Design', 'art-design'),
((SELECT id FROM categories WHERE slug = 'image-generation'), 'Photo Editing', 'photo-editing'),
((SELECT id FROM categories WHERE slug = 'image-generation'), 'Logos & Graphics', 'logos-graphics'),
((SELECT id FROM categories WHERE slug = 'video-ai'), 'Video Editing', 'video-editing'),
((SELECT id FROM categories WHERE slug = 'video-ai'), 'Animation', 'animation'),
((SELECT id FROM categories WHERE slug = 'video-ai'), 'Video Generation', 'video-generation'),
((SELECT id FROM categories WHERE slug = 'code-assistant'), 'Code Generation', 'code-generation'),
((SELECT id FROM categories WHERE slug = 'code-assistant'), 'Code Review', 'code-review'),
((SELECT id FROM categories WHERE slug = 'code-assistant'), 'Debugging', 'debugging')
ON CONFLICT (category_id, name) DO NOTHING;