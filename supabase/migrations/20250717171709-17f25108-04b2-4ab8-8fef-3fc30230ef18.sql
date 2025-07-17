-- Create shares table for universal content sharing
CREATE TABLE public.shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'article', 'job', 'tool', 'event')),
  content_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Compound unique constraint to prevent duplicate shares
  CONSTRAINT unique_user_content_share UNIQUE (user_id, content_type, content_id)
);

-- Enable Row Level Security
ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for shares
CREATE POLICY "Users can view all shares" 
ON public.shares 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own shares" 
ON public.shares 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shares" 
ON public.shares 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add share_count columns to content tables
ALTER TABLE public.posts ADD COLUMN share_count INTEGER DEFAULT 0;
ALTER TABLE public.articles ADD COLUMN share_count INTEGER DEFAULT 0;
ALTER TABLE public.jobs ADD COLUMN share_count INTEGER DEFAULT 0;
ALTER TABLE public.tools ADD COLUMN share_count INTEGER DEFAULT 0;

-- Create function to update share counts
CREATE OR REPLACE FUNCTION public.update_share_count()
RETURNS TRIGGER AS $$
DECLARE
  target_table TEXT;
  new_count INTEGER;
BEGIN
  -- Determine which table to update based on content_type
  target_table := NEW.content_type || 's';
  
  -- Calculate new share count
  SELECT COUNT(*) INTO new_count
  FROM shares 
  WHERE content_type = NEW.content_type AND content_id = NEW.content_id;
  
  -- Update the share count in the appropriate table
  CASE NEW.content_type
    WHEN 'post' THEN
      UPDATE posts SET share_count = new_count WHERE id = NEW.content_id;
    WHEN 'article' THEN
      UPDATE articles SET share_count = new_count WHERE id = NEW.content_id;
    WHEN 'job' THEN
      UPDATE jobs SET share_count = new_count WHERE id = NEW.content_id;
    WHEN 'tool' THEN
      UPDATE tools SET share_count = new_count WHERE id = NEW.content_id;
  END CASE;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update share counts on delete
CREATE OR REPLACE FUNCTION public.update_share_count_on_delete()
RETURNS TRIGGER AS $$
DECLARE
  target_table TEXT;
  new_count INTEGER;
BEGIN
  -- Determine which table to update based on content_type
  target_table := OLD.content_type || 's';
  
  -- Calculate new share count
  SELECT COUNT(*) INTO new_count
  FROM shares 
  WHERE content_type = OLD.content_type AND content_id = OLD.content_id;
  
  -- Update the share count in the appropriate table
  CASE OLD.content_type
    WHEN 'post' THEN
      UPDATE posts SET share_count = new_count WHERE id = OLD.content_id;
    WHEN 'article' THEN
      UPDATE articles SET share_count = new_count WHERE id = OLD.content_id;
    WHEN 'job' THEN
      UPDATE jobs SET share_count = new_count WHERE id = OLD.content_id;
    WHEN 'tool' THEN
      UPDATE tools SET share_count = new_count WHERE id = OLD.content_id;
  END CASE;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers to automatically update share counts
CREATE TRIGGER update_share_count_on_insert
  AFTER INSERT ON public.shares
  FOR EACH ROW
  EXECUTE FUNCTION public.update_share_count();

CREATE TRIGGER update_share_count_on_delete_trigger
  AFTER DELETE ON public.shares
  FOR EACH ROW
  EXECUTE FUNCTION public.update_share_count_on_delete();

-- Enable realtime for shares table
ALTER TABLE public.shares REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shares;