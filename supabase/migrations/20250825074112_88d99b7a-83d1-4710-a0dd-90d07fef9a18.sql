-- Create a function to sync subcategory colors when category color changes
CREATE OR REPLACE FUNCTION sync_subcategory_colors()
RETURNS TRIGGER AS $$
BEGIN
  -- Update all subcategories' colors to match the new category color
  UPDATE sub_categories 
  SET color = NEW.color 
  WHERE category_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically sync colors when category is updated
DROP TRIGGER IF EXISTS trigger_sync_subcategory_colors ON categories;
CREATE TRIGGER trigger_sync_subcategory_colors
  AFTER UPDATE OF color ON categories
  FOR EACH ROW
  WHEN (OLD.color IS DISTINCT FROM NEW.color)
  EXECUTE FUNCTION sync_subcategory_colors();