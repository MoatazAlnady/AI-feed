import React, { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { Check, X, Clock, Search, SortAsc, SortDesc, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface ConnectionRequest {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  message?: string;
  created_at: string;
  updated_at: string;
  requester?: {
    id: string;
    full_name: string;
    profile_photo?: string;
    job_title?: string;
    company?: string;
    handle?: string;
  };
}

type SortOption = 'name-asc' | 'name-desc' | 'date-newest' | 'date-oldest';
type FilterOption = 'recent' | 'all';

const ConnectionRequests: React.FC = () => {
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('date-newest');
  const [filterBy, setFilterBy] = useState<FilterOption>('recent');
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Fetch connection requests
  const fetchRequests = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('connection_requests')
        .select(`
          id,
          requester_id,
          recipient_id,
          status,
          message,
          created_at,
          updated_at,
          user_profiles!requester_id (
            id,
            full_name,
            profile_photo,
            job_title,
            company,
            handle
          )
        `)
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const formattedRequests: ConnectionRequest[] = data.map(request => ({
          id: request.id,
          requester_id: request.requester_id,
          recipient_id: request.recipient_id,
          status: request.status as 'pending' | 'accepted' | 'rejected',
          message: request.message,
          created_at: request.created_at,
          updated_at: request.updated_at,
          requester: (request as any).user_profiles ? {
            id: (request as any).user_profiles.id,
            full_name: (request as any).user_profiles.full_name || 'Deleted User',
            profile_photo: (request as any).user_profiles.profile_photo,
            job_title: (request as any).user_profiles.job_title,
            company: (request as any).user_profiles.company,
            handle: (request as any).user_profiles.handle
          } : undefined
        }));
        
        setRequests(formattedRequests);
      }
    } catch (error) {
      console.error('Error fetching connection requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [user]);

  // Handle request actions
  const handleAccept = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('connection_requests')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', requestId);

      if (!error) {
        setRequests(prev => prev.map(req => 
          req.id === requestId ? { ...req, status: 'accepted' as const } : req
        ));
        window.dispatchEvent(new Event('connectionRequestProcessed'));
      }
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('connection_requests')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', requestId);

      if (!error) {
        setRequests(prev => prev.map(req => 
          req.id === requestId ? { ...req, status: 'rejected' as const } : req
        ));
        window.dispatchEvent(new Event('connectionRequestProcessed'));
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  // Filter and sort requests
  const getFilteredAndSortedRequests = () => {
    let filtered = requests;

    // Apply filter
    if (filterBy === 'recent') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      filtered = requests.filter(req => new Date(req.created_at) >= sevenDaysAgo);
    }

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(req => 
        req.requester?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.requester?.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.requester?.company?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return (a.requester?.full_name || '').localeCompare(b.requester?.full_name || '');
        case 'name-desc':
          return (b.requester?.full_name || '').localeCompare(a.requester?.full_name || '');
        case 'date-newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'date-oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'accepted':
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600"><Check className="h-3 w-3 mr-1" />Accepted</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><X className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return null;
    }
  };

  const pendingRequests = requests.filter(req => req.status === 'pending');
  const processedRequests = requests.filter(req => req.status !== 'pending');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Connection Requests
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your incoming connection requests
        </p>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Filters & Sorting</span>
            <div className="flex gap-2">
              <Badge variant="outline">{requests.length} total</Badge>
              <Badge variant="secondary">{pendingRequests.length} pending</Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, job title, or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filter */}
            <Select value={filterBy} onValueChange={(value) => setFilterBy(value as FilterOption)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recent (7 days)</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-newest">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Newest First
                  </div>
                </SelectItem>
                <SelectItem value="date-oldest">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Oldest First
                  </div>
                </SelectItem>
                <SelectItem value="name-asc">
                  <div className="flex items-center">
                    <SortAsc className="h-4 w-4 mr-2" />
                    Name A-Z
                  </div>
                </SelectItem>
                <SelectItem value="name-desc">
                  <div className="flex items-center">
                    <SortDesc className="h-4 w-4 mr-2" />
                    Name Z-A
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different request states */}
      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending" className="relative">
            Pending Requests
            {pendingRequests.length > 0 && (
              <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {pendingRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="processed">
            Processed Requests
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <div className="space-y-4">
            {pendingRequests.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No Pending Requests
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    You don't have any pending connection requests at the moment.
                  </p>
                </CardContent>
              </Card>
            ) : (
              getFilteredAndSortedRequests()
                .filter(req => req.status === 'pending')
                .map((request) => (
                  <Card key={request.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <Avatar 
                            className="h-12 w-12 cursor-pointer hover:ring-2 hover:ring-primary"
                            onClick={() => {
                              if (request.requester?.handle) {
                                navigate(`/creator/${request.requester.handle}`);
                              } else {
                                navigate(`/creator/${request.requester_id}`);
                              }
                            }}
                          >
                            <AvatarImage src={request.requester?.profile_photo} />
                            <AvatarFallback>
                              {request.requester?.full_name?.[0] || '?'}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1">
                            <h3 
                              className="font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-primary"
                              onClick={() => {
                                if (request.requester?.handle) {
                                  navigate(`/creator/${request.requester.handle}`);
                                } else {
                                  navigate(`/creator/${request.requester_id}`);
                                }
                              }}
                            >
                              {request.requester?.full_name || 'Deleted User'}
                            </h3>
                            
                            {request.requester?.job_title && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {request.requester.job_title}
                                {request.requester.company && ` at ${request.requester.company}`}
                              </p>
                            )}
                            
                            {request.message && (
                              <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                "{request.message}"
                              </p>
                            )}
                            
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              Requested {formatDate(request.created_at)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleAccept(request.id)}
                            className="bg-green-500 hover:bg-green-600"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(request.id)}
                            className="text-red-500 border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="processed">
          <div className="space-y-4">
            {processedRequests.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Check className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No Processed Requests
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    You haven't processed any connection requests yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              getFilteredAndSortedRequests()
                .filter(req => req.status !== 'pending')
                .map((request) => (
                  <Card key={request.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <Avatar 
                            className="h-12 w-12 cursor-pointer hover:ring-2 hover:ring-primary"
                            onClick={() => {
                              if (request.requester?.handle) {
                                navigate(`/creator/${request.requester.handle}`);
                              } else {
                                navigate(`/creator/${request.requester_id}`);
                              }
                            }}
                          >
                            <AvatarImage src={request.requester?.profile_photo} />
                            <AvatarFallback>
                              {request.requester?.full_name?.[0] || '?'}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1">
                            <h3 
                              className="font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-primary"
                              onClick={() => {
                                if (request.requester?.handle) {
                                  navigate(`/creator/${request.requester.handle}`);
                                } else {
                                  navigate(`/creator/${request.requester_id}`);
                                }
                              }}
                            >
                              {request.requester?.full_name || 'Deleted User'}
                            </h3>
                            
                            {request.requester?.job_title && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {request.requester.job_title}
                                {request.requester.company && ` at ${request.requester.company}`}
                              </p>
                            )}
                            
                            {request.message && (
                              <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                "{request.message}"
                              </p>
                            )}
                            
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              Requested {formatDate(request.created_at)} • 
                              Processed {formatDate(request.updated_at)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          {getStatusBadge(request.status)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConnectionRequests;