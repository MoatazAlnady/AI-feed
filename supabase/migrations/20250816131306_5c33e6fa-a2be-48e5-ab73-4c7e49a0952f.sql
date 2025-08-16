-- Complete the shares system setup and fix security
-- Function to recalculate share counts for posts
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

-- Function to update share count when shares change
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
    WHEN 'job' THEN
      UPDATE jobs SET share_count = new_count WHERE id = target_id_val;
    WHEN 'tool' THEN
      UPDATE tools SET share_count = new_count WHERE id = target_id_val;
  END CASE;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Drop old triggers and create new one
DROP TRIGGER IF EXISTS update_share_count_trigger ON public.shares;
DROP TRIGGER IF EXISTS handle_content_share_trigger ON public.shares;

CREATE TRIGGER update_share_count_trigger
  AFTER INSERT OR DELETE ON public.shares
  FOR EACH ROW
  EXECUTE FUNCTION public.update_share_count_v2();

-- Migrate existing shared_posts data to shares table
INSERT INTO public.shares (user_id, target_type, target_id, created_at)
SELECT 
  user_id,
  'post' as target_type,
  original_post_id as target_id,
  created_at
FROM public.shared_posts
ON CONFLICT (user_id, target_type, target_id) DO NOTHING;

-- Run initial recalculation to fix existing share counts
SELECT public.recalc_post_shares();

-- Function for nightly share count correction
CREATE OR REPLACE FUNCTION public.nightly_share_recalc()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Recalculate for all content types
  
  -- Posts
  UPDATE posts 
  SET share_count = COALESCE(share_data.count, 0)
  FROM (
    SELECT target_id, COUNT(*) as count
    FROM shares 
    WHERE target_type = 'post'
    GROUP BY target_id
  ) share_data
  WHERE posts.id = share_data.target_id;
  
  UPDATE posts SET share_count = 0 
  WHERE id NOT IN (SELECT target_id FROM shares WHERE target_type = 'post') 
  AND share_count > 0;
  
  -- Articles
  UPDATE articles 
  SET share_count = COALESCE(share_data.count, 0)
  FROM (
    SELECT target_id, COUNT(*) as count
    FROM shares 
    WHERE target_type = 'article'
    GROUP BY target_id
  ) share_data
  WHERE articles.id = share_data.target_id;
  
  UPDATE articles SET share_count = 0 
  WHERE id NOT IN (SELECT target_id FROM shares WHERE target_type = 'article') 
  AND share_count > 0;
  
  -- Tools
  UPDATE tools 
  SET share_count = COALESCE(share_data.count, 0)
  FROM (
    SELECT target_id, COUNT(*) as count
    FROM shares 
    WHERE target_type = 'tool'
    GROUP BY target_id
  ) share_data
  WHERE tools.id = share_data.target_id;
  
  UPDATE tools SET share_count = 0 
  WHERE id NOT IN (SELECT target_id FROM shares WHERE target_type = 'tool') 
  AND share_count > 0;
  
  -- Jobs (if table exists)
  UPDATE jobs 
  SET share_count = COALESCE(share_data.count, 0)
  FROM (
    SELECT target_id, COUNT(*) as count
    FROM shares 
    WHERE target_type = 'job'
    GROUP BY target_id
  ) share_data
  WHERE jobs.id = share_data.target_id;
  
  UPDATE jobs SET share_count = 0 
  WHERE id NOT IN (SELECT target_id FROM shares WHERE target_type = 'job') 
  AND share_count > 0;
  
  RAISE NOTICE 'Nightly share count recalculation completed';
END;
$$;