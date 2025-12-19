-- Add premium fields to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS premium_until TIMESTAMP WITH TIME ZONE;

-- Create tool comparison cache table
CREATE TABLE IF NOT EXISTS tool_comparison_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_ids_hash TEXT NOT NULL UNIQUE,
  tool_ids UUID[] NOT NULL,
  ai_insight TEXT NOT NULL,
  category_ids UUID[],
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tools_max_updated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE tool_comparison_cache ENABLE ROW LEVEL SECURITY;

-- Anyone can read cached comparisons
CREATE POLICY "Anyone can read comparison cache"
ON tool_comparison_cache
FOR SELECT
USING (true);

-- Only authenticated users can create cache entries
CREATE POLICY "Authenticated users can create cache"
ON tool_comparison_cache
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow upsert by making update possible
CREATE POLICY "Authenticated users can update cache"
ON tool_comparison_cache
FOR UPDATE
USING (true)
WITH CHECK (auth.uid() IS NOT NULL);

-- Create index for fast lookup
CREATE INDEX IF NOT EXISTS idx_tool_comparison_cache_hash ON tool_comparison_cache(tool_ids_hash);