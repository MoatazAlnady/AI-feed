import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Check, X, User } from 'lucide-react';

interface ConnectionRequest {
  id: string;
  requester_id: string;
  message?: string;
  created_at: string;
  requester: {
    full_name: string;
    profile_photo?: string;
    job_title?: string;
  };
}

interface ConnectionRequestsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ConnectionRequestsModal: React.FC<ConnectionRequestsModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && user) {
      fetchConnectionRequests();
    }
  }, [open, user]);

  const fetchConnectionRequests = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('connection_requests')
        .select(`
          id,
          requester_id,
          message,
          created_at
        `)
        .eq('recipient_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch requester profiles separately
      const requesterIds = data?.map(r => r.requester_id) || [];
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, full_name, profile_photo, job_title')
        .in('id', requesterIds);

      const requestsWithProfiles = data?.map(request => ({
        ...request,
        requester: profiles?.find(p => p.id === request.requester_id) || {
          full_name: 'Unknown User',
          profile_photo: undefined,
          job_title: undefined
        }
      })) || [];

      setRequests(requestsWithProfiles);
    } catch (error) {
      console.error('Error fetching connection requests:', error);
      toast.error('Failed to load connection requests');
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (requestId: string, action: 'accepted' | 'rejected') => {
    try {
      const { error: updateError } = await supabase
        .from('connection_requests')
        .update({ status: action })
        .eq('id', requestId);

      if (updateError) throw updateError;

      if (action === 'accepted') {
        // Create connection
        const request = requests.find(r => r.id === requestId);
        if (request) {
          const user1Id = request.requester_id < user!.id ? request.requester_id : user!.id;
          const user2Id = request.requester_id < user!.id ? user!.id : request.requester_id;

          const { error: connectionError } = await supabase
            .from('connections')
            .insert({ user_1_id: user1Id, user_2_id: user2Id });

          if (connectionError) throw connectionError;
        }
      }

      setRequests(prev => prev.filter(r => r.id !== requestId));
      toast.success(`Connection request ${action}`);
    } catch (error) {
      console.error(`Error ${action} connection request:`, error);
      toast.error(`Failed to ${action} connection request`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Connection Requests</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : requests.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No pending connection requests
            </div>
          ) : (
            requests.map((request) => (
              <div key={request.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                <Avatar className="h-10 w-10">
                  {request.requester.profile_photo ? (
                    <AvatarImage src={request.requester.profile_photo} />
                  ) : (
                    <AvatarFallback>
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  )}
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {request.requester.full_name || 'Unknown User'}
                  </div>
                  {request.requester.job_title && (
                    <div className="text-sm text-muted-foreground">
                      {request.requester.job_title}
                    </div>
                  )}
                  {request.message && (
                    <div className="text-sm mt-1 text-muted-foreground">
                      "{request.message}"
                    </div>
                  )}
                  
                  <div className="flex space-x-2 mt-2">
                    <Button
                      size="sm"
                      onClick={() => handleRequest(request.id, 'accepted')}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRequest(request.id, 'rejected')}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Decline
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectionRequestsModal;