-- Fix tool_ratings_v view - ensure no SECURITY DEFINER
DROP VIEW IF EXISTS public.tool_ratings_v CASCADE;

CREATE OR REPLACE VIEW public.tool_ratings_v 
WITH (security_invoker = true)
AS
SELECT 
  tool_id,
  AVG(rating)::numeric(2,1) as avg_rating,
  COUNT(*)::integer as reviews_count
FROM public.tool_reviews
WHERE status = 'approved'
GROUP BY tool_id;