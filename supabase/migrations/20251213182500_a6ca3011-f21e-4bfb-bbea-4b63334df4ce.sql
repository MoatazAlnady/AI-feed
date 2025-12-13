-- Fix functions missing search_path for security

-- 1. check_category_deletion
CREATE OR REPLACE FUNCTION public.check_category_deletion()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  IF EXISTS (
    SELECT 1 FROM tools WHERE category_id = OLD.id
  ) THEN
    RAISE EXCEPTION 'Cannot delete category: tools are still assigned to it';
  END IF;
  
  RETURN OLD;
END;
$function$;

-- 2. check_subcategory_deletion
CREATE OR REPLACE FUNCTION public.check_subcategory_deletion()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  IF EXISTS (
    SELECT 1 FROM tools WHERE OLD.id = ANY(sub_category_ids)
  ) THEN
    RAISE EXCEPTION 'Cannot delete sub-category: tools are still assigned to it';
  END IF;
  
  RETURN OLD;
END;
$function$;

-- 3. get_user_permissions
CREATE OR REPLACE FUNCTION public.get_user_permissions(user_id_param uuid)
 RETURNS text[]
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  permissions TEXT[];
BEGIN
  SELECT ARRAY_AGG(rp.permission_key)
  INTO permissions
  FROM user_profiles up
  JOIN role_permissions rp ON up.role_id = rp.role_id
  WHERE up.id = user_id_param;
  
  RETURN COALESCE(permissions, ARRAY[]::TEXT[]);
END;
$function$;

-- 4. has_permission
CREATE OR REPLACE FUNCTION public.has_permission(user_id_param uuid, permission_key_param text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  RETURN permission_key_param = ANY(public.get_user_permissions(user_id_param));
END;
$function$;

-- 5. is_user_banned_from_feature
CREATE OR REPLACE FUNCTION public.is_user_banned_from_feature(user_id_param uuid, feature_param text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  user_banned BOOLEAN := false;
  feature_banned BOOLEAN := false;
BEGIN
  SELECT is_banned, banned_features ? feature_param
  INTO user_banned, feature_banned
  FROM user_profiles
  WHERE id = user_id_param;
  
  RETURN COALESCE(user_banned, false) OR COALESCE(feature_banned, false);
END;
$function$;

-- 6. update_user_ban_features
CREATE OR REPLACE FUNCTION public.update_user_ban_features(target_user_id uuid, features_to_ban text[], admin_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  IF NOT public.has_permission(admin_user_id, 'ban_user') THEN
    RAISE EXCEPTION 'Insufficient permissions to ban users';
  END IF;
  
  UPDATE user_profiles 
  SET banned_features = to_jsonb(features_to_ban)
  WHERE id = target_user_id;
  
  RETURN true;
END;
$function$;

-- 7. notify_connection_request
CREATE OR REPLACE FUNCTION public.notify_connection_request()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  RAISE NOTICE 'Connection request created: % -> %', NEW.requester_id, NEW.recipient_id;
  RETURN NEW;
END;
$function$;

-- 8. update_tool_reviews_updated_at
CREATE OR REPLACE FUNCTION public.update_tool_reviews_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- 9. update_tool_rating
CREATE OR REPLACE FUNCTION public.update_tool_rating(tool_id_param uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
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
$function$;

-- 10. trigger_update_tool_rating
CREATE OR REPLACE FUNCTION public.trigger_update_tool_rating()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM public.update_tool_rating(OLD.tool_id);
        RETURN OLD;
    ELSE
        PERFORM public.update_tool_rating(NEW.tool_id);
        RETURN NEW;
    END IF;
END;
$function$;

-- 11. generate_unique_handle
CREATE OR REPLACE FUNCTION public.generate_unique_handle(base_name text, user_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
DECLARE
  clean_base text;
  candidate_handle text;
  counter integer := 0;
BEGIN
  clean_base := lower(trim(regexp_replace(
    regexp_replace(base_name, '[^a-zA-Z0-9\s-]', '', 'g'),
    '\s+', '-', 'g'
  )));
  
  IF clean_base = '' OR length(clean_base) < 2 THEN
    clean_base := 'user';
  END IF;
  
  clean_base := left(clean_base, 30);
  
  candidate_handle := clean_base;
  
  WHILE EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE handle = candidate_handle AND id != user_id
  ) LOOP
    counter := counter + 1;
    candidate_handle := clean_base || '-' || counter;
  END LOOP;
  
  RETURN candidate_handle;
END;
$function$;

-- 12. backfill_user_handles
CREATE OR REPLACE FUNCTION public.backfill_user_handles()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
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
    base_name := COALESCE(user_record.display_name, 'user');
    new_handle := public.generate_unique_handle(base_name, user_record.id);
    
    UPDATE public.user_profiles 
    SET handle = new_handle 
    WHERE id = user_record.id;
  END LOOP;
END;
$function$;

-- 13. auto_generate_handle
CREATE OR REPLACE FUNCTION public.auto_generate_handle()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  IF NEW.handle IS NULL THEN
    NEW.handle := public.generate_unique_handle(
      COALESCE(NEW.full_name, 'user'), 
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- 14. create_mention_notification
CREATE OR REPLACE FUNCTION public.create_mention_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, action_url, metadata)
  VALUES (
    NEW.mentioned_user_id,
    'mention',
    'You were mentioned',
    'Someone mentioned you in a ' || NEW.content_type,
    '/notifications',
    jsonb_build_object('content_type', NEW.content_type, 'content_id', NEW.content_id, 'mentioner_id', NEW.mentioner_user_id)
  );
  
  RETURN NEW;
END;
$function$;

-- 15. user_profile_exists
CREATE OR REPLACE FUNCTION public.user_profile_exists(user_id_param uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = user_id_param
  );
END;
$function$;