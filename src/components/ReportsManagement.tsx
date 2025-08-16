import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Flag, 
  CheckCircle, 
  XCircle, 
  Eye,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { hasPermission, PERMISSIONS } from '@/utils/permissions';

interface Report {
  id: string;
  reporter_id: string;
  content_type: string;
  content_id: string;
  reason: string;
  description: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
  admin_notes: string | null;
  created_at: string;
  reporter?: {
    full_name: string;
  };
}

const ReportsManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [canApproveReports, setCanApproveReports] = useState(false);

  useEffect(() => {
    checkPermissions();
    fetchReports();
  }, [user]);

  const checkPermissions = async () => {
    if (!user) return;
    
    const canApprove = await hasPermission(user.id, PERMISSIONS.APPROVE_REPORTS);
    setCanApproveReports(canApprove);
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      
      const { data: reportsData, error: reportsError } = await supabase
        .from('reports')
        .select(`
          *,
          reporter:user_profiles!reports_reporter_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false });
      
      if (reportsError) throw reportsError;
      
      // Map the data to our Report interface
      const mappedReports: Report[] = (reportsData || []).map(report => ({
        id: report.id,
        reporter_id: report.reporter_id,
        content_type: report.content_type,
        content_id: report.content_id,
        reason: report.reason,
        description: report.description,
        status: report.status as 'pending' | 'approved' | 'rejected',
        reviewed_by: report.reviewed_by,
        reviewed_at: report.reviewed_at,
        admin_notes: report.admin_notes,
        created_at: report.created_at,
        reporter: Array.isArray(report.reporter) ? report.reporter[0] : report.reporter,
      }));
      
      setReports(mappedReports);
      
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: "Error",
        description: "Failed to fetch reports data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReportAction = async (reportId: string, action: 'approved' | 'rejected') => {
    if (!canApproveReports) {
      toast({
        title: "Error",
        description: "You don't have permission to approve reports.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('reports')
        .update({
          status: action,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes || null,
        })
        .eq('id', reportId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Report ${action} successfully.`,
      });

      setSelectedReport(null);
      setAdminNotes('');
      fetchReports();
    } catch (error) {
      console.error('Error updating report:', error);
      toast({
        title: "Error",
        description: "Failed to update report.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getContentTypeIcon = (contentType: string) => {
    switch (contentType) {
      case 'post':
        return '📝';
      case 'comment':
        return '💬';
      case 'tool':
        return '🛠️';
      case 'user':
        return '👤';
      default:
        return '📄';
    }
  };

  if (!canApproveReports) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Flag className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>You don't have permission to manage reports.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  const pendingReports = reports.filter(r => r.status === 'pending');
  const reviewedReports = reports.filter(r => r.status !== 'pending');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Reports Management</h2>
        <p className="text-muted-foreground">
          Review and approve content reports from users
        </p>
      </div>

      {/* Pending Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Pending Reports ({pendingReports.length})
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingReports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No pending reports! All caught up.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Content</TableHead>
                  <TableHead>Reporter</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getContentTypeIcon(report.content_type)}</span>
                        <div>
                          <div className="font-medium capitalize">
                            {report.content_type}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ID: {report.content_id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {report.reporter?.full_name || 'Deleted User'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <div className="font-medium">{report.reason}</div>
                        {report.description && (
                          <div className="text-sm text-muted-foreground truncate">
                            {report.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(report.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedReport(report);
                          setAdminNotes('');
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Reviewed Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5" />
            Reviewed Reports ({reviewedReports.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reviewedReports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No reviewed reports yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Content</TableHead>
                  <TableHead>Reporter</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reviewed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviewedReports.slice(0, 10).map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getContentTypeIcon(report.content_type)}</span>
                        <div>
                          <div className="font-medium capitalize">
                            {report.content_type}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ID: {report.content_id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {report.reporter?.full_name || 'Deleted User'}
                    </TableCell>
                    <TableCell>{report.reason}</TableCell>
                    <TableCell>{getStatusBadge(report.status)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {report.reviewed_at && new Date(report.reviewed_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Review Report Modal */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Report</DialogTitle>
          </DialogHeader>
          
          {selectedReport && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Content Type</Label>
                  <div className="text-sm capitalize">
                    {getContentTypeIcon(selectedReport.content_type)} {selectedReport.content_type}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Content ID</Label>
                  <div className="text-sm font-mono">
                    {selectedReport.content_id}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Reporter</Label>
                  <div className="text-sm">
                    {selectedReport.reporter?.full_name || 'Deleted User'}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Reported Date</Label>
                  <div className="text-sm">
                    {new Date(selectedReport.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Reason</Label>
                <div className="text-sm mt-1 p-3 bg-muted rounded-md">
                  {selectedReport.reason}
                </div>
              </div>
              
              {selectedReport.description && (
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <div className="text-sm mt-1 p-3 bg-muted rounded-md">
                    {selectedReport.description}
                  </div>
                </div>
              )}
              
              <div>
                <Label htmlFor="admin-notes">Admin Notes (Optional)</Label>
                <Textarea
                  id="admin-notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about your decision..."
                  className="mt-1"
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedReport(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleReportAction(selectedReport.id, 'rejected')}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleReportAction(selectedReport.id, 'approved')}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReportsManagement;