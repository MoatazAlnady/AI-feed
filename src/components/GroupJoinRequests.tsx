import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Check, X, Clock, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface GroupJoinRequestsProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  onRequestsUpdated?: () => void;
}

interface JoinRequest {
  id: string;
  user_id: string;
  status: string;
  message: string | null;
  created_at: string;
  user_profiles?: {
    full_name: string;
    profile_photo: string;
    job_title: string;
  };
}

const GroupJoinRequests: React.FC<GroupJoinRequestsProps> = ({
  isOpen,
  onClose,
  groupId,
  onRequestsUpdated
}) => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && groupId) {
      fetchRequests();
    }
  }, [isOpen, groupId]);

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from('group_join_requests')
      .select('*')
      .eq('group_id', groupId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching requests:', error);
      return;
    }

    // Fetch user profiles separately
    const userIds = data?.map(r => r.user_id) || [];
    if (userIds.length === 0) {
      setRequests([]);
      return;
    }

    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, full_name, profile_photo, job_title')
      .in('id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    const requestsWithProfiles = data?.map(r => ({
      ...r,
      user_profiles: profileMap.get(r.user_id)
    })) || [];

    setRequests(requestsWithProfiles as JoinRequest[]);
  };

  const handleRequest = async (requestId: string, userId: string, approve: boolean) => {
    setLoading(true);
    try {
      // Update request status
      const { error: updateError } = await supabase
        .from('group_join_requests')
        .update({
          status: approve ? 'approved' : 'rejected',
          responded_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // If approved, add user to group members
      if (approve) {
        const { error: memberError } = await supabase
          .from('group_members')
          .insert({
            group_id: groupId,
            user_id: userId,
            role: 'member'
          });

        if (memberError) throw memberError;

        // Update member count
        const { data: currentGroup } = await supabase
          .from('groups')
          .select('member_count')
          .eq('id', groupId)
          .single();

        await supabase
          .from('groups')
          .update({ member_count: (currentGroup?.member_count || 0) + 1 })
          .eq('id', groupId);
      }

      toast({
        title: 'Success',
        description: approve ? 'Request approved' : 'Request rejected'
      });

      fetchRequests();
      onRequestsUpdated?.();
    } catch (error) {
      console.error('Error handling request:', error);
      toast({
        title: 'Error',
        description: 'Failed to process request',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Join Requests
          </DialogTitle>
          <DialogDescription>
            Review and manage pending join requests
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {requests.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No pending requests</p>
              </CardContent>
            </Card>
          ) : (
            requests.map((request) => (
              <Card key={request.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={request.user_profiles?.profile_photo} />
                      <AvatarFallback>
                        {request.user_profiles?.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">
                          {request.user_profiles?.full_name || 'Unknown User'}
                        </p>
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                        </Badge>
                      </div>
                      
                      {request.user_profiles?.job_title && (
                        <p className="text-sm text-muted-foreground truncate">
                          {request.user_profiles.job_title}
                        </p>
                      )}
                      
                      {request.message && (
                        <p className="text-sm mt-2 p-2 bg-muted rounded-md">
                          "{request.message}"
                        </p>
                      )}
                      
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          onClick={() => handleRequest(request.id, request.user_id, true)}
                          disabled={loading}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRequest(request.id, request.user_id, false)}
                          disabled={loading}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
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

export default GroupJoinRequests;
