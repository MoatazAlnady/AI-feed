-- Create shared_posts table for tracking post shares
CREATE TABLE public.shared_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  original_post_id UUID NOT NULL,
  share_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.shared_posts ENABLE ROW LEVEL SECURITY;

-- Create policies for shared posts
CREATE POLICY "Users can view all shared posts" 
ON public.shared_posts 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own shared posts" 
ON public.shared_posts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shared posts" 
ON public.shared_posts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shared posts" 
ON public.shared_posts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE TRIGGER update_shared_posts_updated_at
BEFORE UPDATE ON public.shared_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create pricing_plans table for organizations
CREATE TABLE public.pricing_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  billing_interval TEXT NOT NULL DEFAULT 'monthly', -- monthly, yearly
  max_users INTEGER,
  features JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;

-- Create policies for pricing plans
CREATE POLICY "Anyone can view active pricing plans" 
ON public.pricing_plans 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage pricing plans" 
ON public.pricing_plans 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_profiles 
  WHERE id = auth.uid() AND account_type = 'admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM user_profiles 
  WHERE id = auth.uid() AND account_type = 'admin'
));

-- Create trigger for timestamps
CREATE TRIGGER update_pricing_plans_updated_at
BEFORE UPDATE ON public.pricing_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();