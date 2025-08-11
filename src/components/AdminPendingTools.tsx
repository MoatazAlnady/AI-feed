import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Check, X, Clock, Eye, User, ExternalLink } from 'lucide-react';

interface PendingTool {
  id: string;
  name: string;
  description: string;
  category_id: string;
  category_name: string;
  subcategory: string;
  website: string;
  logo_url: string;
  pricing: string;
  features: string[];
  pros: string[];
  cons: string[];
  tags: string[];
  user_id: string;
  user_name: string;
  created_at: string;
}

// Removed PendingEditRequest interface as edit requests are handled on a separate page

interface AdminPendingToolsProps {
  onRefresh?: () => void;
}

const AdminPendingTools: React.FC<AdminPendingToolsProps> = ({ onRefresh }) => {
  const { toast } = useToast();
  const [tools, setTools] = useState<PendingTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<PendingTool | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    setLoading(true);
    fetchPendingTools().finally(() => setLoading(false));
  }, []);

  const fetchPendingTools = async () => {
    try {
      const { data, error } = await supabase.rpc('get_pending_tools', {
        limit_param: 50,
        offset_param: 0
      });

      if (error) throw error;

      let normalized = (Array.isArray(data) ? data : []).map((t: any) => ({
        ...t,
        features: Array.isArray(t?.features) ? t.features : [],
        pros: Array.isArray(t?.pros) ? t.pros : [],
        cons: Array.isArray(t?.cons) ? t.cons : [],
        tags: Array.isArray(t?.tags) ? t.tags : [],
        description: t?.description ?? '',
        website: t?.website ?? '',
        pricing: t?.pricing ?? '',
        category_name: t?.category_name ?? 'Uncategorized',
        user_name: t?.user_name ?? 'Unknown User',
      }));

      // Fallback: directly read pending tools in case RPC returns empty
      if (normalized.length === 0) {
        const { data: fallback, error: fbErr } = await supabase
          .from('tools')
          .select('id, name, description, category_id, subcategory, website, pricing, features, pros, cons, tags, user_id, created_at, status')
          .eq('status', 'pending')
          .order('created_at', { ascending: false });
        if (!fbErr) {
          normalized = (fallback ?? []).map((t: any) => ({
            id: t.id,
            name: t.name,
            description: t.description ?? '',
            category_id: t.category_id ?? '',
            category_name: 'Uncategorized',
            subcategory: t.subcategory ?? '',
            website: t.website ?? '',
            pricing: t.pricing ?? '',
            features: Array.isArray(t.features) ? t.features : [],
            pros: Array.isArray(t.pros) ? t.pros : [],
            cons: Array.isArray(t.cons) ? t.cons : [],
            tags: Array.isArray(t.tags) ? t.tags : [],
            user_id: t.user_id,
            user_name: 'Unknown User',
            created_at: t.created_at,
          }));
        }
      }

      setTools(normalized);
    } catch (error) {
      console.error('Error fetching pending tools:', error);
      toast({
        title: "Error",
        description: "Failed to load pending tools",
        variant: "destructive"
      });
    }
  };

