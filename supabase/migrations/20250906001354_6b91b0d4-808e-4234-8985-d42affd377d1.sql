-- Create storage bucket for tool logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('tool-logos', 'tool-logos', true);

-- Create RLS policies for tool logo storage
CREATE POLICY "Anyone can view tool logos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'tool-logos');

CREATE POLICY "Authenticated users can upload tool logos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'tool-logos' 
  AND auth.uid() IS NOT NULL
  AND (storage.extension(name) = 'jpg' OR storage.extension(name) = 'jpeg' OR storage.extension(name) = 'png' OR storage.extension(name) = 'webp' OR storage.extension(name) = 'gif')
);

CREATE POLICY "Users can update their own uploaded tool logos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'tool-logos' AND auth.uid() = owner);

CREATE POLICY "Users can delete their own uploaded tool logos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'tool-logos' AND auth.uid() = owner);