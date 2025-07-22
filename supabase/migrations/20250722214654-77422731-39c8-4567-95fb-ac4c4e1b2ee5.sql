-- Add color column to categories table if it doesn't exist
ALTER TABLE categories ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3b82f6';