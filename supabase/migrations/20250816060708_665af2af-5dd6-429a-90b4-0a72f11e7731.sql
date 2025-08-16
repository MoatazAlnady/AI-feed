-- Fix remaining database functions with proper search paths
CREATE OR REPLACE FUNCTION public.update_post_reach_score()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  target_post_id UUID;
  new_reach_score DECIMAL;
BEGIN
  -- Get the post_id from the trigger
  IF TG_OP = 'DELETE' THEN
    target_post_id := OLD.post_id;
  ELSE
    target_post_id := NEW.post_id;
  END IF;
  
  -- Calculate new reach score
  new_reach_score := calculate_post_reach_score(target_post_id);
  
  -- Update the post's reach score
  UPDATE posts 
  SET reach_score = new_reach_score 
  WHERE id = target_post_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.track_post_view(post_id_param uuid, user_id_param uuid DEFAULT NULL::uuid, ip_address_param inet DEFAULT NULL::inet, user_agent_param text DEFAULT NULL::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  view_exists BOOLEAN := FALSE;
BEGIN
  -- Check if view already exists
  IF user_id_param IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM post_views 
      WHERE post_id = post_id_param AND user_id = user_id_param
    ) INTO view_exists;
  ELSE
    SELECT EXISTS(
      SELECT 1 FROM post_views 
      WHERE post_id = post_id_param AND ip_address = ip_address_param
    ) INTO view_exists;
  END IF;
  
  -- Insert view if it doesn't exist
  IF NOT view_exists THEN
    INSERT INTO post_views (post_id, user_id, ip_address, user_agent)
    VALUES (post_id_param, user_id_param, ip_address_param, user_agent_param);
    
    -- Update view count
    UPDATE posts 
    SET view_count = COALESCE(view_count, 0) + 1
    WHERE id = post_id_param;
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_post_reach_score(post_id_param uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
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
$function$;