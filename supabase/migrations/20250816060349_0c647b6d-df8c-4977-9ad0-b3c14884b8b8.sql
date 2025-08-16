-- Fix database function search paths for security
CREATE OR REPLACE FUNCTION public.update_jobs_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_category_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Check if any tools are assigned to this category
  IF EXISTS (
    SELECT 1 FROM tools WHERE category_id = OLD.id
  ) THEN
    RAISE EXCEPTION 'Cannot delete category: tools are still assigned to it';
  END IF;
  
  RETURN OLD;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_permissions(user_id_param uuid)
RETURNS text[]
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
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

CREATE OR REPLACE FUNCTION public.has_permission(user_id_param uuid, permission_key_param text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN permission_key_param = ANY(public.get_user_permissions(user_id_param));
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_subcategory_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Check if any tools are assigned to this sub-category
  IF EXISTS (
    SELECT 1 FROM tools WHERE OLD.id = ANY(sub_category_ids)
  ) THEN
    RAISE EXCEPTION 'Cannot delete sub-category: tools are still assigned to it';
  END IF;
  
  RETURN OLD;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND account_type = 'admin'
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_user_connections_count(user_id_param uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT COUNT(*)::INTEGER
  FROM public.connections
  WHERE user_1_id = user_id_param OR user_2_id = user_id_param;
$function$;

CREATE OR REPLACE FUNCTION public.are_users_connected(user1_id uuid, user2_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.connections
    WHERE (user_1_id = LEAST(user1_id, user2_id) AND user_2_id = GREATEST(user1_id, user2_id))
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_user_banned_from_feature(user_id_param uuid, feature_param text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
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

CREATE OR REPLACE FUNCTION public.update_user_ban_features(target_user_id uuid, features_to_ban text[], admin_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Check if admin has permission to ban users
  IF NOT public.has_permission(admin_user_id, 'ban_user') THEN
    RAISE EXCEPTION 'Insufficient permissions to ban users';
  END IF;
  
  -- Update the banned features
  UPDATE user_profiles 
  SET banned_features = to_jsonb(features_to_ban)
  WHERE id = target_user_id;
  
  RETURN true;
END;
$function$;

-- Add RLS policies to prevent privilege escalation
CREATE POLICY "Users cannot modify admin fields on their own profile"
ON public.user_profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND (
    -- Prevent users from changing their own account_type or role_id unless they're admin
    (OLD.account_type = NEW.account_type AND OLD.role_id = NEW.role_id) OR
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND account_type = 'admin'
    )
  )
);

-- Add audit logging table for admin actions
CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  action text NOT NULL,
  target_user_id uuid,
  target_table text,
  old_values jsonb,
  new_values jsonb,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view audit logs"
ON public.admin_audit_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND account_type = 'admin'
  )
);

-- Add trigger to log admin actions on user_profiles
CREATE OR REPLACE FUNCTION public.log_admin_user_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Only log if admin is making changes to someone else's profile
  IF auth.uid() != NEW.id AND 
     EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND account_type = 'admin') THEN
    INSERT INTO public.admin_audit_log (
      admin_user_id,
      action,
      target_user_id,
      target_table,
      old_values,
      new_values
    ) VALUES (
      auth.uid(),
      'UPDATE',
      NEW.id,
      'user_profiles',
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE TRIGGER admin_user_changes_audit
  AFTER UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_admin_user_changes();