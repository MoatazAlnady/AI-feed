-- Add view tracking for posts
CREATE TABLE post_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL,
  user_id UUID,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_post_views_post_id ON post_views(post_id);
CREATE INDEX idx_post_views_user_id ON post_views(user_id);
CREATE INDEX idx_post_views_created_at ON post_views(created_at);

-- Add unique constraint to prevent duplicate views from same user/IP
CREATE UNIQUE INDEX idx_post_views_unique_user ON post_views(post_id, user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX idx_post_views_unique_ip ON post_views(post_id, ip_address) WHERE user_id IS NULL;

-- Add reach score column to posts
ALTER TABLE posts ADD COLUMN reach_score DECIMAL DEFAULT 0;
ALTER TABLE posts ADD COLUMN view_count INTEGER DEFAULT 0;

-- Enable RLS
ALTER TABLE post_views ENABLE ROW LEVEL SECURITY;

-- Create policies for post_views
CREATE POLICY "Users can create views" 
ON post_views 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view their own views" 
ON post_views 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Post authors can view their post views" 
ON post_views 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM posts 
    WHERE posts.id = post_views.post_id 
    AND posts.user_id = auth.uid()
  )
);

-- Function to calculate reach score based on reactions
CREATE OR REPLACE FUNCTION calculate_post_reach_score(post_id_param UUID)
RETURNS DECIMAL
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  base_score DECIMAL := 1.0;
  reaction_multiplier DECIMAL := 0.0;
  total_reactions INTEGER := 0;
  unlike_count INTEGER := 0;
BEGIN
  -- Count total reactions
  SELECT COUNT(*) INTO total_reactions
  FROM post_reactions 
  WHERE post_id = post_id_param;
  
  -- Count unlike reactions (these reduce reach)
  SELECT COUNT(*) INTO unlike_count
  FROM post_reactions 
  WHERE post_id = post_id_param AND reaction_type = 'unlike';
  
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
  
  -- Calculate final reach score
  -- Base score + reaction multiplier, but heavily penalize if more than 20% are unlikes
  IF total_reactions > 0 AND (unlike_count::DECIMAL / total_reactions::DECIMAL) > 0.2 THEN
    base_score := base_score * 0.3; -- Reduce reach by 70% for heavily disliked posts
  END IF;
  
  RETURN GREATEST(0.1, base_score + reaction_multiplier);
END;
$$;

-- Trigger to update reach score when reactions change
CREATE OR REPLACE FUNCTION update_post_reach_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Create triggers
CREATE TRIGGER update_reach_on_reaction_change
AFTER INSERT OR UPDATE OR DELETE ON post_reactions
FOR EACH ROW
EXECUTE FUNCTION update_post_reach_score();

-- Function to track post views
CREATE OR REPLACE FUNCTION track_post_view(
  post_id_param UUID,
  user_id_param UUID DEFAULT NULL,
  ip_address_param INET DEFAULT NULL,
  user_agent_param TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;