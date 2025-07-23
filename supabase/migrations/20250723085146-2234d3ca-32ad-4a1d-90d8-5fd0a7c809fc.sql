-- Create sub_categories table with better structure
DROP TABLE IF EXISTS sub_categories CASCADE;

CREATE TABLE public.sub_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(category_id, slug)
);

-- Add category_id and sub_category_ids to tools table
ALTER TABLE public.tools 
ADD COLUMN IF NOT EXISTS sub_category_ids UUID[] DEFAULT '{}';

-- Enable RLS
ALTER TABLE public.sub_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sub_categories
CREATE POLICY "Anyone can view sub_categories"
ON public.sub_categories FOR SELECT
USING (true);

CREATE POLICY "Admins can manage sub_categories"
ON public.sub_categories FOR ALL
USING (
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

-- Create updated_at trigger for sub_categories
CREATE TRIGGER update_sub_categories_updated_at
BEFORE UPDATE ON public.sub_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to prevent deletion of categories/sub-categories with assigned tools
CREATE OR REPLACE FUNCTION check_category_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if any tools are assigned to this category
  IF EXISTS (
    SELECT 1 FROM tools WHERE category_id = OLD.id
  ) THEN
    RAISE EXCEPTION 'Cannot delete category: tools are still assigned to it';
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_subcategory_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if any tools are assigned to this sub-category
  IF EXISTS (
    SELECT 1 FROM tools WHERE OLD.id = ANY(sub_category_ids)
  ) THEN
    RAISE EXCEPTION 'Cannot delete sub-category: tools are still assigned to it';
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to prevent deletion
CREATE TRIGGER prevent_category_deletion
BEFORE DELETE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION check_category_deletion();

CREATE TRIGGER prevent_subcategory_deletion
BEFORE DELETE ON public.sub_categories
FOR EACH ROW
EXECUTE FUNCTION check_subcategory_deletion();