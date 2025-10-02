-- Drop and recreate get_public_profiles_by_ids with handle field
DROP FUNCTION IF EXISTS public.get_public_profiles_by_ids(uuid[]);

CREATE OR REPLACE FUNCTION public.get_public_profiles_by_ids(ids uuid[])
 RETURNS TABLE(id uuid, handle text, full_name text, profile_photo text, job_title text, verified boolean, ai_nexus_top_voice boolean, interests text[])
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    id,
    handle,
    full_name,
    profile_photo,
    job_title,
    verified,
    ai_nexus_top_voice,
    interests
  FROM public.user_profiles
  WHERE id = ANY(ids);
$function$;