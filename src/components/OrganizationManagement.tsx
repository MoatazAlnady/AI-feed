import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { 
  Building, 
  Users, 
  Settings, 
  Plus, 
  Trash2, 
  Mail,
  Crown,
  Save,
  UserPlus
} from 'lucide-react';

interface OrganizationFeatures {
  jobs?: boolean;
  talents?: boolean;
  projects?: boolean;
}

interface Organization {
  id: string;
  name: string;
  admin_user_id: string;
  max_users: number;
  features_enabled: OrganizationFeatures;
  created_at: string;
}

interface OrganizationMember {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  user_profiles?: {
    full_name: string;
    profile_photo?: string;
    email?: string;
  };
}

const OrganizationManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  // Form state
  const [orgName, setOrgName] = useState('');
  const [maxUsers, setMaxUsers] = useState(5);
  const [features, setFeatures] = useState<OrganizationFeatures>({
    jobs: true,
    talents: true,
    projects: true
  });

  useEffect(() => {
    if (user) {
      fetchOrganization();
    }
  }, [user]);

  const fetchOrganization = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // First check if user is admin of an organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('admin_user_id', user.id)
        .maybeSingle();

      if (orgError && orgError.code !== 'PGRST116') {
        throw orgError;
      }

      if (orgData) {
        const org: Organization = {
          id: orgData.id,
          name: orgData.name,
          admin_user_id: orgData.admin_user_id,
          max_users: orgData.max_users,
          features_enabled: (orgData.features_enabled as OrganizationFeatures) || { jobs: true, talents: true, projects: true },
          created_at: orgData.created_at
        };
        setOrganization(org);
        setOrgName(org.name);
        setMaxUsers(org.max_users);
        setFeatures(org.features_enabled);
        
        // Fetch members
        const { data: membersData, error: membersError } = await supabase
          .from('organization_members')
          .select(`
            *,
            user_profiles(full_name, profile_photo)
          `)
          .eq('organization_id', orgData.id);

        if (!membersError) {
          setMembers(membersData || []);
        }
      }
    } catch (error) {
      console.error('Error fetching organization:', error);
      toast({
        title: "Error",
        description: "Failed to load organization data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrganization = async () => {
    if (!user || !orgName.trim()) return;
    
    try {
      setSaving(true);
      
      const { data, error } = await supabase
        .from('organizations')
        .insert([{
          name: orgName,
          admin_user_id: user.id,
          max_users: maxUsers,
          features_enabled: JSON.parse(JSON.stringify(features))
        }])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newOrg: Organization = {
          id: data.id,
          name: data.name,
          admin_user_id: data.admin_user_id,
          max_users: data.max_users,
          features_enabled: (data.features_enabled as OrganizationFeatures) || { jobs: true, talents: true, projects: true },
          created_at: data.created_at
        };
        setOrganization(newOrg);
        toast({
          title: "Success",
          description: "Organization created successfully"
        });
      }
    } catch (error) {
      console.error('Error creating organization:', error);
      toast({
        title: "Error",
        description: "Failed to create organization",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateOrganization = async () => {
    if (!organization) return;
    
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('organizations')
        .update({
          name: orgName,
          max_users: maxUsers,
          features_enabled: JSON.parse(JSON.stringify(features))
        })
        .eq('id', organization.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Organization updated successfully"
      });
    } catch (error) {
      console.error('Error updating organization:', error);
      toast({
        title: "Error",
        description: "Failed to update organization",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInviteMember = async () => {
    if (!organization || !inviteEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive"
      });
      return;
    }

    // For now, just show a placeholder message
    toast({
      title: "Invitation Sent",
      description: `Invitation sent to ${inviteEmail} (placeholder - email integration coming soon)`
    });
    setInviteEmail('');
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!organization) return;
    
    try {
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      setMembers(members.filter(m => m.id !== memberId));
      toast({
        title: "Success",
        description: "Member removed successfully"
      });
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: "Error",
        description: "Failed to remove member",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!organization) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Create Your Organization
          </CardTitle>
          <CardDescription>
            Set up your organization to manage team members and access employer features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="orgName">Organization Name</Label>
            <Input
              id="orgName"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Enter organization name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxUsers">Maximum Team Members</Label>
            <Input
              id="maxUsers"
              type="number"
              min={1}
              max={100}
              value={maxUsers}
              onChange={(e) => setMaxUsers(parseInt(e.target.value) || 5)}
            />
          </div>
          <div className="space-y-4">
            <Label>Enabled Features</Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Jobs Management</span>
                <Switch
                  checked={features.jobs}
                  onCheckedChange={(checked) => setFeatures({ ...features, jobs: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Talent Search</span>
                <Switch
                  checked={features.talents}
                  onCheckedChange={(checked) => setFeatures({ ...features, talents: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Projects</span>
                <Switch
                  checked={features.projects}
                  onCheckedChange={(checked) => setFeatures({ ...features, projects: checked })}
                />
              </div>
            </div>
          </div>
          <Button 
            onClick={handleCreateOrganization} 
            disabled={saving || !orgName.trim()}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            {saving ? 'Creating...' : 'Create Organization'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Organization Settings</h2>
          <p className="text-muted-foreground">Manage your organization and team members</p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {members.length} / {organization.max_users} members
        </Badge>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>Update your organization information and settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="editOrgName">Organization Name</Label>
                  <Input
                    id="editOrgName"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editMaxUsers">Maximum Team Members</Label>
                  <Input
                    id="editMaxUsers"
                    type="number"
                    min={1}
                    max={100}
                    value={maxUsers}
                    onChange={(e) => setMaxUsers(parseInt(e.target.value) || 5)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label>Enabled Features</Label>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm font-medium">Jobs Management</span>
                    <Switch
                      checked={features.jobs}
                      onCheckedChange={(checked) => setFeatures({ ...features, jobs: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm font-medium">Talent Search</span>
                    <Switch
                      checked={features.talents}
                      onCheckedChange={(checked) => setFeatures({ ...features, talents: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm font-medium">Projects</span>
                    <Switch
                      checked={features.projects}
                      onCheckedChange={(checked) => setFeatures({ ...features, projects: checked })}
                    />
                  </div>
                </div>
              </div>

              <Button onClick={handleUpdateOrganization} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members">
          <div className="space-y-6">
            {/* Invite Member */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Invite Team Member</CardTitle>
                <CardDescription>Send an invitation to add a new team member</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      type="email"
                      placeholder="Enter email address"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleInviteMember}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Send Invite
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Members List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Team Members</CardTitle>
                <CardDescription>{members.length} members in your organization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Admin (current user) */}
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-primary/5">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          <Crown className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          You (Admin)
                          <Badge variant="secondary" className="text-xs">Owner</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">Organization Administrator</div>
                      </div>
                    </div>
                  </div>

                  {/* Other members */}
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={member.user_profiles?.profile_photo} />
                          <AvatarFallback>
                            {member.user_profiles?.full_name?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {member.user_profiles?.full_name || 'Unknown User'}
                          </div>
                          <div className="text-sm text-muted-foreground capitalize">
                            {member.role}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}

                  {members.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No team members yet</p>
                      <p className="text-sm">Invite team members using the form above</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrganizationManagement;
