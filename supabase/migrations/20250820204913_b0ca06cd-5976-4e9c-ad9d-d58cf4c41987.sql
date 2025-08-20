-- Fix share count sync for reshared posts by recalculating all share counts
-- This will ensure accurate share counts across all content types

-- Recalculate share counts for posts
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

-- Also handle shared_posts table separately to ensure consistency
UPDATE posts 
SET share_count = COALESCE((
  SELECT COUNT(*) 
  FROM shared_posts 
  WHERE shared_posts.original_post_id = posts.id
), 0) + COALESCE((
  SELECT COUNT(*) 
  FROM shares 
  WHERE shares.target_type = 'post' AND shares.target_id = posts.id
), 0)
WHERE id IN (
  SELECT DISTINCT original_post_id 
  FROM shared_posts
);

-- Recalculate share counts for tools  
UPDATE tools 
SET share_count = COALESCE(share_data.count, 0)
FROM (
  SELECT target_id, COUNT(*) as count
  FROM shares 
  WHERE target_type = 'tool'
  GROUP BY target_id
) share_data
WHERE tools.id = share_data.target_id;

-- Set share_count to 0 for tools with no shares
UPDATE tools 
SET share_count = 0 
WHERE id NOT IN (
  SELECT target_id 
  FROM shares 
  WHERE target_type = 'tool'
) AND share_count > 0;

-- Recalculate share counts for articles
UPDATE articles 
SET share_count = COALESCE(share_data.count, 0)
FROM (
  SELECT target_id, COUNT(*) as count
  FROM shares 
  WHERE target_type = 'article'
  GROUP BY target_id
) share_data
WHERE articles.id = share_data.target_id;

-- Set share_count to 0 for articles with no shares
UPDATE articles 
SET share_count = 0 
WHERE id NOT IN (
  SELECT target_id 
  FROM shares 
  WHERE target_type = 'article'
) AND share_count > 0;