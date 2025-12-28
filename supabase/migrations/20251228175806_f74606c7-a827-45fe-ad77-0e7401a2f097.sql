-- Track ad impressions per content
CREATE TABLE IF NOT EXISTS content_ad_impressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL,
  content_id UUID NOT NULL,
  creator_id UUID REFERENCES auth.users(id),
  ad_type TEXT NOT NULL,
  impression_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  estimated_revenue DECIMAL(10,4) DEFAULT 0,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(content_type, content_id, ad_type, date)
);

-- Track creator ad earnings (70/30 split)
CREATE TABLE IF NOT EXISTS creator_ad_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES auth.users(id) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_impressions INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  gross_revenue DECIMAL(10,2) DEFAULT 0,
  platform_fee DECIMAL(10,2) DEFAULT 0,
  creator_payout DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid')),
  payout_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE content_ad_impressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_ad_earnings ENABLE ROW LEVEL SECURITY;

-- Creators can view their own ad impressions
CREATE POLICY "Creators can view own ad impressions" 
  ON content_ad_impressions FOR SELECT 
  USING (auth.uid() = creator_id);

-- Creators can view their own earnings
CREATE POLICY "Creators can view own earnings" 
  ON creator_ad_earnings FOR SELECT 
  USING (auth.uid() = creator_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ad_impressions_creator ON content_ad_impressions(creator_id);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_date ON content_ad_impressions(date);
CREATE INDEX IF NOT EXISTS idx_ad_earnings_creator ON creator_ad_earnings(creator_id);
CREATE INDEX IF NOT EXISTS idx_ad_earnings_period ON creator_ad_earnings(period_start, period_end);