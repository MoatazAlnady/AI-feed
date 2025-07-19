import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Edit, 
  Trash2, 
  Plus, 
  Users,
  Shield,
  Settings
} from 'lucide-react';
import { 
  Role, 
  Permission, 
  PERMISSIONS, 
  PERMISSION_DESCRIPTIONS,
  hasPermission 
} from '@/utils/permissions';

const RoleManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [userCounts, setUserCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [canManageRoles, setCanManageRoles] = useState(false);

  // Form state
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  useEffect(() => {
    checkPermissions();
    fetchData();
  }, [user]);

  const checkPermissions = async () => {
    if (!user) return;
    
    const canManage = await hasPermission(user.id, PERMISSIONS.MANAGE_ROLES);
    setCanManageRoles(canManage);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select('*')
        .order('id');
      
      if (rolesError) throw rolesError;
      setRoles(rolesData || []);
      
      // Fetch permissions
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('role_permissions')
        .select('*');
      
      if (permissionsError) throw permissionsError;
      setPermissions(permissionsData || []);
      
      // Fetch user counts for each role
      const { data: userCountData, error: userCountError } = await supabase
        .from('user_profiles')
        .select('role_id');
      
      if (userCountError) throw userCountError;
      
      const counts: Record<number, number> = {};
      userCountData?.forEach(profile => {
        counts[profile.role_id] = (counts[profile.role_id] || 0) + 1;
      });
      setUserCounts(counts);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch roles and permissions data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRolePermissions = (roleId: number): string[] => {
    return permissions
      .filter(p => p.role_id === roleId)
      .map(p => p.permission_key);
  };

  const handleCreateRole = () => {
    setEditingRole(null);
    setRoleName('');
    setRoleDescription('');
    setSelectedPermissions([]);
    setShowCreateModal(true);
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDescription(role.description);
    setSelectedPermissions(getRolePermissions(role.id));
    setShowCreateModal(true);
  };

  const handleSaveRole = async () => {
    if (!roleName.trim() || !roleDescription.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      let roleId: number;
      
      if (editingRole) {
        // Update existing role
        const { error: updateError } = await supabase
          .from('roles')
          .update({
            name: roleName,
            description: roleDescription,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingRole.id);
        
        if (updateError) throw updateError;
        roleId = editingRole.id;
      } else {
        // Create new role
        const { data: newRole, error: createError } = await supabase
          .from('roles')
          .insert({
            name: roleName,
            description: roleDescription,
          })
          .select()
          .single();
        
        if (createError) throw createError;
        roleId = newRole.id;
      }

      // Update permissions
      // First, remove existing permissions for this role
      await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', roleId);

      // Then, add the selected permissions
      if (selectedPermissions.length > 0) {
        const permissionInserts = selectedPermissions.map(permission => ({
          role_id: roleId,
          permission_key: permission,
        }));

        const { error: permissionError } = await supabase
          .from('role_permissions')
          .insert(permissionInserts);

        if (permissionError) throw permissionError;
      }

      toast({
        title: "Success",
        description: `Role ${editingRole ? 'updated' : 'created'} successfully.`,
      });

      setShowCreateModal(false);
      fetchData();
    } catch (error) {
      console.error('Error saving role:', error);
      toast({
        title: "Error",
        description: `Failed to ${editingRole ? 'update' : 'create'} role.`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteRole = async (role: Role) => {
    if (role.id <= 4) {
      toast({
        title: "Error",
        description: "Cannot delete system roles.",
        variant: "destructive",
      });
      return;
    }

    if (userCounts[role.id] > 0) {
      toast({
        title: "Error",
        description: "Cannot delete role with assigned users. Please reassign users first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', role.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Role deleted successfully.",
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting role:', error);
      toast({
        title: "Error",
        description: "Failed to delete role.",
        variant: "destructive",
      });
    }
  };

  const handlePermissionChange = (permission: string, checked: boolean) => {
    if (checked) {
      setSelectedPermissions(prev => [...prev, permission]);
    } else {
      setSelectedPermissions(prev => prev.filter(p => p !== permission));
    }
  };

  if (!canManageRoles) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>You don't have permission to manage roles and permissions.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Roles & Permissions</h2>
          <p className="text-muted-foreground">
            Manage user roles and their associated permissions
          </p>
        </div>
        <Button onClick={handleCreateRole}>
          <Plus className="h-4 w-4 mr-2" />
          Create Role
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Role Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => {
                const rolePermissions = getRolePermissions(role.id);
                const userCount = userCounts[role.id] || 0;
                
                return (
                  <TableRow key={role.id}>
                    <TableCell>
                      <div className="font-medium">{role.name}</div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="text-sm text-muted-foreground">
                        {role.description}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {userCount}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {rolePermissions.slice(0, 3).map((permission) => (
                          <Badge key={permission} variant="outline" className="text-xs">
                            {permission.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                        {rolePermissions.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{rolePermissions.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditRole(role)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {role.id > 4 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteRole(role)}
                            disabled={userCount > 0}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Role Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? 'Edit Role' : 'Create New Role'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="role-name">Role Name</Label>
                <Input
                  id="role-name"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="e.g., Content Editor"
                />
              </div>
              <div>
                <Label htmlFor="role-description">Description</Label>
                <Textarea
                  id="role-description"
                  value={roleDescription}
                  onChange={(e) => setRoleDescription(e.target.value)}
                  placeholder="Brief description of the role..."
                  className="min-h-[80px]"
                />
              </div>
            </div>
            
            <div>
              <Label className="text-base font-medium">Permissions</Label>
              <div className="grid grid-cols-2 gap-4 mt-3">
                {Object.entries(PERMISSIONS).map(([key, permission]) => (
                  <div key={permission} className="flex items-start space-x-2">
                    <Checkbox
                      id={permission}
                      checked={selectedPermissions.includes(permission)}
                      onCheckedChange={(checked) => 
                        handlePermissionChange(permission, checked as boolean)
                      }
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label
                        htmlFor={permission}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {PERMISSION_DESCRIPTIONS[permission]}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveRole}>
                {editingRole ? 'Update Role' : 'Create Role'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoleManagement;