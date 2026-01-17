import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  X, 
  Search, 
  Users, 
  Shield, 
  ShieldCheck, 
  Crown,
  Ban,
  VolumeX,
  MoreHorizontal,
  UserMinus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface Member {
  id: string;
  user_id: string;
  role: string;
  status: string;
  joined_at: string;
  banned_at: string | null;
  banned_reason: string | null;
  muted_until: string | null;
  user?: {
    full_name: string;
    profile_photo: string | null;
  };
}

interface GroupMembersListProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
  isAdmin: boolean;
  isOwner: boolean;
}

const GroupMembersList: React.FC<GroupMembersListProps> = ({
  isOpen,
  onClose,
  groupId,
  groupName,
  isAdmin,
  isOwner
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    if (isOpen) {
      fetchMembers();
    }
  }, [isOpen, groupId]);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', groupId)
        .order('role', { ascending: true })
        .order('joined_at', { ascending: true });

      if (error) throw error;

      // Fetch user info for each member
      const membersWithUsers = await Promise.all(
        (data || []).map(async (member) => {
          const { data: userData } = await supabase
            .from('user_profiles')
            .select('full_name, profile_photo')
            .eq('id', member.user_id)
            .single();
          return { ...member, user: userData };
        })
      );

      setMembers(membersWithUsers);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateMemberRole = async (memberId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('group_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;

      toast.success('Role updated!');
      fetchMembers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    }
  };

  const banMember = async (memberId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('group_members')
        .update({ 
          status: 'banned',
          banned_at: new Date().toISOString(),
          banned_reason: 'Banned by admin'
        })
        .eq('id', memberId);

      if (error) throw error;

      toast.success('Member banned');
      fetchMembers();
    } catch (error) {
      console.error('Error banning member:', error);
      toast.error('Failed to ban member');
    }
  };

  const unbanMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('group_members')
        .update({ 
          status: 'active',
          banned_at: null,
          banned_reason: null
        })
        .eq('id', memberId);

      if (error) throw error;

      toast.success('Member unbanned');
      fetchMembers();
    } catch (error) {
      console.error('Error unbanning member:', error);
      toast.error('Failed to unban member');
    }
  };

  const muteMember = async (memberId: string, duration: number) => {
    try {
      const muteUntil = new Date();
      muteUntil.setHours(muteUntil.getHours() + duration);

      const { error } = await supabase
        .from('group_members')
        .update({ 
          status: 'muted',
          muted_until: muteUntil.toISOString()
        })
        .eq('id', memberId);

      if (error) throw error;

      toast.success(`Member muted for ${duration} hours`);
      fetchMembers();
    } catch (error) {
      console.error('Error muting member:', error);
      toast.error('Failed to mute member');
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast.success('Member removed');
      fetchMembers();
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-amber-500" />;
      case 'admin':
        return <ShieldCheck className="h-4 w-4 text-blue-500" />;
      case 'moderator':
        return <Shield className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'banned':
        return <Badge variant="destructive">Banned</Badge>;
      case 'muted':
        return <Badge variant="secondary">Muted</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      default:
        return null;
    }
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = !searchTerm || 
      member.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {t('groups.members', 'Members')}
              </h2>
              <p className="text-sm text-muted-foreground">{groupName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-border flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="owner">Owner</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="moderator">Moderator</SelectItem>
              <SelectItem value="member">Member</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Members List */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No members found
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredMembers.map((member) => (
                <div key={member.id} className="p-4 flex items-center justify-between hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={member.user?.profile_photo || undefined} />
                      <AvatarFallback>
                        {(member.user?.full_name || 'U').charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                          {member.user?.full_name || 'Unknown'}
                        </span>
                        {getRoleIcon(member.role)}
                        {getStatusBadge(member.status)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Joined {formatDistanceToNow(new Date(member.joined_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  {isAdmin && member.user_id !== user?.id && member.role !== 'owner' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {isOwner && (
                          <>
                            <DropdownMenuItem onClick={() => updateMemberRole(member.id, 'admin')}>
                              <ShieldCheck className="h-4 w-4 mr-2" />
                              Make Admin
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateMemberRole(member.id, 'moderator')}>
                              <Shield className="h-4 w-4 mr-2" />
                              Make Moderator
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateMemberRole(member.id, 'member')}>
                              <Users className="h-4 w-4 mr-2" />
                              Make Member
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        
                        {member.status !== 'muted' && (
                          <DropdownMenuItem onClick={() => muteMember(member.id, 24)}>
                            <VolumeX className="h-4 w-4 mr-2" />
                            Mute (24 hours)
                          </DropdownMenuItem>
                        )}
                        
                        {member.status === 'banned' ? (
                          <DropdownMenuItem onClick={() => unbanMember(member.id)}>
                            <Ban className="h-4 w-4 mr-2" />
                            Unban
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem 
                            onClick={() => banMember(member.id, member.user_id)}
                            className="text-destructive"
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            Ban
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => removeMember(member.id)}
                          className="text-destructive"
                        >
                          <UserMinus className="h-4 w-4 mr-2" />
                          Remove from Group
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <p className="text-sm text-muted-foreground text-center">
            {members.length} total members
          </p>
        </div>
      </div>
    </div>
  );
};

export default GroupMembersList;
