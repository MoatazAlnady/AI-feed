-- Create roles table
CREATE TABLE public.roles (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default roles
INSERT INTO public.roles (id, name, description) VALUES
  (1, 'product_admin', 'Superuser with full access'),
  (2, 'content_admin', 'Can approve reports and edit any content'),
  (3, 'moderator', 'Can moderate comments and ban users'),
  (4, 'creator', 'Default role for new sign-ups');

-- Create role_permissions table
CREATE TABLE public.role_permissions (
  role_id INTEGER NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (role_id, permission_key)
);

-- Insert default permissions
INSERT INTO public.role_permissions (role_id, permission_key) VALUES
  -- Product Admin gets all permissions
  (1, 'manage_roles'),
  (1, 'assign_roles'),
  (1, 'approve_reports'),
  (1, 'edit_any_content'),
  (1, 'edit_any_tool'),
  (1, 'ban_user'),
  (1, 'hide_post'),
  (1, 'manage_pricing'),
  (1, 'view_analytics'),
  
  -- Content Admin permissions
  (2, 'approve_reports'),
  (2, 'edit_any_content'),
  (2, 'edit_any_tool'),
  
  -- Moderator permissions
  (3, 'ban_user'),
  (3, 'hide_post'),
  (3, 'approve_reports');

-- Add role_id and is_banned columns to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN role_id INTEGER NOT NULL DEFAULT 4 REFERENCES public.roles(id),
ADD COLUMN is_banned BOOLEAN NOT NULL DEFAULT false;

-- Create reports table for content reporting
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL REFERENCES auth.users(id),
  content_type TEXT NOT NULL, -- 'post', 'comment', 'tool', 'user'
  content_id UUID NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create function to get user permissions
CREATE OR REPLACE FUNCTION public.get_user_permissions(user_id_param UUID)
RETURNS TEXT[] AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create function to check if user has permission
CREATE OR REPLACE FUNCTION public.has_permission(user_id_param UUID, permission_key_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN permission_key_param = ANY(public.get_user_permissions(user_id_param));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Enable RLS on new tables
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- RLS policies for roles table
CREATE POLICY "Anyone can view roles" ON public.roles
FOR SELECT USING (true);

CREATE POLICY "Only product admins can manage roles" ON public.roles
FOR ALL USING (public.has_permission(auth.uid(), 'manage_roles'));

-- RLS policies for role_permissions table
CREATE POLICY "Anyone can view role permissions" ON public.role_permissions
FOR SELECT USING (true);

CREATE POLICY "Only product admins can manage role permissions" ON public.role_permissions
FOR ALL USING (public.has_permission(auth.uid(), 'manage_roles'));

-- RLS policies for reports table
CREATE POLICY "Users can create reports" ON public.reports
FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports" ON public.reports
FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Users with approve_reports permission can view all reports" ON public.reports
FOR SELECT USING (public.has_permission(auth.uid(), 'approve_reports'));

CREATE POLICY "Users with approve_reports permission can update reports" ON public.reports
FOR UPDATE USING (public.has_permission(auth.uid(), 'approve_reports'));

-- Update posts RLS to prevent banned users from posting
DROP POLICY IF EXISTS "Users can create their own posts" ON public.posts;
CREATE POLICY "Non-banned users can create their own posts" ON public.posts
FOR INSERT WITH CHECK (
  auth.uid() = user_id 
  AND NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND is_banned = true
  )
);

-- Add triggers for updated_at
CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();