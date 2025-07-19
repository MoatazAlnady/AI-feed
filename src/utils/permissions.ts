import { supabase } from '@/integrations/supabase/client';

export interface Role {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  role_id: number;
  permission_key: string;
  created_at: string;
}

export interface UserWithRole {
  id: string;
  full_name?: string;
  role_id: number;
  is_banned: boolean;
  banned_features?: string[];
  role?: Role;
  permissions?: string[];
}

// Available permission keys
export const PERMISSIONS = {
  MANAGE_ROLES: 'manage_roles',
  ASSIGN_ROLES: 'assign_roles',
  APPROVE_REPORTS: 'approve_reports',
  EDIT_ANY_CONTENT: 'edit_any_content',
  EDIT_ANY_TOOL: 'edit_any_tool',
  BAN_USER: 'ban_user',
  HIDE_POST: 'hide_post',
  MANAGE_PRICING: 'manage_pricing',
  VIEW_ANALYTICS: 'view_analytics',
} as const;

export const PERMISSION_DESCRIPTIONS = {
  [PERMISSIONS.MANAGE_ROLES]: 'Create, edit, and delete roles and permissions',
  [PERMISSIONS.ASSIGN_ROLES]: 'Assign roles to users',
  [PERMISSIONS.APPROVE_REPORTS]: 'Review and approve content reports',
  [PERMISSIONS.EDIT_ANY_CONTENT]: 'Edit any content regardless of ownership',
  [PERMISSIONS.EDIT_ANY_TOOL]: 'Edit any tool regardless of ownership',
  [PERMISSIONS.BAN_USER]: 'Ban and unban users',
  [PERMISSIONS.HIDE_POST]: 'Hide posts and comments',
  [PERMISSIONS.MANAGE_PRICING]: 'Manage pricing plans and subscriptions',
  [PERMISSIONS.VIEW_ANALYTICS]: 'View platform analytics and metrics',
};

// Role constants
export const ROLES = {
  PRODUCT_ADMIN: 1,
  CONTENT_ADMIN: 2,
  MODERATOR: 3,
  CREATOR: 4,
} as const;

/**
 * Check if a user has a specific permission
 */
export const hasPermission = async (userId: string, permission: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('has_permission', {
      user_id_param: userId,
      permission_key_param: permission
    });
    
    if (error) {
      console.error('Error checking permission:', error);
      return false;
    }
    
    return data || false;
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
};

/**
 * Get all permissions for a user
 */
export const getUserPermissions = async (userId: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase.rpc('get_user_permissions', {
      user_id_param: userId
    });
    
    if (error) {
      console.error('Error getting user permissions:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return [];
  }
};

/**
 * Get user with role information
 */
export const getUserWithRole = async (userId: string): Promise<UserWithRole | null> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select(`
        id,
        full_name,
        role_id,
        is_banned,
        role:roles!user_profiles_role_id_fkey(*)
      `)
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error getting user with role:', error);
      return null;
    }
    
    if (data) {
      const permissions = await getUserPermissions(userId);
      return {
        ...data,
        permissions
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user with role:', error);
    return null;
  }
};

/**
 * Check if current user can perform an action
 */
export const usePermissionCheck = () => {
  const checkPermission = async (permission: string): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    
    return hasPermission(user.id, permission);
  };
  
  return { checkPermission };
};