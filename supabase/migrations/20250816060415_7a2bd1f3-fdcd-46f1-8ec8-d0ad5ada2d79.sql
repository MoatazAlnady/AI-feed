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

-- Add RLS policies to prevent privilege escalation
DROP POLICY IF EXISTS "Users cannot modify admin fields on their own profile" ON public.user_profiles;

CREATE POLICY "Users cannot modify admin fields on their own profile"
ON public.user_profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND (
    -- Prevent users from changing their own account_type or role_id unless they're admin
    (OLD.account_type = NEW.account_type AND OLD.role_id = NEW.role_id) OR
    public.is_admin()
  )
);

-- Add audit logging table for admin actions
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
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

DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.admin_audit_log;

CREATE POLICY "Only admins can view audit logs"
ON public.admin_audit_log
FOR SELECT
USING (public.is_admin());

-- Add trigger to log admin actions on user_profiles
CREATE OR REPLACE FUNCTION public.log_admin_user_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Only log if admin is making changes to someone else's profile
  IF auth.uid() != NEW.id AND public.is_admin() THEN
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

DROP TRIGGER IF EXISTS admin_user_changes_audit ON public.user_profiles;

CREATE TRIGGER admin_user_changes_audit
  AFTER UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_admin_user_changes();