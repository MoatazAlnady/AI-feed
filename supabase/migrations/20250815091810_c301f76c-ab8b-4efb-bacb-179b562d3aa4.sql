-- Drop the foreign key constraint that's causing issues
ALTER TABLE tools DROP CONSTRAINT IF EXISTS tools_category_id_fkey;

-- The category_id should just be a UUID reference without strict foreign key constraint
-- since we're allowing tools to exist even if categories change