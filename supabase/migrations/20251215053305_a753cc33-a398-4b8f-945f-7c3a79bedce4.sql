-- Create company_pages table for organization/company profiles
CREATE TABLE public.company_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  website text,
  social_links jsonb DEFAULT '{}',
  industry text,
  headcount text, -- e.g., '1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'
  country text,
  city text,
  location text,
  logo_url text,
  cover_image_url text,
  created_by uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add company_page_id to user_profiles for linking to company pages
ALTER TABLE public.user_profiles 
ADD COLUMN company_page_id uuid REFERENCES public.company_pages(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_company_pages_slug ON public.company_pages(slug);
CREATE INDEX idx_company_pages_industry ON public.company_pages(industry);
CREATE INDEX idx_company_pages_country ON public.company_pages(country);
CREATE INDEX idx_user_profiles_company_page ON public.user_profiles(company_page_id);

-- Enable RLS
ALTER TABLE public.company_pages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for company_pages
-- Anyone can view company pages
CREATE POLICY "Anyone can view company pages" 
ON public.company_pages 
FOR SELECT 
USING (true);

-- Authenticated users can create company pages
CREATE POLICY "Authenticated users can create company pages" 
ON public.company_pages 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

-- Creators can update their own company pages
CREATE POLICY "Creators can update their company pages" 
ON public.company_pages 
FOR UPDATE 
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

-- Creators can delete their own company pages
CREATE POLICY "Creators can delete their company pages" 
ON public.company_pages 
FOR DELETE 
USING (auth.uid() = created_by);

-- Create trigger for updated_at
CREATE TRIGGER update_company_pages_updated_at
BEFORE UPDATE ON public.company_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();