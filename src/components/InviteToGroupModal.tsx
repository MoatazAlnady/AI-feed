import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, UserPlus, Check, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

interface InviteToGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
}

interface Connection {
  id: string;
  full_name: string;
  profile_photo: string;
  job_title: string;
  isMember: boolean;
  isInvited: boolean;
}

const InviteToGroupModal: React.FC<InviteToGroupModalProps> = ({
  isOpen,
  onClose,
  groupId,
  groupName
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      fetchConnections();
    }
  }, [isOpen, user]);

  const fetchConnections = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Get user's connections
      const { data: connectionsData, error: connError } = await supabase
        .from('connections')
        .select('user_1_id, user_2_id')
        .or(`user_1_id.eq.${user.id},user_2_id.eq.${user.id}`);

      if (connError) throw connError;

      // Get connected user IDs
      const connectedUserIds = connectionsData?.map(c => 
        c.user_1_id === user.id ? c.user_2_id : c.user_1_id
      ) || [];

      if (connectedUserIds.length === 0) {
        setConnections([]);
        setLoading(false);
        return;
      }

      // Get user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, full_name, profile_photo, job_title')
        .in('id', connectedUserIds);

      if (profilesError) throw profilesError;

      // Get existing group members
      const { data: members } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId);

      const memberIds = new Set(members?.map(m => m.user_id) || []);

      // Get pending invitations
      const { data: invitations } = await supabase
        .from('group_join_requests')
        .select('user_id')
        .eq('group_id', groupId)
        .eq('status', 'pending');

      const invitedIds = new Set(invitations?.map(i => i.user_id) || []);

      const formattedConnections: Connection[] = (profiles || []).map(p => ({
        id: p.id,
        full_name: p.full_name || 'Unknown',
        profile_photo: p.profile_photo || '',
        job_title: p.job_title || '',
        isMember: memberIds.has(p.id),
        isInvited: invitedIds.has(p.id)
      }));

      setConnections(formattedConnections);
    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const inviteUser = async (userId: string) => {
    if (!user) return;
    setInviting(userId);

    try {
      const { error } = await supabase
        .from('group_join_requests')
        .insert({
          group_id: groupId,
          user_id: userId,
          invited_by: user.id,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: 'Invitation Sent',
        description: 'User has been invited to join the group'
      });

      // Update local state
      setConnections(prev => prev.map(c => 
        c.id === userId ? { ...c, isInvited: true } : c
      ));
    } catch (error) {
      console.error('Error inviting user:', error);
      toast({
        title: 'Error',
        description: 'Failed to send invitation',
        variant: 'destructive'
      });
    } finally {
      setInviting(null);
    }
  };

  const filteredConnections = connections.filter(c =>
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.job_title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite to {groupName}
          </DialogTitle>
          <DialogDescription>
            Invite your connections to join this group
          </DialogDescription>
        </DialogHeader>

        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search connections..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading connections...</p>
            </div>
          ) : filteredConnections.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {connections.length === 0 
                    ? "You don't have any connections yet" 
                    : "No connections match your search"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredConnections.map((connection) => (
              <Card key={connection.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={connection.profile_photo} />
                        <AvatarFallback>
                          {connection.full_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{connection.full_name}</p>
                        {connection.job_title && (
                          <p className="text-sm text-muted-foreground">
                            {connection.job_title}
                          </p>
                        )}
                      </div>
                    </div>

                    {connection.isMember ? (
                      <Badge variant="secondary">
                        <Check className="h-3 w-3 mr-1" />
                        Member
                      </Badge>
                    ) : connection.isInvited ? (
                      <Badge variant="outline">
                        Invited
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => inviteUser(connection.id)}
                        disabled={inviting === connection.id}
                      >
                        {inviting === connection.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-1" />
                            Invite
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InviteToGroupModal;
