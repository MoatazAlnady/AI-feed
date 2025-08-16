-- Create tool_reviews table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.tool_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id uuid NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title text,
  comment text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (tool_id, user_id) -- one review per user per tool
);

-- Add status column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tool_reviews' AND column_name = 'status') THEN
    ALTER TABLE public.tool_reviews ADD COLUMN status text NOT NULL DEFAULT 'approved' CHECK (status IN ('approved','pending','rejected'));
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tool_reviews_tool_id ON public.tool_reviews(tool_id);
CREATE INDEX IF NOT EXISTS idx_tool_reviews_status ON public.tool_reviews(status);

-- Create aggregation view for performance (approved reviews only)
CREATE OR REPLACE VIEW public.tool_ratings_v AS
SELECT
  r.tool_id,
  COALESCE(AVG(r.rating)::numeric(3,2), 0)::float8 AS avg_rating,
  COUNT(*)::int AS reviews_count
FROM public.tool_reviews r
WHERE r.status = 'approved'
GROUP BY r.tool_id;

-- Enable RLS on tool_reviews
ALTER TABLE public.tool_reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Users can view all tool reviews" ON public.tool_reviews;
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON public.tool_reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.tool_reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.tool_reviews;

-- RLS policies for tool_reviews
CREATE POLICY "Users can view all tool reviews" ON public.tool_reviews
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reviews" ON public.tool_reviews
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    -- Prevent users from reviewing their own tools
    NOT EXISTS (
      SELECT 1 FROM public.tools 
      WHERE id = tool_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own reviews" ON public.tool_reviews
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" ON public.tool_reviews
  FOR DELETE USING (auth.uid() = user_id);

-- Update tools table to include denormalized rating fields if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tools' AND column_name = 'average_rating') THEN
    ALTER TABLE public.tools ADD COLUMN average_rating numeric(3,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tools' AND column_name = 'review_count') THEN
    ALTER TABLE public.tools ADD COLUMN review_count integer DEFAULT 0;
  END IF;
END $$;