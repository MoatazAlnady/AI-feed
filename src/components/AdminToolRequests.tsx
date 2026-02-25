import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Check, X, Clock, Eye, User } from 'lucide-react';

interface SubCategoryInfo {
  id: string;
  name: string;
  color?: string;
}

interface ToolEditRequest {
  id: string;
  tool_id: string;
  tool_name: string;
  user_id: string;
  user_name: string;
  name: string;
  description: string;
  category_id: string;
  category_name: string;
  sub_category_id?: string;
  sub_category_name?: string;
  website: string;
  pricing: string;
  features: string[];
  pros: string[];
  cons: string[];
  tags: string[];
  created_at: string;
}

interface AdminToolRequestsProps {
  onRefresh?: () => void;
}

const AdminToolRequests: React.FC<AdminToolRequestsProps> = ({ onRefresh }) => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<ToolEditRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ToolEditRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase.rpc('get_pending_edit_requests', {
        limit_param: 50,
        offset_param: 0
      });

      if (error) throw error;
      
      // sub_category_name is now returned directly from the DB function
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching tool edit requests:', error);
      toast({
        title: "Error",
        description: "Failed to load tool edit requests",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    setProcessing(requestId);
    try {
      const { error } = await supabase.rpc('approve_tool_edit_request', {
        request_id_param: requestId,
        admin_notes_param: adminNotes || null
      });

      if (error) throw error;

      toast({
        title: "Request Approved",
        description: "Tool edit request has been approved and changes applied."
      });

      await fetchRequests();
      if (onRefresh) onRefresh();
      setSelectedRequest(null);
      setAdminNotes('');
    } catch (error) {
      console.error('Error approving request:', error);
      toast({
        title: "Error",
        description: "Failed to approve request",
        variant: "destructive"
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!adminNotes.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection",
        variant: "destructive"
      });
      return;
    }

    setProcessing(requestId);
    try {
      const { error } = await supabase.rpc('reject_tool_edit_request', {
        request_id_param: requestId,
        admin_notes_param: adminNotes
      });

      if (error) throw error;

      toast({
        title: "Request Rejected",
        description: "Tool edit request has been rejected."
      });

      await fetchRequests();
      if (onRefresh) onRefresh();
      setSelectedRequest(null);
      setAdminNotes('');
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({
        title: "Error",
        description: "Failed to reject request",
        variant: "destructive"
      });
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="container max-w-6xl mx-auto py-8 px-6">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading tool edit requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold mb-4 text-foreground">
          Tool Edit Requests
        </h1>
        <p className="text-xl text-muted-foreground">
          Review and manage user-submitted edit requests for AI tools
        </p>
      </div>

        {requests.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Pending Requests</h3>
              <p className="text-muted-foreground">
                All tool edit requests have been processed.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {requests.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {request.name}
                        <Badge variant="outline">
                          {request.category_name}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Requested by {request.user_name} • {new Date(request.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedRequest(request)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Review
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Description</h4>
                      <p className="text-sm text-muted-foreground">{request.description}</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Website</h4>
                      <a 
                        href={request.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        {request.website}
                      </a>
                    </div>
                  </div>
                  
                  {request.tags && request.tags.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {request.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

      {/* Review Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-bold">Review Tool Edit Request</h2>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-2 hover:bg-muted rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Request Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-4">Requested Changes</h3>
                  <div className="space-y-4">
                    <div>
                      <Label>Tool Name</Label>
                      <p className="text-sm mt-1">{selectedRequest.name}</p>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <p className="text-sm mt-1">{selectedRequest.description}</p>
                    </div>
                    <div>
                      <Label>Website</Label>
                      <p className="text-sm mt-1">{selectedRequest.website}</p>
                    </div>
                    <div>
                      <Label>Pricing</Label>
                      <p className="text-sm mt-1">{selectedRequest.pricing}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-4">Request Info</h3>
                  <div className="space-y-4">
                    <div>
                      <Label>Requested by</Label>
                      <p className="text-sm mt-1 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {selectedRequest.user_name}
                      </p>
                    </div>
                    <div>
                      <Label>Original Tool</Label>
                      <p className="text-sm mt-1">{selectedRequest.tool_name}</p>
                    </div>
                    <div>
                      <Label>Category</Label>
                      <p className="text-sm mt-1">{selectedRequest.category_name}</p>
                    </div>
                    <div>
                      <Label>Subcategory</Label>
                      <p className="text-sm mt-1">
                        {selectedRequest.sub_category_name || 'None'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Features, Pros, Cons */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label>Features</Label>
                  <ul className="text-sm mt-1 space-y-1">
                    {selectedRequest.features?.map((feature, index) => (
                      <li key={index}>• {feature}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <Label>Pros</Label>
                  <ul className="text-sm mt-1 space-y-1">
                    {selectedRequest.pros?.map((pro, index) => (
                      <li key={index}>• {pro}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <Label>Cons</Label>
                  <ul className="text-sm mt-1 space-y-1">
                    {selectedRequest.cons?.map((con, index) => (
                      <li key={index}>• {con}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Admin Notes */}
              <div>
                <Label htmlFor="adminNotes">Admin Notes</Label>
                <Textarea
                  id="adminNotes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about your decision..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => handleApprove(selectedRequest.id)}
                  disabled={processing === selectedRequest.id}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Check className="h-4 w-4 mr-2" />
                  {processing === selectedRequest.id ? "Processing..." : "Approve"}
                </Button>
                <Button
                  onClick={() => handleReject(selectedRequest.id)}
                  disabled={processing === selectedRequest.id}
                  variant="destructive"
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  {processing === selectedRequest.id ? "Processing..." : "Reject"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminToolRequests;