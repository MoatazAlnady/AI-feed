import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Check, 
  X, 
  Clock, 
  Eye, 
  User, 
  ExternalLink, 
  Edit, 
  ChevronLeft, 
  ChevronRight,
  CheckSquare,
  Square,
  Trash2
} from 'lucide-react';

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

interface AdminPendingToolsEnhancedProps {
  onRefresh?: () => void;
}

const AdminPendingToolsEnhanced: React.FC<AdminPendingToolsEnhancedProps> = ({ onRefresh }) => {
  const { toast } = useToast();
  const [tools, setTools] = useState<PendingTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<PendingTool | null>(null);
  const [selectedToolIndex, setSelectedToolIndex] = useState<number>(-1);
  const [adminNotes, setAdminNotes] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editedTool, setEditedTool] = useState<PendingTool | null>(null);
  const [selectedTools, setSelectedTools] = useState<Set<string>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchPendingTools().finally(() => setLoading(false));
  }, []);

  const fetchPendingTools = async () => {
    try {
      console.log('Fetching pending tools...');
      const { data, error } = await supabase.rpc('get_pending_tools', {
        limit_param: 50,
        offset_param: 0
      });

      console.log('RPC get_pending_tools response:', { data, error });

      if (error) {
        console.warn('RPC error, trying direct query:', error);
        throw error;
      }

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

      console.log('Normalized RPC data:', normalized);

      // Fallback: directly read pending tools in case RPC returns empty
      if (normalized.length === 0) {
        console.log('No data from RPC, trying direct query...');
        const { data: fallback, error: fbErr } = await supabase
          .from('tools')
          .select('id, name, description, category_id, subcategory, website, pricing, features, pros, cons, tags, user_id, created_at, status')
          .eq('status', 'pending')
          .order('created_at', { ascending: false });
          
        console.log('Direct query result:', { fallback, fbErr });
        
        if (!fbErr && fallback) {
          normalized = fallback.map((t: any) => ({
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
          console.log('Fallback normalized data:', normalized);
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
      setEditMode(false);
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
      setEditMode(false);
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

  const handleEdit = (tool: PendingTool) => {
    setEditMode(true);
    setEditedTool({ ...tool });
  };

  const handleSaveEdit = async () => {
    if (!editedTool) return;

    setProcessing(editedTool.id);
    try {
      const { error } = await supabase
        .from('tools')
        .update({
          name: editedTool.name,
          description: editedTool.description,
          website: editedTool.website,
          pricing: editedTool.pricing,
          subcategory: editedTool.subcategory,
          features: editedTool.features,
          pros: editedTool.pros,
          cons: editedTool.cons,
          tags: editedTool.tags,
          updated_at: new Date().toISOString()
        })
        .eq('id', editedTool.id);

      if (error) throw error;

      toast({
        title: "Tool Updated",
        description: "Tool details have been updated successfully."
      });

      await fetchPendingTools();
      setEditMode(false);
      setEditedTool(null);
      
      // Update selectedTool if it's the same tool
      if (selectedTool?.id === editedTool.id) {
        setSelectedTool(editedTool);
      }
    } catch (error) {
      console.error('Error updating tool:', error);
      toast({
        title: "Error",
        description: "Failed to update tool",
        variant: "destructive"
      });
    } finally {
      setProcessing(null);
    }
  };

  const navigateTool = (direction: 'prev' | 'next') => {
    const currentIndex = selectedToolIndex;
    let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    
    if (newIndex >= 0 && newIndex < tools.length) {
      setSelectedToolIndex(newIndex);
      setSelectedTool(tools[newIndex]);
      setAdminNotes('');
      setEditMode(false);
      setEditedTool(null);
    }
  };

  const selectTool = (tool: PendingTool, index: number) => {
    setSelectedTool(tool);
    setSelectedToolIndex(index);
    setEditMode(false);
    setEditedTool(null);
    setAdminNotes('');
  };

  const toggleToolSelection = (toolId: string) => {
    const newSelected = new Set(selectedTools);
    if (newSelected.has(toolId)) {
      newSelected.delete(toolId);
    } else {
      newSelected.add(toolId);
    }
    setSelectedTools(newSelected);
  };

  const selectAllTools = () => {
    if (selectedTools.size === tools.length) {
      setSelectedTools(new Set());
    } else {
      setSelectedTools(new Set(tools.map(t => t.id)));
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject') => {
    if (selectedTools.size === 0) {
      toast({
        title: "No Selection",
        description: "Please select at least one tool",
        variant: "destructive"
      });
      return;
    }

    if (action === 'reject' && !adminNotes.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection",
        variant: "destructive"
      });
      return;
    }

    setBulkProcessing(true);
    try {
      const promises = Array.from(selectedTools).map(toolId => {
        if (action === 'approve') {
          return supabase.rpc('approve_pending_tool', {
            tool_id_param: toolId,
            admin_notes_param: adminNotes || null
          });
        } else {
          return supabase.rpc('reject_pending_tool', {
            tool_id_param: toolId,
            admin_notes_param: adminNotes
          });
        }
      });

      const results = await Promise.all(promises);
      const errors = results.filter(r => r.error);

      if (errors.length > 0) {
        toast({
          title: "Partial Success",
          description: `${selectedTools.size - errors.length} tools processed successfully, ${errors.length} failed`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Bulk Action Complete",
          description: `${selectedTools.size} tools ${action === 'approve' ? 'approved' : 'rejected'} successfully`
        });
      }

      await fetchPendingTools();
      setSelectedTools(new Set());
      setAdminNotes('');
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error with bulk action:', error);
      toast({
        title: "Error",
        description: "Failed to complete bulk action",
        variant: "destructive"
      });
    } finally {
      setBulkProcessing(false);
    }
  };

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
          {/* Bulk Actions */}
          {selectedTools.size > 0 && (
            <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">
                      {selectedTools.size} tool{selectedTools.size > 1 ? 's' : ''} selected
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedTools(new Set())}
                    >
                      Clear Selection
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleBulkAction('approve')}
                      disabled={bulkProcessing}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve Selected
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleBulkAction('reject')}
                      disabled={bulkProcessing}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject Selected
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tools List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Tool Submissions ({tools.length})</CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={selectAllTools}
                >
                  {selectedTools.size === tools.length ? (
                    <>
                      <Square className="h-4 w-4 mr-1" />
                      Deselect All
                    </>
                  ) : (
                    <>
                      <CheckSquare className="h-4 w-4 mr-1" />
                      Select All
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tools.map((tool, index) => (
                  <div key={tool.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50">
                    <Checkbox
                      checked={selectedTools.has(tool.id)}
                      onCheckedChange={() => toggleToolSelection(tool.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground">{tool.name}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">{tool.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline">{tool.category_name}</Badge>
                            <Badge variant="secondary">{tool.pricing}</Badge>
                            <span className="text-xs text-muted-foreground">
                              by {tool.user_name} • {new Date(tool.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => selectTool(tool, index)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Review Modal */}
      {selectedTool && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold">
                  {editMode ? 'Edit Tool Submission' : 'Review Tool Submission'}
                </h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{selectedToolIndex + 1} of {tools.length}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateTool('prev')}
                  disabled={selectedToolIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateTool('next')}
                  disabled={selectedToolIndex === tools.length - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(selectedTool)}
                  disabled={editMode}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <button
                  onClick={() => {
                    setSelectedTool(null);
                    setEditMode(false);
                    setEditedTool(null);
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {editMode && editedTool ? (
                /* Edit Mode */
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label>Tool Name</Label>
                      <Input
                        value={editedTool.name}
                        onChange={(e) => setEditedTool({...editedTool, name: e.target.value})}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Website</Label>
                      <Input
                        value={editedTool.website}
                        onChange={(e) => setEditedTool({...editedTool, website: e.target.value})}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={editedTool.description}
                      onChange={(e) => setEditedTool({...editedTool, description: e.target.value})}
                      rows={3}
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label>Pricing</Label>
                      <Select
                        value={editedTool.pricing}
                        onValueChange={(value) => setEditedTool({...editedTool, pricing: value})}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="freemium">Freemium</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="subscription">Subscription</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Subcategory</Label>
                      <Input
                        value={editedTool.subcategory}
                        onChange={(e) => setEditedTool({...editedTool, subcategory: e.target.value})}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Tags (comma separated)</Label>
                    <Input
                      value={editedTool.tags.join(', ')}
                      onChange={(e) => setEditedTool({...editedTool, tags: e.target.value.split(',').map(t => t.trim())})}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Features (comma separated)</Label>
                    <Textarea
                      value={editedTool.features.join(', ')}
                      onChange={(e) => setEditedTool({...editedTool, features: e.target.value.split(',').map(f => f.trim())})}
                      rows={2}
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label>Pros (comma separated)</Label>
                      <Textarea
                        value={editedTool.pros.join(', ')}
                        onChange={(e) => setEditedTool({...editedTool, pros: e.target.value.split(',').map(p => p.trim())})}
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Cons (comma separated)</Label>
                      <Textarea
                        value={editedTool.cons.join(', ')}
                        onChange={(e) => setEditedTool({...editedTool, cons: e.target.value.split(',').map(c => c.trim())})}
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleSaveEdit}
                      disabled={processing === editedTool.id}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditMode(false);
                        setEditedTool(null);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <>
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

                  {selectedTool.tags && selectedTool.tags.length > 0 && (
                    <div>
                      <Label>Tags</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedTool.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

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
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPendingToolsEnhanced;