-- Create junction table for tool-subcategory many-to-many relationship
CREATE TABLE IF NOT EXISTS public.tool_sub_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  sub_category_id UUID NOT NULL REFERENCES sub_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tool_id, sub_category_id)
);

-- Enable RLS
ALTER TABLE public.tool_sub_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view tool sub-categories"
  ON public.tool_sub_categories FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert tool sub-categories"
  ON public.tool_sub_categories FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Tool creators and admins can update tool sub-categories"
  ON public.tool_sub_categories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM tools t WHERE t.id = tool_id AND t.user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND account_type = 'admin'
    )
  );

CREATE POLICY "Tool creators and admins can delete tool sub-categories"
  ON public.tool_sub_categories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM tools t WHERE t.id = tool_id AND t.user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND account_type = 'admin'
    )
  );

-- Migrate data from sub_category_ids array to junction table
INSERT INTO public.tool_sub_categories (tool_id, sub_category_id)
SELECT t.id, unnest(t.sub_category_ids)
FROM tools t
WHERE t.sub_category_ids IS NOT NULL 
  AND array_length(t.sub_category_ids, 1) > 0
ON CONFLICT (tool_id, sub_category_id) DO NOTHING;

-- Migrate data from legacy subcategory text column to junction table
INSERT INTO public.tool_sub_categories (tool_id, sub_category_id)
SELECT t.id, sc.id
FROM tools t
JOIN sub_categories sc ON LOWER(sc.name) = LOWER(t.subcategory)
WHERE t.subcategory IS NOT NULL 
  AND t.subcategory != ''
ON CONFLICT (tool_id, sub_category_id) DO NOTHING;