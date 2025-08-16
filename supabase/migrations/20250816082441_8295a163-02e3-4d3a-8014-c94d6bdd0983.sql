-- Fix storage bucket and RLS policies for profile photos
-- Create user-uploads bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-uploads', 'user-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for user uploads storage
CREATE POLICY "Users can upload their own files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'user-uploads' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view all uploaded files" ON storage.objects  
FOR SELECT USING (bucket_id = 'user-uploads');

CREATE POLICY "Users can update their own files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'user-uploads' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'user-uploads' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Fix user_profiles RLS policies to allow upserts
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert/upsert own profile" ON user_profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- Add a policy specifically for upserts
CREATE POLICY "Users can upsert own profile" ON user_profiles
FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Ensure proper sharing functionality - add share tracking
CREATE OR REPLACE FUNCTION handle_content_share()
RETURNS TRIGGER AS $$
BEGIN
  -- Update share count in the content table based on content_type
  IF NEW.content_type = 'post' THEN
    UPDATE posts 
    SET share_count = COALESCE(share_count, 0) + 1
    WHERE id = NEW.content_id;
  ELSIF NEW.content_type = 'tool' THEN
    UPDATE tools 
    SET share_count = COALESCE(share_count, 0) + 1
    WHERE id = NEW.content_id;
  ELSIF NEW.content_type = 'job' THEN
    UPDATE jobs 
    SET share_count = COALESCE(share_count, 0) + 1
    WHERE id = NEW.content_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Create trigger for share counting
DROP TRIGGER IF EXISTS update_share_count ON shares;
CREATE TRIGGER update_share_count
  AFTER INSERT ON shares
  FOR EACH ROW
  EXECUTE FUNCTION handle_content_share();

-- Function to sync user profile stats
CREATE OR REPLACE FUNCTION sync_user_profile_stats(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_profiles 
  SET 
    tools_submitted = (SELECT COUNT(*) FROM tools WHERE user_id = user_uuid AND status = 'published'),
    articles_written = (SELECT COUNT(*) FROM articles WHERE user_id = user_uuid AND status = 'published')
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Trigger to auto-update stats when tools are created/updated
CREATE OR REPLACE FUNCTION update_user_stats_on_tool_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM sync_user_profile_stats(NEW.user_id);
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM sync_user_profile_stats(NEW.user_id);
    IF OLD.user_id != NEW.user_id THEN
      PERFORM sync_user_profile_stats(OLD.user_id);
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM sync_user_profile_stats(OLD.user_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Create triggers for tools stats
DROP TRIGGER IF EXISTS sync_tools_stats ON tools;
CREATE TRIGGER sync_tools_stats
  AFTER INSERT OR UPDATE OR DELETE ON tools
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats_on_tool_change();

-- Trigger to auto-update stats when articles are created/updated  
CREATE OR REPLACE FUNCTION update_user_stats_on_article_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM sync_user_profile_stats(NEW.user_id);
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM sync_user_profile_stats(NEW.user_id);
    IF OLD.user_id != NEW.user_id THEN
      PERFORM sync_user_profile_stats(OLD.user_id);
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM sync_user_profile_stats(OLD.user_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Create triggers for articles stats
DROP TRIGGER IF EXISTS sync_articles_stats ON articles;
CREATE TRIGGER sync_articles_stats
  AFTER INSERT OR UPDATE OR DELETE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats_on_article_change();