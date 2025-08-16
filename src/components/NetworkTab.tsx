import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'sonner';
import { User, Search, MessageCircle, UserMinus } from 'lucide-react';

interface Connection {
  id: string;
  connected_user: {
    id: string;
    full_name: string;
    profile_photo?: string;
    job_title?: string;
    company?: string;
  };
  created_at: string;
}

const NetworkTab: React.FC = () => {
  const { user } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchConnections();
    }
  }, [user]);

  const fetchConnections = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('connections')
        .select('id, user_1_id, user_2_id, created_at')
        .or(`user_1_id.eq.${user.id},user_2_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get connected user IDs
      const connectedUserIds = data?.map(conn => 
        conn.user_1_id === user.id ? conn.user_2_id : conn.user_1_id
      ) || [];

      // Fetch user profiles separately
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, full_name, profile_photo, job_title, company')
        .in('id', connectedUserIds);

      const connectionsWithUser = data?.map(conn => {
        const connectedUserId = conn.user_1_id === user.id ? conn.user_2_id : conn.user_1_id;
        const connectedUser = profiles?.find(p => p.id === connectedUserId);
        
        return {
          id: conn.id,
          created_at: conn.created_at,
          connected_user: connectedUser || {
            id: connectedUserId,
            full_name: 'Unknown User',
            profile_photo: undefined,
            job_title: undefined,
            company: undefined
          }
        };
      }) || [];

      setConnections(connectionsWithUser);
    } catch (error) {
      console.error('Error fetching connections:', error);
      toast.error('Failed to load connections');
    } finally {
      setLoading(false);
    }
  };

  const removeConnection = async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from('connections')
        .delete()
        .eq('id', connectionId);

      if (error) throw error;

      setConnections(prev => prev.filter(c => c.id !== connectionId));
      toast.success('Connection removed');
    } catch (error) {
      console.error('Error removing connection:', error);
      toast.error('Failed to remove connection');
    }
  };

  const filteredConnections = connections.filter(connection =>
    connection.connected_user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    connection.connected_user.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    connection.connected_user.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">My Network ({connections.length})</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search connections..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-64"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading connections...</div>
      ) : filteredConnections.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {searchTerm ? 'No connections found matching your search' : 'No connections yet'}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredConnections.map((connection) => (
            <div key={connection.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Avatar className="h-12 w-12">
                  {connection.connected_user.profile_photo ? (
                    <AvatarImage src={connection.connected_user.profile_photo} />
                  ) : (
                    <AvatarFallback>
                      <User className="h-6 w-6" />
                    </AvatarFallback>
                  )}
                </Avatar>
                
                <div>
                  <h4 className="font-medium">
                    {connection.connected_user.full_name || 'Unknown User'}
                  </h4>
                  {connection.connected_user.job_title && (
                    <p className="text-sm text-muted-foreground">
                      {connection.connected_user.job_title}
                      {connection.connected_user.company && ` at ${connection.connected_user.company}`}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Connected on {new Date(connection.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button size="sm" variant="outline">
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Message
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => removeConnection(connection.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <UserMinus className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NetworkTab;