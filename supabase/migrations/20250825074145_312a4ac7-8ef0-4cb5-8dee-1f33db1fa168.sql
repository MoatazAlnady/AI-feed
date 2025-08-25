-- Fix security issue: Set search_path for the sync function
CREATE OR REPLACE FUNCTION sync_subcategory_colors()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update all subcategories' colors to match the new category color
  UPDATE sub_categories 
  SET color = NEW.color 
  WHERE category_id = NEW.id;
  
  RETURN NEW;
END;
$$;