import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Flag, Bug, Clock, CheckCircle, XCircle, AlertCircle, MessageSquare, FileImage } from 'lucide-react';

interface ContentReport {
  id: string;
  content_type: string;
  content_id: string;
  reason: string;
  description: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

interface ProblemReport {
  id: string;
  subject: string;
  message: string;
  priority: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

const MyReportsTab: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [contentReports, setContentReports] = useState<ContentReport[]>([]);
  const [problemReports, setProblemReports] = useState<ProblemReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchReports();
    }
  }, [user]);

  const fetchReports = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch content reports
      const { data: contentData, error: contentError } = await supabase
        .from('reports')
        .select('*')
        .eq('reporter_id', user.id)
        .order('created_at', { ascending: false });

      if (!contentError && contentData) {
        setContentReports(contentData);
      }

      // Fetch problem reports (support tickets)
      const { data: problemData, error: problemError } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!problemError && problemData) {
        setProblemReports(problemData);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode; label: string }> = {
      pending: { variant: 'secondary', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Pending' },
      'in-progress': { variant: 'default', icon: <AlertCircle className="h-3 w-3 mr-1" />, label: 'In Progress' },
      reviewed: { variant: 'outline', icon: <AlertCircle className="h-3 w-3 mr-1" />, label: 'Reviewed' },
      resolved: { variant: 'default', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'Resolved' },
      closed: { variant: 'secondary', icon: <XCircle className="h-3 w-3 mr-1" />, label: 'Closed' },
      dismissed: { variant: 'destructive', icon: <XCircle className="h-3 w-3 mr-1" />, label: 'Dismissed' },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge variant={config.variant} className="flex items-center">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig: Record<string, { className: string; label: string }> = {
      low: { className: 'bg-muted text-muted-foreground', label: 'Low' },
      medium: { className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', label: 'Medium' },
      high: { className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200', label: 'High' },
      urgent: { className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', label: 'Urgent' },
    };

    const config = priorityConfig[priority] || priorityConfig.medium;
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const formatContentType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5" />
            {t('settings.myReports', 'My Reports')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="problems" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="problems" className="flex items-center gap-2">
                <Bug className="h-4 w-4" />
                {t('settings.problemReports', 'Problem Reports')} ({problemReports.length})
              </TabsTrigger>
              <TabsTrigger value="content" className="flex items-center gap-2">
                <Flag className="h-4 w-4" />
                {t('settings.contentReports', 'Content Reports')} ({contentReports.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="problems">
              <ScrollArea className="h-[400px]">
                {problemReports.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bug className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{t('settings.noProblemReports', 'No problem reports submitted yet')}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {problemReports.map((report) => (
                      <Card key={report.id} className="border-l-4 border-l-primary">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-foreground">{report.subject}</h4>
                            <div className="flex items-center gap-2">
                              {getPriorityBadge(report.priority)}
                              {getStatusBadge(report.status)}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {report.message}
                          </p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Submitted: {format(new Date(report.created_at), 'PPp')}</span>
                            {report.resolved_at && (
                              <span>Resolved: {format(new Date(report.resolved_at), 'PPp')}</span>
                            )}
                          </div>
                          {report.admin_notes && (
                            <div className="mt-3 p-3 bg-muted rounded-lg">
                              <div className="flex items-center gap-2 mb-1">
                                <MessageSquare className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium">Admin Response</span>
                              </div>
                              <p className="text-sm text-muted-foreground">{report.admin_notes}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="content">
              <ScrollArea className="h-[400px]">
                {contentReports.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Flag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{t('settings.noContentReports', 'No content reports submitted yet')}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {contentReports.map((report) => (
                      <Card key={report.id} className="border-l-4 border-l-orange-500">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <Badge variant="outline" className="mb-2">
                                {formatContentType(report.content_type)}
                              </Badge>
                              <h4 className="font-medium text-foreground capitalize">{report.reason.replace(/_/g, ' ')}</h4>
                            </div>
                            {getStatusBadge(report.status)}
                          </div>
                          {report.description && (
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                              {report.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Submitted: {format(new Date(report.created_at), 'PPp')}</span>
                            <span>Updated: {format(new Date(report.updated_at), 'PPp')}</span>
                          </div>
                          {report.admin_notes && (
                            <div className="mt-3 p-3 bg-muted rounded-lg">
                              <div className="flex items-center gap-2 mb-1">
                                <MessageSquare className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium">Admin Response</span>
                              </div>
                              <p className="text-sm text-muted-foreground">{report.admin_notes}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default MyReportsTab;
