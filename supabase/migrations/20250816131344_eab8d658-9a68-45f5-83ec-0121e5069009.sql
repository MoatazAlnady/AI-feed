-- Clean up shares table data issues
-- First, let's remove any rows that have NULL values in key fields
DELETE FROM public.shares 
WHERE content_id IS NULL OR content_type IS NULL;

-- Update any remaining rows to populate target fields if missing
UPDATE public.shares 
SET target_type = COALESCE(content_type, 'post'),
    target_id = content_id
WHERE target_type IS NULL OR target_id IS NULL;

-- Now create the functions and triggers
CREATE OR REPLACE FUNCTION public.update_share_count_v2()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_count INTEGER;
  target_id_val UUID;
  target_type_val TEXT;
BEGIN
  -- Get target info from NEW or OLD
  IF TG_OP = 'DELETE' THEN
    target_id_val := OLD.target_id;
    target_type_val := OLD.target_type;
  ELSE
    target_id_val := NEW.target_id;
    target_type_val := NEW.target_type;
  END IF;
  
  -- Calculate new share count
  SELECT COUNT(*) INTO new_count
  FROM shares 
  WHERE target_type = target_type_val AND target_id = target_id_val;
  
  -- Update the appropriate table based on target_type
  CASE target_type_val
    WHEN 'post' THEN
      UPDATE posts SET share_count = new_count WHERE id = target_id_val;
    WHEN 'article' THEN
      UPDATE articles SET share_count = new_count WHERE id = target_id_val;
    WHEN 'tool' THEN
      UPDATE tools SET share_count = new_count WHERE id = target_id_val;
  END CASE;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS update_share_count_trigger ON public.shares;
CREATE TRIGGER update_share_count_trigger
  AFTER INSERT OR DELETE ON public.shares
  FOR EACH ROW
  EXECUTE FUNCTION public.update_share_count_v2();

-- Function to recalculate all share counts
CREATE OR REPLACE FUNCTION public.recalc_post_shares()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update posts with correct share counts
  UPDATE posts 
  SET share_count = COALESCE(share_data.count, 0)
  FROM (
    SELECT target_id, COUNT(*) as count
    FROM shares 
    WHERE target_type = 'post'
    GROUP BY target_id
  ) share_data
  WHERE posts.id = share_data.target_id;
  
  -- Set share_count to 0 for posts with no shares
  UPDATE posts 
  SET share_count = 0 
  WHERE id NOT IN (
    SELECT target_id 
    FROM shares 
    WHERE target_type = 'post'
  ) AND share_count > 0;
END;
$$;

-- Run initial recalculation
SELECT public.recalc_post_shares();