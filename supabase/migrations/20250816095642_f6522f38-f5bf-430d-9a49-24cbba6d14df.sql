-- Create reviews table for tools
CREATE TABLE IF NOT EXISTS public.tool_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tool_id UUID NOT NULL,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tool_id, user_id)
);

-- Enable RLS
ALTER TABLE public.tool_reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for tool reviews
CREATE POLICY "Users can view all tool reviews" 
ON public.tool_reviews 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create reviews" 
ON public.tool_reviews 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" 
ON public.tool_reviews 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" 
ON public.tool_reviews 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_tool_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_tool_reviews_updated_at
BEFORE UPDATE ON public.tool_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_tool_reviews_updated_at();

-- Add rating columns to tools table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tools' AND column_name = 'average_rating') THEN
        ALTER TABLE public.tools ADD COLUMN average_rating DECIMAL(2,1) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tools' AND column_name = 'review_count') THEN
        ALTER TABLE public.tools ADD COLUMN review_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Create function to update tool ratings
CREATE OR REPLACE FUNCTION public.update_tool_rating(tool_id_param UUID)
RETURNS VOID AS $$
DECLARE
    avg_rating DECIMAL(2,1);
    total_reviews INTEGER;
BEGIN
    SELECT 
        ROUND(AVG(rating)::DECIMAL, 1),
        COUNT(*)
    INTO avg_rating, total_reviews
    FROM public.tool_reviews 
    WHERE tool_id = tool_id_param;
    
    UPDATE public.tools 
    SET 
        average_rating = COALESCE(avg_rating, 0),
        review_count = total_reviews
    WHERE id = tool_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update tool ratings when reviews change
CREATE OR REPLACE FUNCTION public.trigger_update_tool_rating()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM public.update_tool_rating(OLD.tool_id);
        RETURN OLD;
    ELSE
        PERFORM public.update_tool_rating(NEW.tool_id);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS tool_review_rating_update ON public.tool_reviews;
CREATE TRIGGER tool_review_rating_update
    AFTER INSERT OR UPDATE OR DELETE ON public.tool_reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_update_tool_rating();