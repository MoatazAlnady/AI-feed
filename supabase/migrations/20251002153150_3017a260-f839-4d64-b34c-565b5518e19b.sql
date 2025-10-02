-- Add free_plan column to tools table
ALTER TABLE public.tools
ADD COLUMN free_plan text DEFAULT 'No';

-- Add comment to explain the column
COMMENT ON COLUMN public.tools.free_plan IS 'Whether the tool offers a free plan or free credits (Yes/No)';