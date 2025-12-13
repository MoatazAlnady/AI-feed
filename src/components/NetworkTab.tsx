import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Input } from './ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { toast } from 'sonner';
import { Search } from 'lucide-react';
import UserProfileCard from './UserProfileCard';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

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
  const { t } = useTranslation();
  const navigate = useNavigate();
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
            full_name: 'Deleted User',
            profile_photo: undefined,
            job_title: undefined,
            company: undefined
          }
        };
      }) || [];

      setConnections(connectionsWithUser);
    } catch (error) {
      console.error('Error fetching connections:', error);
      toast.error(t('network.loadError'));
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
      toast.success(t('network.connectionRemoved'));
    } catch (error) {
      console.error('Error removing connection:', error);
      toast.error(t('network.connectionRemovedError'));
    }
  };

  const handleMessage = async (userId: string) => {
    try {
      // Use find_or_create_dm to get or create conversation
      const { data: conversationId, error } = await supabase.rpc('find_or_create_dm', {
        other_user_id: userId
      });

      if (error) throw error;

      // Navigate to messages with the conversation
      navigate(`/messages?conversation=${conversationId}`);
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error('Failed to start conversation');
    }
  };

  const filteredConnections = connections.filter(connection =>
    connection.connected_user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    connection.connected_user.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    connection.connected_user.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Split connections into recent (last 30 days) and all
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentConnections = filteredConnections.filter(connection => 
    new Date(connection.created_at) >= thirtyDaysAgo
  );
  
  const allConnections = filteredConnections;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t('network.myNetwork')} ({connections.length})</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('network.searchConnections')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-64"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">{t('network.loadingConnections')}</div>
      ) : (
        <Tabs defaultValue="recent" className="w-full" dir="ltr">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="recent">{t('network.recent')} ({recentConnections.length})</TabsTrigger>
            <TabsTrigger value="all">{t('network.all')} ({allConnections.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="recent" className="space-y-4">
            {recentConnections.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? t('network.noRecentConnectionsSearch') : t('network.noRecentConnections')}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {recentConnections.map((connection) => (
                  <UserProfileCard
                    key={connection.id}
                    userId={connection.connected_user.id}
                    name={connection.connected_user.full_name || 'Deleted User'}
                    title={connection.connected_user.job_title}
                    company={connection.connected_user.company}
                    profilePhoto={connection.connected_user.profile_photo}
                    onMessage={() => handleMessage(connection.connected_user.id)}
                    onConnect={() => removeConnection(connection.id)}
                    className="bg-primary/5 border-primary/20"
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {allConnections.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? t('network.noConnectionsSearch') : t('network.noConnections')}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {allConnections.map((connection) => (
                  <UserProfileCard
                    key={connection.id}
                    userId={connection.connected_user.id}
                    name={connection.connected_user.full_name || 'Deleted User'}
                    title={connection.connected_user.job_title}
                    company={connection.connected_user.company}
                    profilePhoto={connection.connected_user.profile_photo}
                    onMessage={() => handleMessage(connection.connected_user.id)}
                    onConnect={() => removeConnection(connection.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default NetworkTab;