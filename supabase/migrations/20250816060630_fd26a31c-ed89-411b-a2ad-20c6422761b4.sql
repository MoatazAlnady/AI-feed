-- Fix all remaining database functions with proper search paths
CREATE OR REPLACE FUNCTION public.update_articles_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_tools_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_tool_edit_requests_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_share_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.update_share_count_on_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
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
$function$;