// Removed edit requests fetching; handled on dedicated AdminToolRequests page
  const handleApprove = async (toolId: string) => {
    setProcessing(toolId);
    try {
      const { error } = await supabase.rpc('approve_pending_tool', {
        tool_id_param: toolId,
        admin_notes_param: adminNotes || null
      });

      if (error) throw error;

      toast({
        title: "Tool Approved",
        description: "Tool has been approved and is now published."
      });

      await fetchPendingTools();
      if (onRefresh) onRefresh();
      setSelectedTool(null);
      setAdminNotes('');
    } catch (error) {
      console.error('Error approving tool:', error);
      toast({
        title: "Error",
        description: "Failed to approve tool",
        variant: "destructive"
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (toolId: string) => {
    if (!adminNotes.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection",
        variant: "destructive"
      });
      return;
    }

    setProcessing(toolId);
    try {
      const { error } = await supabase.rpc('reject_pending_tool', {
        tool_id_param: toolId,
        admin_notes_param: adminNotes
      });

      if (error) throw error;

      toast({
        title: "Tool Rejected",
        description: "Tool has been rejected."
      });

      await fetchPendingTools();
      if (onRefresh) onRefresh();
      setSelectedTool(null);
      setAdminNotes('');
    } catch (error) {
      console.error('Error rejecting tool:', error);
      toast({
        title: "Error",
        description: "Failed to reject tool",
        variant: "destructive"
      });
    } finally {
      setProcessing(null);
    }
  };

// Removed approve/reject edit handlers; edit requests are managed on the AdminToolRequests page

  if (loading) {
    return (
      <div className="container max-w-6xl mx-auto py-8 px-6">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading pending tools...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold mb-4 text-foreground">
          Pending Tool Submissions
        </h1>
        <p className="text-xl text-muted-foreground">
          Review and manage user-submitted AI tools awaiting approval
        </p>
      </div>

      {tools.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Clock className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Pending Tools</h3>
            <p className="text-muted-foreground">
              All tool submissions have been processed.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {tools.map((tool) => (
            <Card key={tool.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {tool.name}
                      <Badge variant="outline">
                        {tool.category_name}
                      </Badge>
                      <Badge variant="secondary">
                        {tool.pricing}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Submitted by {tool.user_name} • {new Date(tool.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTool(tool)}
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
                    <p className="text-sm text-muted-foreground line-clamp-3">{tool.description}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Website</h4>
                    <a 
                      href={tool.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      {tool.website}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
                
                {tool.tags && tool.tags.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {tool.tags.map((tag, index) => (
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

{/* Edit requests section removed; see AdminToolRequests page for managing tool edits */}

          {/* Review Modal */}
      {selectedTool && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold">Review Tool Submission</h2>
              <button
                onClick={() => setSelectedTool(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Tool Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-4">Tool Information</h3>
                  <div className="space-y-4">
                    <div>
                      <Label>Tool Name</Label>
                      <p className="text-sm mt-1 font-medium">{selectedTool.name}</p>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <p className="text-sm mt-1">{selectedTool.description}</p>
                    </div>
                    <div>
                      <Label>Website</Label>
                      <a 
                        href={selectedTool.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm mt-1 text-primary hover:underline flex items-center gap-1"
                      >
                        {selectedTool.website}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <div>
                      <Label>Pricing</Label>
                      <p className="text-sm mt-1">{selectedTool.pricing}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-4">Submission Info</h3>
                  <div className="space-y-4">
                    <div>
                      <Label>Submitted by</Label>
                      <p className="text-sm mt-1 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {selectedTool.user_name}
                      </p>
                    </div>
                    <div>
                      <Label>Category</Label>
                      <p className="text-sm mt-1">{selectedTool.category_name}</p>
                    </div>
                    {selectedTool.subcategory && (
                      <div>
                        <Label>Subcategory</Label>
                        <p className="text-sm mt-1">{selectedTool.subcategory}</p>
                      </div>
                    )}
                    <div>
                      <Label>Submitted</Label>
                      <p className="text-sm mt-1">{new Date(selectedTool.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Features, Pros, Cons */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label>Features</Label>
                  <ul className="text-sm mt-1 space-y-1">
                    {selectedTool.features?.map((feature, index) => (
                      <li key={index}>• {feature}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <Label>Pros</Label>
                  <ul className="text-sm mt-1 space-y-1">
                    {selectedTool.pros?.map((pro, index) => (
                      <li key={index}>• {pro}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <Label>Cons</Label>
                  <ul className="text-sm mt-1 space-y-1">
                    {selectedTool.cons?.map((con, index) => (
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
                  onClick={() => handleApprove(selectedTool.id)}
                  disabled={processing === selectedTool.id}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Check className="h-4 w-4 mr-2" />
                  {processing === selectedTool.id ? "Processing..." : "Approve & Publish"}
                </Button>
                <Button
                  onClick={() => handleReject(selectedTool.id)}
                  disabled={processing === selectedTool.id}
                  variant="destructive"
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  {processing === selectedTool.id ? "Processing..." : "Reject"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPendingTools;