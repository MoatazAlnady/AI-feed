import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Shield, 
  Crown, 
  UserX, 
  UserCheck, 
  Mail,
  Building,
  Plus,
  Trash2,
  Settings,
  Eye,
  Ban,
  CheckCircle
} from 'lucide-react';

interface User {
  id: string;
  full_name: string;
  email?: string;
  account_type: string;
  verified: boolean;
  created_at: string;
  organization_id?: string;
  profile_photo?: string;
  bio?: string;
  location?: string;
  last_seen?: string;
  status?: string;
}

interface Organization {
  id: string;
  name: string;
  admin_user_id: string;
  max_users: number;
  features_enabled: any;
  created_at: string;
  member_count?: number;
}

const AdvancedUserManagement = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch users with organization data
      const { data: usersData, error: usersError } = await supabase
        .from('user_profiles')
        .select(`
          *,
          organizations(name)
        `)
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;
      setUsers(usersData || []);

      // Fetch organizations with member counts
      const { data: orgsData, error: orgsError } = await supabase
        .from('organizations')
        .select(`
          *,
          organization_members(count)
        `)
        .order('created_at', { ascending: false });

      if (orgsError) throw orgsError;
      setOrganizations(orgsData?.map(org => ({
        ...org,
        member_count: org.organization_members?.length || 0
      })) || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load user data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.account_type === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ account_type: newRole })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(user => 
        user.id === userId ? { ...user, account_type: newRole } : user
      ));

      toast({
        title: "Success",
        description: "User role updated successfully",
      });
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive"
      });
    }
  };

  const handleVerifyUser = async (userId: string, verified: boolean) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ verified })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(user => 
        user.id === userId ? { ...user, verified } : user
      ));

      toast({
        title: "Success",
        description: `User ${verified ? 'verified' : 'unverified'} successfully`,
      });
    } catch (error) {
      console.error('Error updating verification:', error);
      toast({
        title: "Error",
        description: "Failed to update user verification",
        variant: "destructive"
      });
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) {
      toast({
        title: "Warning",
        description: "Please select users first",
        variant: "destructive"
      });
      return;
    }

    try {
      let updateData: any = {};
      
      if (action === 'verify') {
        updateData = { verified: true };
      } else if (action === 'unverify') {
        updateData = { verified: false };
      } else if (action === 'ban') {
        updateData = { status: 'banned' };
      } else if (action === 'activate') {
        updateData = { status: 'active' };
      }

      const { error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .in('id', selectedUsers);

      if (error) throw error;

      await fetchData();
      setSelectedUsers([]);

      toast({
        title: "Success",
        description: `Bulk action completed for ${selectedUsers.length} users`,
      });
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast({
        title: "Error",
        description: "Failed to perform bulk action",
        variant: "destructive"
      });
    }
  };

  const renderUserRow = (user: User) => (
    <tr key={user.id} className="hover:bg-muted/50 transition-colors">
      <td className="px-4 py-3">
        <input
          type="checkbox"
          checked={selectedUsers.includes(user.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedUsers([...selectedUsers, user.id]);
            } else {
              setSelectedUsers(selectedUsers.filter(id => id !== user.id));
            }
          }}
          className="rounded border-border"
        />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.profile_photo} />
            <AvatarFallback>{user.full_name?.[0] || user.email[0]}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium flex items-center gap-2">
              {user.full_name || 'Unnamed User'}
              {user.verified && <CheckCircle className="h-4 w-4 text-blue-500" />}
            </div>
            <div className="text-sm text-muted-foreground">{user.email}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <Select
          value={user.account_type || 'creator'}
          onValueChange={(value) => handleRoleChange(user.id, value)}
        >
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="creator">Creator</SelectItem>
            <SelectItem value="employer">Employer</SelectItem>
            <SelectItem value="staff">Staff</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </td>
      <td className="px-4 py-3">
        <Badge variant={user.status === 'active' ? 'default' : user.status === 'banned' ? 'destructive' : 'secondary'}>
          {user.status || 'active'}
        </Badge>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {new Date(user.created_at).toLocaleDateString()}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleVerifyUser(user.id, !user.verified)}
          >
            {user.verified ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Ban className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Ban User</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to ban this user? They will lose access to the platform.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleRoleChange(user.id, 'banned')}>
                  Ban User
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </td>
    </tr>
  );

  const renderOrganizationCard = (org: Organization) => (
    <Card key={org.id} className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{org.name}</CardTitle>
          <Badge variant="outline">{org.member_count} members</Badge>
        </div>
        <CardDescription>
          Created {new Date(org.created_at).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Max Users:</span>
            <span className="ml-2">{org.max_users}</span>
          </div>
          <div>
            <span className="font-medium">Features:</span>
            <span className="ml-2">
              {Object.keys(org.features_enabled || {}).filter(k => org.features_enabled[k]).length}
            </span>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button size="sm" variant="outline">
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
          <Button size="sm" variant="outline">
            <Settings className="h-4 w-4 mr-1" />
            Manage
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Advanced User Management</h2>
          <p className="text-muted-foreground">Manage users, roles, and organizations</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create User
        </Button>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="organizations" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Organizations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          {/* Filters and Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="creator">Creator</SelectItem>
                    <SelectItem value="employer">Employer</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="banned">Banned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    {selectedUsers.length} users selected
                  </span>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleBulkAction('verify')}>
                      Verify
                    </Button>
                    <Button size="sm" onClick={() => handleBulkAction('unverify')}>
                      Unverify
                    </Button>
                    <Button size="sm" onClick={() => handleBulkAction('activate')}>
                      Activate
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleBulkAction('ban')}>
                      Ban
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Users Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers(filteredUsers.map(u => u.id));
                            } else {
                              setSelectedUsers([]);
                            }
                          }}
                          className="rounded border-border"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Joined</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredUsers.map(renderUserRow)}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="organizations" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {organizations.map(renderOrganizationCard)}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedUserManagement;