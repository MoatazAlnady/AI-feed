-- Create article_reviews table
CREATE TABLE public.article_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  pros TEXT[],
  cons TEXT[],
  likes INTEGER DEFAULT 0,
  dislikes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'approved',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(article_id, user_id)
);

-- Enable RLS
ALTER TABLE public.article_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view approved article reviews" 
  ON public.article_reviews FOR SELECT 
  USING (status = 'approved');

CREATE POLICY "Users can create article reviews" 
  ON public.article_reviews FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own article reviews" 
  ON public.article_reviews FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own article reviews" 
  ON public.article_reviews FOR DELETE 
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_article_reviews_article ON public.article_reviews(article_id);
CREATE INDEX idx_article_reviews_user ON public.article_reviews(user_id);
CREATE INDEX idx_article_reviews_status ON public.article_reviews(status);

-- Trigger for updated_at
CREATE TRIGGER update_article_reviews_updated_at
  BEFORE UPDATE ON public.article_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();