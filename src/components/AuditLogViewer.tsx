import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ClipboardList, Search, User, Calendar, Database } from 'lucide-react';

interface AuditLog {
  id: string;
  admin_user_id: string;
  action: string;
  target_table: string | null;
  target_user_id: string | null;
  old_values: any;
  new_values: any;
  created_at: string;
}

const AuditLogViewer: React.FC = () => {
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('admin_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast({
        title: "Error",
        description: "Failed to load audit logs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('create') || actionLower.includes('add')) {
      return <Badge className="bg-green-500">Create</Badge>;
    }
    if (actionLower.includes('update') || actionLower.includes('edit')) {
      return <Badge className="bg-blue-500">Update</Badge>;
    }
    if (actionLower.includes('delete') || actionLower.includes('remove')) {
      return <Badge variant="destructive">Delete</Badge>;
    }
    if (actionLower.includes('ban')) {
      return <Badge variant="destructive">Ban</Badge>;
    }
    return <Badge variant="secondary">{action}</Badge>;
  };

  const uniqueActions = [...new Set(logs.map(log => log.action))];

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.target_table?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.admin_user_id.includes(searchTerm);
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Audit Log</h2>
          <p className="text-muted-foreground">Track administrative actions on the platform</p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {logs.length} Entries
        </Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by action, table, or admin ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {uniqueActions.map(action => (
                  <SelectItem key={action} value={action}>{action}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchLogs}>
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <div className="space-y-3">
        {filteredLogs.map((log) => (
          <Card key={log.id}>
            <CardContent className="py-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-full bg-muted">
                    <ClipboardList className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {getActionBadge(log.action)}
                      <span className="font-medium">{log.action}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {log.target_table && (
                        <span className="flex items-center gap-1">
                          <Database className="h-3 w-3" />
                          {log.target_table}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Admin: {log.admin_user_id.slice(0, 8)}...
                      </span>
                      {log.target_user_id && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Target: {log.target_user_id.slice(0, 8)}...
                        </span>
                      )}
                    </div>
                    {(log.old_values || log.new_values) && (
                      <details className="mt-2">
                        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                          View changes
                        </summary>
                        <div className="mt-2 p-2 bg-muted rounded text-xs font-mono overflow-x-auto">
                          {log.old_values && (
                            <div className="mb-2">
                              <span className="text-red-500">- Old:</span>
                              <pre>{JSON.stringify(log.old_values, null, 2)}</pre>
                            </div>
                          )}
                          {log.new_values && (
                            <div>
                              <span className="text-green-500">+ New:</span>
                              <pre>{JSON.stringify(log.new_values, null, 2)}</pre>
                            </div>
                          )}
                        </div>
                      </details>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground whitespace-nowrap">
                  <Calendar className="h-3 w-3" />
                  {new Date(log.created_at).toLocaleString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredLogs.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No audit log entries found
        </div>
      )}
    </div>
  );
};

export default AuditLogViewer;