import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Search, UserCheck, Shield, Ban, Users } from 'lucide-react';
import { Role, UserWithRole, hasPermission, PERMISSIONS } from '@/utils/permissions';

const UserRoleAssignment: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithRole[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [canAssignRoles, setCanAssignRoles] = useState(false);
  const [canBanUsers, setCanBanUsers] = useState(false);

  useEffect(() => {
    checkPermissions();
    fetchData();
  }, [user]);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, selectedRole]);

  const checkPermissions = async () => {
    if (!user) return;
    
    const [canAssign, canBan] = await Promise.all([
      hasPermission(user.id, PERMISSIONS.ASSIGN_ROLES),
      hasPermission(user.id, PERMISSIONS.BAN_USER),
    ]);
    
    setCanAssignRoles(canAssign);
    setCanBanUsers(canBan);
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
      
      // Fetch users with roles
      const { data: usersData, error: usersError } = await supabase
        .from('user_profiles')
        .select(`
          id,
          full_name,
          role_id,
          is_banned,
          roles!user_profiles_role_id_fkey(
            id,
            name,
            description
          )
        `)
        .order('full_name');
      
      if (usersError) throw usersError;
      
      const usersWithRoles: UserWithRole[] = usersData?.map(userData => ({
        id: userData.id,
        full_name: userData.full_name,
        role_id: userData.role_id,
        is_banned: userData.is_banned,
        role: userData.roles as Role,
      })) || [];
      
      setUsers(usersWithRoles);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users and roles data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;
    
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedRole) {
      const roleId = parseInt(selectedRole);
      filtered = filtered.filter(user => user.role_id === roleId);
    }
    
    setFilteredUsers(filtered);
  };

  const handleRoleChange = async (userId: string, newRoleId: number) => {
    if (!canAssignRoles) {
      toast({
        title: "Error",
        description: "You don't have permission to assign roles.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ role_id: newRoleId })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User role updated successfully.",
      });

      fetchData();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role.",
        variant: "destructive",
      });
    }
  };

  const handleBanToggle = async (userId: string, currentBanStatus: boolean) => {
    if (!canBanUsers) {
      toast({
        title: "Error",
        description: "You don't have permission to ban users.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_banned: !currentBanStatus })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `User ${!currentBanStatus ? 'banned' : 'unbanned'} successfully.`,
      });

      fetchData();
    } catch (error) {
      console.error('Error updating user ban status:', error);
      toast({
        title: "Error",
        description: "Failed to update user ban status.",
        variant: "destructive",
      });
    }
  };

  if (!canAssignRoles && !canBanUsers) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>You don't have permission to manage user roles or ban users.</p>
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
      <div>
        <h2 className="text-2xl font-bold">User Role Assignment</h2>
        <p className="text-muted-foreground">
          Assign roles to users and manage user permissions
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="search">Search Users</Label>
              <Input
                id="search"
                placeholder="Search by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="role-filter">Filter by Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All roles</SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Users ({filteredUsers.length})
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Current Role</TableHead>
                <TableHead>Status</TableHead>
                {canAssignRoles && <TableHead>Assign Role</TableHead>}
                {canBanUsers && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((userItem) => (
                <TableRow key={userItem.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {userItem.full_name || 'Unnamed User'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {userItem.id}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {userItem.role?.name}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={userItem.is_banned ? "destructive" : "default"}
                    >
                      {userItem.is_banned ? "Banned" : "Active"}
                    </Badge>
                  </TableCell>
                  {canAssignRoles && (
                    <TableCell>
                      <Select
                        value={userItem.role_id.toString()}
                        onValueChange={(value) => 
                          handleRoleChange(userItem.id, parseInt(value))
                        }
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.id.toString()}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  )}
                  {canBanUsers && (
                    <TableCell>
                      <Button
                        variant={userItem.is_banned ? "default" : "destructive"}
                        size="sm"
                        onClick={() => handleBanToggle(userItem.id, userItem.is_banned)}
                        disabled={userItem.id === user?.id} // Can't ban yourself
                      >
                        {userItem.is_banned ? (
                          <>
                            <UserCheck className="h-4 w-4 mr-1" />
                            Unban
                          </>
                        ) : (
                          <>
                            <Ban className="h-4 w-4 mr-1" />
                            Ban
                          </>
                        )}
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No users found matching your search criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserRoleAssignment;