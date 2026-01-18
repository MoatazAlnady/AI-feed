import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, UserPlus, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface Connection {
  id: string;
  full_name: string;
  profile_photo?: string;
  job_title?: string;
  isInvited?: boolean;
  isAttending?: boolean;
  isGroupMember?: boolean;
}

interface InviteToEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventType: 'group_event' | 'standalone_event';
  groupId?: string;
  isPublic: boolean;
  eventTitle?: string;
}

const InviteToEventModal: React.FC<InviteToEventModalProps> = ({
  isOpen,
  onClose,
  eventId,
  eventType,
  groupId,
  isPublic,
  eventTitle
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [filteredConnections, setFilteredConnections] = useState<Connection[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen && user) {
      fetchConnections();
    }
  }, [isOpen, user, eventId]);

  useEffect(() => {
    const filtered = connections.filter(conn =>
      conn.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conn.job_title?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredConnections(filtered);
  }, [searchTerm, connections]);

  const fetchConnections = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Get user's connections
      const { data: connectionData } = await supabase
        .from('connections')
        .select('user_1_id, user_2_id')
        .or(`user_1_id.eq.${user.id},user_2_id.eq.${user.id}`);

      const connectedUserIds = (connectionData || []).map(c =>
        c.user_1_id === user.id ? c.user_2_id : c.user_1_id
      );

      if (connectedUserIds.length === 0) {
        setConnections([]);
        setFilteredConnections([]);
        setLoading(false);
        return;
      }

      // Get user profiles
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, full_name, profile_photo, job_title')
        .in('id', connectedUserIds);

      // Get existing invitations for this event
      const { data: existingInvitations } = await supabase
        .from('event_invitations')
        .select('invitee_id, status')
        .eq('event_id', eventId)
        .eq('event_type', eventType);

      const invitedMap = new Map(
        (existingInvitations || []).map(inv => [inv.invitee_id, inv.status])
      );

      // Get attendees for this event using unified event_attendees table
      const { data: attendees } = await supabase
        .from('event_attendees')
        .select('user_id')
        .eq('event_id', eventId)
        .eq('status', 'attending');
      const attendeeIds = (attendees || []).map(a => a.user_id);

      // For private events, get group members
      let groupMemberIds: string[] = [];
      if (!isPublic && groupId) {
        const { data: members } = await supabase
          .from('group_members')
          .select('user_id')
          .eq('group_id', groupId)
          .eq('status', 'active');
        groupMemberIds = (members || []).map(m => m.user_id);
      }

      // Build connection list with status
      const connectionList: Connection[] = (profiles || []).map(profile => ({
        id: profile.id,
        full_name: profile.full_name || 'Unknown User',
        profile_photo: profile.profile_photo,
        job_title: profile.job_title,
        isInvited: invitedMap.has(profile.id),
        isAttending: attendeeIds.includes(profile.id),
        isGroupMember: isPublic || groupMemberIds.includes(profile.id)
      }));

      // For private events, only show connections who are group members
      const visibleConnections = isPublic
        ? connectionList
        : connectionList.filter(c => c.isGroupMember);

      setConnections(visibleConnections);
      setFilteredConnections(visibleConnections);
    } catch (error) {
      console.error('Error fetching connections:', error);
      toast.error('Failed to load connections');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (connectionId: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(connectionId)) {
        newSet.delete(connectionId);
      } else {
        newSet.add(connectionId);
      }
      return newSet;
    });
  };

  const inviteSelected = async () => {
    if (!user || selectedIds.size === 0) return;

    setInviting('batch');
    try {
      const invitations = Array.from(selectedIds).map(inviteeId => ({
        event_id: eventId,
        event_type: eventType,
        inviter_id: user.id,
        invitee_id: inviteeId,
        status: 'pending'
      }));

      const { error } = await supabase
        .from('event_invitations')
        .insert(invitations);

      if (error) throw error;

      toast.success(`Invited ${selectedIds.size} connection${selectedIds.size > 1 ? 's' : ''}!`);
      
      // Update local state
      setConnections(prev => prev.map(c => 
        selectedIds.has(c.id) ? { ...c, isInvited: true } : c
      ));
      setSelectedIds(new Set());
    } catch (error: any) {
      console.error('Error sending invitations:', error);
      if (error.code === '23505') {
        toast.error('Some invitations already exist');
      } else {
        toast.error('Failed to send invitations');
      }
    } finally {
      setInviting(null);
    }
  };

  const inviteSingle = async (connectionId: string) => {
    if (!user) return;

    setInviting(connectionId);
    try {
      const { error } = await supabase
        .from('event_invitations')
        .insert({
          event_id: eventId,
          event_type: eventType,
          inviter_id: user.id,
          invitee_id: connectionId,
          status: 'pending'
        });

      if (error) throw error;

      toast.success('Invitation sent!');
      
      // Update local state
      setConnections(prev => prev.map(c => 
        c.id === connectionId ? { ...c, isInvited: true } : c
      ));
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      if (error.code === '23505') {
        toast.error('Already invited');
      } else {
        toast.error('Failed to send invitation');
      }
    } finally {
      setInviting(null);
    }
  };

  const availableToInvite = filteredConnections.filter(c => !c.isInvited && !c.isAttending);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {t('events.inviteConnections', 'Invite Connections')}
          </DialogTitle>
          {eventTitle && (
            <p className="text-sm text-muted-foreground mt-1">to {eventTitle}</p>
          )}
          {!isPublic && (
            <Badge variant="secondary" className="w-fit mt-2">
              Private Event - Only group members shown
            </Badge>
          )}
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('events.searchConnections', 'Search connections...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between bg-primary/10 rounded-lg p-3">
            <span className="text-sm font-medium">
              {selectedIds.size} selected
            </span>
            <Button 
              size="sm" 
              onClick={inviteSelected}
              disabled={inviting === 'batch'}
            >
              {inviting === 'batch' ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <UserPlus className="h-4 w-4 mr-1" />
              )}
              Invite All
            </Button>
          </div>
        )}

        {/* Connections List */}
        <ScrollArea className="flex-1 max-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filteredConnections.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {connections.length === 0
                ? t('events.noConnections', 'No connections to invite')
                : t('events.noConnectionsMatch', 'No connections match your search')
              }
            </div>
          ) : (
            <div className="space-y-2 pr-4">
              {filteredConnections.map((connection) => (
                <div
                  key={connection.id}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    selectedIds.has(connection.id) 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  } ${connection.isInvited || connection.isAttending ? 'opacity-60' : 'cursor-pointer'}`}
                  onClick={() => {
                    if (!connection.isInvited && !connection.isAttending) {
                      toggleSelection(connection.id);
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={connection.profile_photo} />
                      <AvatarFallback>
                        {connection.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{connection.full_name}</p>
                      {connection.job_title && (
                        <p className="text-xs text-muted-foreground">{connection.job_title}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    {connection.isAttending ? (
                      <Badge variant="secondary" className="text-xs">
                        <Check className="h-3 w-3 mr-1" />
                        Attending
                      </Badge>
                    ) : connection.isInvited ? (
                      <Badge variant="outline" className="text-xs">
                        Invited
                      </Badge>
                    ) : selectedIds.has(connection.id) ? (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          inviteSingle(connection.id);
                        }}
                        disabled={inviting === connection.id}
                      >
                        {inviting === connection.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <UserPlus className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            {availableToInvite.length} available to invite
          </p>
          <Button variant="outline" onClick={onClose}>
            {t('common.done', 'Done')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InviteToEventModal;
