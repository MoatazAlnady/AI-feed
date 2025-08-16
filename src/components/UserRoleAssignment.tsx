import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Search, UserCheck, Shield, Ban, Users, Settings } from 'lucide-react';
import { Role, UserWithRole, hasPermission, PERMISSIONS } from '@/utils/permissions';

// Ban feature options
const BAN_FEATURES = {
  posts: 'Creating Posts',
  comments: 'Writing Comments', 
  articles: 'Writing Articles',
  tools: 'Adding Tools',
  groups: 'Using Groups',
} as const;

type BanFeature = keyof typeof BAN_FEATURES;

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
  const [showBanModal, setShowBanModal] = useState(false);
  const [selectedUserForBan, setSelectedUserForBan] = useState<UserWithRole | null>(null);
  const [selectedBanFeatures, setSelectedBanFeatures] = useState<BanFeature[]>([]);

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
      
      // Fetch users with roles and banned features
      const { data: usersData, error: usersError } = await supabase
        .from('user_profiles')
        .select(`
          id,
          full_name,
          role_id,
          is_banned,
          banned_features,
          roles!user_profiles_role_id_fkey(
            id,
            name,
            description
          )
        `)
        .order('full_name');
      
      if (usersError) throw usersError;
      
      const usersWithRoles: UserWithRole[] = usersData?.map(userData => {
        // Handle banned_features which comes as JSONB array
        let bannedFeatures: string[] = [];
        if (userData.banned_features) {
          if (Array.isArray(userData.banned_features)) {
            bannedFeatures = userData.banned_features as string[];
          }
        }
        
        return {
          id: userData.id,
          full_name: userData.full_name,
          role_id: userData.role_id,
          is_banned: userData.is_banned,
          banned_features: bannedFeatures,
          role: userData.roles as Role,
        };
      }) || [];
      
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
    
    if (selectedRole && selectedRole !== "all") {
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

  const handleGranularBan = (userItem: UserWithRole) => {
    setSelectedUserForBan(userItem);
    // Safely cast the banned features to our BanFeature type
    const currentBannedFeatures = (userItem.banned_features || []).filter(
      (feature): feature is BanFeature => Object.keys(BAN_FEATURES).includes(feature)
    );
    setSelectedBanFeatures(currentBannedFeatures);
    setShowBanModal(true);
  };

  const handleSaveBanFeatures = async () => {
    if (!selectedUserForBan || !user) return;

    try {
      const { error } = await supabase.rpc('update_user_ban_features', {
        target_user_id: selectedUserForBan.id,
        features_to_ban: selectedBanFeatures,
        admin_user_id: user.id,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "User ban features updated successfully.",
      });

      setShowBanModal(false);
      setSelectedUserForBan(null);
      setSelectedBanFeatures([]);
      fetchData();
    } catch (error) {
      console.error('Error updating ban features:', error);
      toast({
        title: "Error",
        description: "Failed to update ban features.",
        variant: "destructive",
      });
    }
  };

  const handleBanFeatureChange = (feature: BanFeature, checked: boolean) => {
    if (checked) {
      setSelectedBanFeatures(prev => [...prev, feature]);
    } else {
      setSelectedBanFeatures(prev => prev.filter(f => f !== feature));
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
                  <SelectItem value="all">All roles</SelectItem>
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
                <TableHead>Banned Features</TableHead>
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
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {userItem.banned_features && userItem.banned_features.length > 0 ? (
                        userItem.banned_features.map((feature: string) => (
                          <Badge key={feature} variant="outline" className="text-xs">
                            {BAN_FEATURES[feature as BanFeature] || feature}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">None</span>
                      )}
                    </div>
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
                      <div className="flex gap-2">
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGranularBan(userItem)}
                          disabled={userItem.id === user?.id}
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          Features
                        </Button>
                      </div>
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

      {/* Granular Ban Features Modal */}
      <Dialog open={showBanModal} onOpenChange={setShowBanModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Manage Ban Features for {selectedUserForBan?.full_name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select which features to ban this user from:
            </p>
            
            <div className="space-y-3">
              {Object.entries(BAN_FEATURES).map(([key, label]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={key}
                    checked={selectedBanFeatures.includes(key as BanFeature)}
                    onCheckedChange={(checked) => 
                      handleBanFeatureChange(key as BanFeature, checked as boolean)
                    }
                  />
                  <Label htmlFor={key} className="text-sm">
                    {label}
                  </Label>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowBanModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveBanFeatures}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserRoleAssignment;