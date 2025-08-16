-- Add handle column to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS handle text UNIQUE,
ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'public';

-- Create index for handle lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_handle ON public.user_profiles(handle);

-- Function to generate unique handle from name or email
CREATE OR REPLACE FUNCTION public.generate_unique_handle(base_name text, user_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  clean_base text;
  candidate_handle text;
  counter integer := 0;
BEGIN
  -- Clean and slugify the base name
  clean_base := lower(trim(regexp_replace(
    regexp_replace(base_name, '[^a-zA-Z0-9\s-]', '', 'g'),
    '\s+', '-', 'g'
  )));
  
  -- Ensure it's not empty and has reasonable length
  IF clean_base = '' OR length(clean_base) < 2 THEN
    clean_base := 'user';
  END IF;
  
  -- Limit length to 30 characters
  clean_base := left(clean_base, 30);
  
  candidate_handle := clean_base;
  
  -- Check for uniqueness and increment if needed
  WHILE EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE handle = candidate_handle AND id != user_id
  ) LOOP
    counter := counter + 1;
    candidate_handle := clean_base || '-' || counter;
  END LOOP;
  
  RETURN candidate_handle;
END;
$$;

-- Function to backfill handles for existing users
CREATE OR REPLACE FUNCTION public.backfill_user_handles()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  user_record record;
  new_handle text;
  base_name text;
BEGIN
  FOR user_record IN 
    SELECT id, full_name, 
           COALESCE(full_name, split_part((SELECT email FROM auth.users WHERE id = user_profiles.id), '@', 1)) as display_name
    FROM public.user_profiles 
    WHERE handle IS NULL
  LOOP
    -- Use full_name if available, otherwise email prefix
    base_name := COALESCE(user_record.display_name, 'user');
    
    -- Generate unique handle
    new_handle := public.generate_unique_handle(base_name, user_record.id);
    
    -- Update the user's handle
    UPDATE public.user_profiles 
    SET handle = new_handle 
    WHERE id = user_record.id;
  END LOOP;
END;
$$;

-- Backfill handles for existing users
SELECT public.backfill_user_handles();

-- Function to get profile by handle or ID
CREATE OR REPLACE FUNCTION public.get_profile_by_handle_or_id(identifier text)
RETURNS TABLE(
  id uuid,
  handle text,
  full_name text,
  job_title text,
  company text,
  bio text,
  location text,
  profile_photo text,
  cover_photo text,
  verified boolean,
  ai_nexus_top_voice boolean,
  visibility text,
  total_engagement integer,
  total_reach integer,
  tools_submitted integer,
  articles_written integer,
  website text,
  github text,
  linkedin text,
  twitter text,
  interests text[],
  contact_visible boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- First try to find by handle
  RETURN QUERY
  SELECT 
    up.id, up.handle, up.full_name, up.job_title, up.company, up.bio, up.location,
    up.profile_photo, up.cover_photo, up.verified, up.ai_nexus_top_voice, up.visibility,
    up.total_engagement, up.total_reach, up.tools_submitted, up.articles_written,
    CASE WHEN up.contact_visible THEN up.website ELSE NULL END,
    CASE WHEN up.contact_visible THEN up.github ELSE NULL END,
    CASE WHEN up.contact_visible THEN up.linkedin ELSE NULL END,
    CASE WHEN up.contact_visible THEN up.twitter ELSE NULL END,
    up.interests, up.contact_visible
  FROM public.user_profiles up
  WHERE up.handle = identifier
  LIMIT 1;
  
  -- If not found by handle and identifier looks like UUID, try by ID
  IF NOT FOUND AND identifier ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN QUERY
    SELECT 
      up.id, up.handle, up.full_name, up.job_title, up.company, up.bio, up.location,
      up.profile_photo, up.cover_photo, up.verified, up.ai_nexus_top_voice, up.visibility,
      up.total_engagement, up.total_reach, up.tools_submitted, up.articles_written,
      CASE WHEN up.contact_visible THEN up.website ELSE NULL END,
      CASE WHEN up.contact_visible THEN up.github ELSE NULL END,
      CASE WHEN up.contact_visible THEN up.linkedin ELSE NULL END,
      CASE WHEN up.contact_visible THEN up.twitter ELSE NULL END,
      up.interests, up.contact_visible
    FROM public.user_profiles up
    WHERE up.id = identifier::uuid
    LIMIT 1;
  END IF;
END;
$$;

-- Update RLS policies for public profile access
DROP POLICY IF EXISTS "Public can view user profiles" ON public.user_profiles;

CREATE POLICY "Public can view public profiles" ON public.user_profiles
FOR SELECT
USING (
  visibility = 'public' OR 
  auth.uid() = id OR
  -- Connected users can see each other's profiles
  EXISTS (
    SELECT 1 FROM public.connections 
    WHERE (user_1_id = auth.uid() AND user_2_id = id) 
       OR (user_2_id = auth.uid() AND user_1_id = id)
  )
);

-- Trigger to auto-generate handle on user creation
CREATE OR REPLACE FUNCTION public.auto_generate_handle()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.handle IS NULL THEN
    NEW.handle := public.generate_unique_handle(
      COALESCE(NEW.full_name, 'user'), 
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_generate_handle_trigger
  BEFORE INSERT OR UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_handle();