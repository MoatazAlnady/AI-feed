import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Settings, Users, Shield, Bell, Trash2, UserPlus, Crown, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

interface GroupSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  onGroupUpdated?: () => void;
}

interface GroupMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  user_profiles?: {
    full_name: string;
    profile_photo: string;
  };
}

interface GroupData {
  id: string;
  name: string;
  description: string;
  category: string;
  is_private: boolean;
  cover_image: string;
  auto_approve_members: boolean;
  auto_approve_posts: boolean;
}

const GroupSettings: React.FC<GroupSettingsProps> = ({
  isOpen,
  onClose,
  groupId,
  onGroupUpdated
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [group, setGroup] = useState<GroupData | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    is_private: false,
    auto_approve_members: true,
    auto_approve_posts: true
  });

  useEffect(() => {
    if (isOpen && groupId) {
      fetchGroup();
      fetchMembers();
    }
  }, [isOpen, groupId]);

  const fetchGroup = async () => {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (error) {
      console.error('Error fetching group:', error);
      return;
    }

    setGroup(data);
    setFormData({
      name: data.name || '',
      description: data.description || '',
      category: data.category || '',
      is_private: data.is_private || false,
      auto_approve_members: data.auto_approve_members ?? true,
      auto_approve_posts: data.auto_approve_posts ?? true
    });
  };

  const fetchMembers = async () => {
    const { data, error } = await supabase
      .from('group_members')
      .select(`
        *,
        user_profiles(full_name, profile_photo)
      `)
      .eq('group_id', groupId)
      .order('joined_at', { ascending: true });

    if (error) {
      console.error('Error fetching members:', error);
      return;
    }

    setMembers(data || []);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('groups')
        .update({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          is_private: formData.is_private,
          auto_approve_members: formData.auto_approve_members,
          auto_approve_posts: formData.auto_approve_posts
        })
        .eq('id', groupId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Group settings updated'
      });

      onGroupUpdated?.();
    } catch (error) {
      console.error('Error updating group:', error);
      toast({
        title: 'Error',
        description: 'Failed to update group settings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const promoteToAdmin = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('group_members')
        .update({ role: 'admin' })
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Member promoted to admin'
      });

      fetchMembers();
    } catch (error) {
      console.error('Error promoting member:', error);
      toast({
        title: 'Error',
        description: 'Failed to promote member',
        variant: 'destructive'
      });
    }
  };

  const demoteFromAdmin = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('group_members')
        .update({ role: 'member' })
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Admin demoted to member'
      });

      fetchMembers();
    } catch (error) {
      console.error('Error demoting admin:', error);
      toast({
        title: 'Error',
        description: 'Failed to demote admin',
        variant: 'destructive'
      });
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Member removed from group'
      });

      fetchMembers();
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove member',
        variant: 'destructive'
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Group Settings
          </DialogTitle>
          <DialogDescription>
            Manage your group settings and members
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">
              <Settings className="h-4 w-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="members">
              <Users className="h-4 w-4 mr-2" />
              Members
            </TabsTrigger>
            <TabsTrigger value="privacy">
              <Shield className="h-4 w-4 mr-2" />
              Privacy
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Group Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              />
            </div>

            <Button onClick={handleSave} disabled={loading} className="w-full">
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </TabsContent>

          <TabsContent value="members" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Group Members ({members.length})</CardTitle>
                <CardDescription>Manage group members and their roles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.user_profiles?.profile_photo} />
                        <AvatarFallback>
                          {member.user_profiles?.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.user_profiles?.full_name || 'Unknown'}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant={member.role === 'owner' ? 'default' : member.role === 'admin' ? 'secondary' : 'outline'}>
                            {member.role === 'owner' && <Crown className="h-3 w-3 mr-1" />}
                            {member.role}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    {member.role !== 'owner' && member.user_id !== user?.id && (
                      <div className="flex items-center gap-2">
                        {member.role === 'member' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => promoteToAdmin(member.id)}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Make Admin
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => demoteFromAdmin(member.id)}
                          >
                            Demote
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeMember(member.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-4 mt-4">
            <Card>
              <CardContent className="space-y-6 pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Private Group</Label>
                    <p className="text-sm text-muted-foreground">
                      Only members can see group content
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_private}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_private: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-approve Members</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically approve join requests
                    </p>
                  </div>
                  <Switch
                    checked={formData.auto_approve_members}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, auto_approve_members: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-approve Posts</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically approve member posts
                    </p>
                  </div>
                  <Switch
                    checked={formData.auto_approve_posts}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, auto_approve_posts: checked }))}
                  />
                </div>

                <Button onClick={handleSave} disabled={loading} className="w-full">
                  {loading ? 'Saving...' : 'Save Privacy Settings'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default GroupSettings;
