-- Update reach calculation to give high initial reach to posts without reactions
-- and boost reach for shared posts

CREATE OR REPLACE FUNCTION calculate_post_reach_score(post_id_param UUID)
RETURNS DECIMAL
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  base_score DECIMAL := 2.0; -- Higher initial score for new posts
  reaction_multiplier DECIMAL := 0.0;
  total_reactions INTEGER := 0;
  unlike_count INTEGER := 0;
  share_boost DECIMAL := 0.0;
  share_count INTEGER := 0;
BEGIN
  -- Count total reactions
  SELECT COUNT(*) INTO total_reactions
  FROM post_reactions 
  WHERE post_id = post_id_param;
  
  -- Count unlike reactions (these reduce reach)
  SELECT COUNT(*) INTO unlike_count
  FROM post_reactions 
  WHERE post_id = post_id_param AND reaction_type = 'unlike';
  
  -- Count how many times this post has been shared
  SELECT COUNT(*) INTO share_count
  FROM shared_posts 
  WHERE original_post_id = post_id_param;
  
  -- Give posts without reactions high initial reach
  IF total_reactions = 0 THEN
    -- New posts get boosted reach to give them visibility
    base_score := 3.0;
    
    -- Shared posts get additional boost even without reactions
    IF share_count > 0 THEN
      base_score := base_score + (share_count * 0.5);
    END IF;
    
    RETURN base_score;
  END IF;
  
  -- Calculate reaction multipliers based on reaction types
  SELECT 
    COALESCE(SUM(
      CASE reaction_type
        WHEN 'like' THEN 0.1
        WHEN 'love' THEN 0.3
        WHEN 'insightful' THEN 0.4
        WHEN 'smart' THEN 0.4
        WHEN 'bravo' THEN 0.35
        WHEN 'support' THEN 0.25
        WHEN 'funny' THEN 0.2
        WHEN 'unlike' THEN -0.5
        ELSE 0
      END
    ), 0) INTO reaction_multiplier
  FROM post_reactions 
  WHERE post_id = post_id_param;
  
  -- Add share boost - each share significantly increases reach
  share_boost := share_count * 0.8;
  
  -- Calculate final reach score
  -- Base score + reaction multiplier + share boost, but heavily penalize if more than 20% are unlikes
  IF total_reactions > 0 AND (unlike_count::DECIMAL / total_reactions::DECIMAL) > 0.2 THEN
    base_score := base_score * 0.3; -- Reduce reach by 70% for heavily disliked posts
  END IF;
  
  RETURN GREATEST(0.1, base_score + reaction_multiplier + share_boost);
END;
$$;

-- Also update shared posts reach when they are created
CREATE OR REPLACE FUNCTION update_shared_post_reach()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_reach_score DECIMAL;
BEGIN
  -- Calculate new reach score for the original post when it gets shared
  new_reach_score := calculate_post_reach_score(NEW.original_post_id);
  
  -- Update the original post's reach score
  UPDATE posts 
  SET reach_score = new_reach_score 
  WHERE id = NEW.original_post_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger for when posts are shared
CREATE TRIGGER update_reach_on_share
AFTER INSERT ON shared_posts
FOR EACH ROW
EXECUTE FUNCTION update_shared_post_reach();

-- Initialize reach scores for existing posts
UPDATE posts 
SET reach_score = calculate_post_reach_score(id)
WHERE reach_score IS NULL OR reach_score = 0;