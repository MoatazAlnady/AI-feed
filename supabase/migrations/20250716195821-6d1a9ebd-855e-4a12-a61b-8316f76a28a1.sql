-- Add country codes table with country mapping
CREATE TABLE public.country_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country_name TEXT NOT NULL,
  country_code TEXT NOT NULL UNIQUE,
  phone_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert country data with phone codes
INSERT INTO public.country_codes (country_name, country_code, phone_code) VALUES
('United States', 'US', '+1'),
('Canada', 'CA', '+1'),
('United Kingdom', 'GB', '+44'),
('Germany', 'DE', '+49'),
('France', 'FR', '+33'),
('Spain', 'ES', '+34'),
('Italy', 'IT', '+39'),
('Netherlands', 'NL', '+31'),
('Sweden', 'SE', '+46'),
('Norway', 'NO', '+47'),
('Denmark', 'DK', '+45'),
('Finland', 'FI', '+358'),
('Australia', 'AU', '+61'),
('New Zealand', 'NZ', '+64'),
('Japan', 'JP', '+81'),
('South Korea', 'KR', '+82'),
('Singapore', 'SG', '+65'),
('India', 'IN', '+91'),
('China', 'CN', '+86'),
('Brazil', 'BR', '+55'),
('Mexico', 'MX', '+52'),
('Argentina', 'AR', '+54'),
('Chile', 'CL', '+56'),
('South Africa', 'ZA', '+27'),
('Palestine', 'PS', '+970'),
('UAE', 'AE', '+971'),
('Switzerland', 'CH', '+41'),
('Austria', 'AT', '+43'),
('Belgium', 'BE', '+32'),
('Ireland', 'IE', '+353'),
('Portugal', 'PT', '+351'),
('Poland', 'PL', '+48'),
('Czech Republic', 'CZ', '+420'),
('Hungary', 'HU', '+36'),
('Romania', 'RO', '+40'),
('Russia', 'RU', '+7'),
('Turkey', 'TR', '+90'),
('Greece', 'GR', '+30'),
('Croatia', 'HR', '+385'),
('Bulgaria', 'BG', '+359'),
('Serbia', 'RS', '+381'),
('Slovenia', 'SI', '+386'),
('Slovakia', 'SK', '+421'),
('Estonia', 'EE', '+372'),
('Latvia', 'LV', '+371'),
('Lithuania', 'LT', '+370'),
('Malta', 'MT', '+356'),
('Cyprus', 'CY', '+357'),
('Luxembourg', 'LU', '+352'),
('Iceland', 'IS', '+354'),
('Thailand', 'TH', '+66'),
('Vietnam', 'VN', '+84'),
('Philippines', 'PH', '+63'),
('Indonesia', 'ID', '+62'),
('Malaysia', 'MY', '+60'),
('Bangladesh', 'BD', '+880'),
('Pakistan', 'PK', '+92'),
('Sri Lanka', 'LK', '+94'),
('Nepal', 'NP', '+977'),
('Myanmar', 'MM', '+95'),
('Cambodia', 'KH', '+855'),
('Laos', 'LA', '+856'),
('Saudi Arabia', 'SA', '+966'),
('Egypt', 'EG', '+20'),
('Iraq', 'IQ', '+964'),
('Jordan', 'JO', '+962'),
('Lebanon', 'LB', '+961'),
('Syria', 'SY', '+963'),
('Yemen', 'YE', '+967'),
('Kuwait', 'KW', '+965'),
('Qatar', 'QA', '+974'),
('Bahrain', 'BH', '+973'),
('Oman', 'OM', '+968'),
('Libya', 'LY', '+218'),
('Tunisia', 'TN', '+216'),
('Algeria', 'DZ', '+213'),
('Morocco', 'MA', '+212'),
('Sudan', 'SD', '+249'),
('Somalia', 'SO', '+252'),
('Djibouti', 'DJ', '+253'),
('Comoros', 'KM', '+269'),
('Mauritania', 'MR', '+222');

-- Enable Row Level Security on country_codes
ALTER TABLE public.country_codes ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access to country codes
CREATE POLICY "Country codes are viewable by everyone" 
ON public.country_codes 
FOR SELECT 
USING (true);

-- Add phone_country_code column to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN phone_country_code TEXT REFERENCES country_codes(phone_code);

-- Organizations table
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  admin_user_id UUID NOT NULL,
  max_users INTEGER NOT NULL DEFAULT 5,
  features_enabled JSONB NOT NULL DEFAULT '{"talents": true, "jobs": true, "projects": true}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Organization members table
CREATE TABLE public.organization_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'default' CHECK (role IN ('admin', 'default')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Enable RLS on organization_members
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Add organization_id to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN organization_id UUID REFERENCES organizations(id);

-- Policies for organizations
CREATE POLICY "Users can view their own organization" 
ON public.organizations 
FOR SELECT 
USING (
  admin_user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM organization_members 
    WHERE organization_id = id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create organizations" 
ON public.organizations 
FOR INSERT 
WITH CHECK (admin_user_id = auth.uid());

CREATE POLICY "Admin can update organization" 
ON public.organizations 
FOR UPDATE 
USING (admin_user_id = auth.uid())
WITH CHECK (admin_user_id = auth.uid());

CREATE POLICY "Admin can delete organization" 
ON public.organizations 
FOR DELETE 
USING (admin_user_id = auth.uid());

-- Policies for organization_members
CREATE POLICY "Users can view organization members" 
ON public.organization_members 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM organizations 
    WHERE id = organization_id AND 
    (admin_user_id = auth.uid() OR 
     EXISTS (SELECT 1 FROM organization_members om WHERE om.organization_id = id AND om.user_id = auth.uid()))
  )
);

CREATE POLICY "Admin can manage organization members" 
ON public.organization_members 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM organizations 
    WHERE id = organization_id AND admin_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organizations 
    WHERE id = organization_id AND admin_user_id = auth.uid()
  )
);

-- Create trigger for updated_at on organizations
CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();