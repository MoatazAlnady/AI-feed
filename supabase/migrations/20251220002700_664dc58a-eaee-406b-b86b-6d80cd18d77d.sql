-- Create tool_views table for deduplicating views
CREATE TABLE public.tool_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tool_id UUID NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  device_fingerprint TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint to prevent duplicate views
CREATE UNIQUE INDEX tool_views_unique_user ON public.tool_views (tool_id, user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX tool_views_unique_device ON public.tool_views (tool_id, device_fingerprint) WHERE device_fingerprint IS NOT NULL AND user_id IS NULL;

-- Create index for faster lookups
CREATE INDEX idx_tool_views_tool_id ON public.tool_views(tool_id);

-- Enable RLS
ALTER TABLE public.tool_views ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert views (including anonymous users)
CREATE POLICY "Anyone can insert tool views" 
ON public.tool_views 
FOR INSERT 
WITH CHECK (true);

-- Users can only see their own views
CREATE POLICY "Users can view their own tool views" 
ON public.tool_views 
FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

-- Add visibility and group_ids columns to shared_posts table
ALTER TABLE public.shared_posts 
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public',
ADD COLUMN IF NOT EXISTS group_ids UUID[] DEFAULT '{}';