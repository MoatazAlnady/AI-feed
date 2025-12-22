-- Fix Mahmoud's role_id from 1 (admin) to 4 (regular user)
UPDATE user_profiles 
SET role_id = 4, account_type = 'creator' 
WHERE id = '862a4293-ec9b-48ff-9211-81f52371289e';

-- Set admin account as premium permanently
UPDATE user_profiles 
SET is_premium = true, premium_until = '2099-12-31' 
WHERE id = 'f603cf89-6e48-4fd4-b3f8-dadeed2f949c';

-- Create promo_codes table
CREATE TABLE public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) UNIQUE NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL DEFAULT 'free_year',
  discount_value INTEGER DEFAULT 12,
  max_uses INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create promo_code_redemptions table
CREATE TABLE public.promo_code_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  premium_granted_until TIMESTAMP WITH TIME ZONE,
  UNIQUE(promo_code_id, user_id)
);

-- Enable RLS
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_code_redemptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for promo_codes - Admins can manage
CREATE POLICY "Admins can manage promo codes" ON public.promo_codes
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
      AND (role_id = 1 OR account_type = 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
      AND (role_id = 1 OR account_type = 'admin')
    )
  );

-- Users can view active promo codes for validation
CREATE POLICY "Users can view active promo codes" ON public.promo_codes
  FOR SELECT TO authenticated
  USING (is_active = true);

-- RLS Policies for redemptions
CREATE POLICY "Users can view their own redemptions" ON public.promo_code_redemptions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can redeem codes" ON public.promo_code_redemptions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all redemptions" ON public.promo_code_redemptions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
      AND (role_id = 1 OR account_type = 'admin')
    )
  );

-- Generate 10 unique promo codes for free year
INSERT INTO public.promo_codes (code, description, discount_type, discount_value, max_uses, valid_until)
VALUES 
  ('FREEYEAR001', 'Free 1 year premium subscription', 'free_year', 12, 1, NOW() + INTERVAL '1 year'),
  ('FREEYEAR002', 'Free 1 year premium subscription', 'free_year', 12, 1, NOW() + INTERVAL '1 year'),
  ('FREEYEAR003', 'Free 1 year premium subscription', 'free_year', 12, 1, NOW() + INTERVAL '1 year'),
  ('FREEYEAR004', 'Free 1 year premium subscription', 'free_year', 12, 1, NOW() + INTERVAL '1 year'),
  ('FREEYEAR005', 'Free 1 year premium subscription', 'free_year', 12, 1, NOW() + INTERVAL '1 year'),
  ('FREEYEAR006', 'Free 1 year premium subscription', 'free_year', 12, 1, NOW() + INTERVAL '1 year'),
  ('FREEYEAR007', 'Free 1 year premium subscription', 'free_year', 12, 1, NOW() + INTERVAL '1 year'),
  ('FREEYEAR008', 'Free 1 year premium subscription', 'free_year', 12, 1, NOW() + INTERVAL '1 year'),
  ('FREEYEAR009', 'Free 1 year premium subscription', 'free_year', 12, 1, NOW() + INTERVAL '1 year'),
  ('FREEYEAR010', 'Free 1 year premium subscription', 'free_year', 12, 1, NOW() + INTERVAL '1 year');