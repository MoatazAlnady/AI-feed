-- Create function to increment tool views atomically
CREATE OR REPLACE FUNCTION public.increment_tool_views(tool_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE tools
  SET views = COALESCE(views, 0) + 1
  WHERE id = tool_id;
END;
$$;