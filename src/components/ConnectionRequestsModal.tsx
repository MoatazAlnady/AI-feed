import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  isInline?: boolean;
  onClose?: () => void;
}

const ConnectionRequestsModal: React.FC<ConnectionRequestsModalProps> = ({
  open,
  onOpenChange,
  isInline = false,
  onClose,
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
      // Fetch connection requests with requester profiles using direct join
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

      // Fetch profiles separately using user_profiles table directly
      const requesterIds = data?.map(r => r.requester_id) || [];
      
      if (requesterIds.length === 0) {
        setRequests([]);
        return;
      }

      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, full_name, profile_photo, job_title')
        .in('id', requesterIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      const requestsWithProfiles = data?.map(request => {
        const profile = profiles?.find(p => p.id === request.requester_id);
        return {
          ...request,
          requester: profile ? {
            full_name: profile.full_name || 'Unknown User',
            profile_photo: profile.profile_photo,
            job_title: profile.job_title
          } : {
            full_name: 'Deleted User',
            profile_photo: undefined,
            job_title: undefined
          }
        };
      }) || [];

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

      // Refresh the header count by dispatching a custom event
      window.dispatchEvent(new CustomEvent('connectionRequestProcessed'));
    } catch (error) {
      console.error(`Error ${action} connection request:`, error);
      toast.error(`Failed to ${action} connection request`);
    }
  };

  const handleOutsideClick = (e: React.MouseEvent) => {
    // Only handle outside clicks for non-inline modals
    if (!isInline && e.target === e.currentTarget) {
      onOpenChange(false);
    }
  };

  if (!open) return null;

  if (isInline) {
    return (
      <>
        <div className="p-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">
            Connection Requests
          </h3>
        </div>
        
        <div className="max-h-64 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              No pending connection requests
            </div>
          ) : (
            requests.slice(0, 3).map((request) => (
              <div key={request.id} className="flex items-start space-x-3 p-3 rounded-lg border border-border">
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
                    <div className="font-medium truncate text-foreground">
                    {request.requester.full_name || 'Deleted User'}
                  </div>
                  {request.requester.job_title && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {request.requester.job_title}
                    </div>
                  )}
                  {request.message && (
                    <div className="text-sm mt-1 text-gray-600 dark:text-gray-300">
                      "{request.message}"
                    </div>
                  )}
                  
                  <div className="flex space-x-2 mt-3">
                    <Button
                      size="sm"
                      onClick={() => handleRequest(request.id, 'accepted')}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-xs"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRequest(request.id, 'rejected')}
                      className="px-3 py-1 text-xs"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Decline
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with See All button */}
        <div className="p-3 border-t border-border bg-muted">
          <Link
            to="/connection-requests"
            onClick={() => {
              onClose?.();
              onOpenChange(false);
            }}
            className="block w-full text-center text-sm text-primary hover:text-primary/80 font-medium"
          >
            See All Connection Requests
          </Link>
        </div>
      </>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-16"
      onClick={handleOutsideClick}
    >
      <div className="bg-card rounded-lg shadow-lg max-w-md w-full mx-4 max-h-96 overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">
            Connection Requests
          </h3>
        </div>
        
        <div className="max-h-80 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : requests.length === 0 ? (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              No pending connection requests
            </div>
          ) : (
            requests.map((request) => (
              <div key={request.id} className="flex items-start space-x-3 p-3 rounded-lg border border-border">
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
                  <div className="font-medium truncate text-foreground">
                    {request.requester.full_name || 'Deleted User'}
                  </div>
                  {request.requester.job_title && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {request.requester.job_title}
                    </div>
                  )}
                  {request.message && (
                    <div className="text-sm mt-1 text-gray-600 dark:text-gray-300">
                      "{request.message}"
                    </div>
                  )}
                  
                  <div className="flex space-x-2 mt-3">
                    <Button
                      size="sm"
                      onClick={() => handleRequest(request.id, 'accepted')}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-xs"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRequest(request.id, 'rejected')}
                      className="px-3 py-1 text-xs"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Decline
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectionRequestsModal;