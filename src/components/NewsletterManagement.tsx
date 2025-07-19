import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { 
  Mail, 
  Plus, 
  Send, 
  Calendar, 
  Users, 
  Eye, 
  Edit, 
  Trash2, 
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  Image as ImageIcon,
  Save,
  Upload
} from 'lucide-react';

interface NewsletterContent {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  featured_image_url?: string;
  status: string;
  scheduled_at?: string;
  sent_at?: string;
  recipient_count: number;
  open_count: number;
  click_count: number;
  created_at: string;
  updated_at: string;
}

interface NewsletterStats {
  total_sent: number;
  total_subscribers: number;
  avg_open_rate: number;
  avg_click_rate: number;
}

const NewsletterManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newsletters, setNewsletters] = useState<NewsletterContent[]>([]);
  const [stats, setStats] = useState<NewsletterStats>({
    total_sent: 0,
    total_subscribers: 0,
    avg_open_rate: 0,
    avg_click_rate: 0
  });
  const [loading, setLoading] = useState(true);
  const [editingNewsletter, setEditingNewsletter] = useState<NewsletterContent | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    featured_image_url: '',
    status: 'draft',
    scheduled_at: ''
  });

  useEffect(() => {
    fetchNewsletters();
    fetchStats();
  }, []);

  const fetchNewsletters = async () => {
    try {
      const { data, error } = await supabase
        .from('newsletter_content')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNewsletters(data || []);
    } catch (error) {
      console.error('Error fetching newsletters:', error);
      toast({
        title: "Error",
        description: "Failed to load newsletters",
        variant: "destructive"
      });
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Get total subscribers
      const { count: subscriberCount } = await supabase
        .from('user_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('newsletter_subscription', true);

      // Get newsletter stats
      const { data: newsletterData } = await supabase
        .from('newsletter_content')
        .select('recipient_count, open_count, click_count')
        .eq('status', 'sent');

      const totalSent = newsletterData?.reduce((sum, n) => sum + n.recipient_count, 0) || 0;
      const totalOpens = newsletterData?.reduce((sum, n) => sum + n.open_count, 0) || 0;
      const totalClicks = newsletterData?.reduce((sum, n) => sum + n.click_count, 0) || 0;

      setStats({
        total_sent: totalSent,
        total_subscribers: subscriberCount || 0,
        avg_open_rate: totalSent > 0 ? Math.round((totalOpens / totalSent) * 100) : 0,
        avg_click_rate: totalOpens > 0 ? Math.round((totalClicks / totalOpens) * 100) : 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      featured_image_url: '',
      status: 'draft',
      scheduled_at: ''
    });
    setEditingNewsletter(null);
    setIsCreating(false);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Validation Error",
        description: "Title and content are required",
        variant: "destructive"
      });
      return;
    }

    try {
      const saveData = {
        ...formData,
        created_by: user?.id,
        scheduled_at: formData.scheduled_at || null
      };

      if (editingNewsletter) {
        const { error } = await supabase
          .from('newsletter_content')
          .update(saveData)
          .eq('id', editingNewsletter.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Newsletter updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('newsletter_content')
          .insert(saveData);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Newsletter created successfully",
        });
      }

      await fetchNewsletters();
      resetForm();
    } catch (error) {
      console.error('Error saving newsletter:', error);
      toast({
        title: "Error",
        description: "Failed to save newsletter",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (newsletter: NewsletterContent) => {
    setEditingNewsletter(newsletter);
    setFormData({
      title: newsletter.title,
      content: newsletter.content,
      excerpt: newsletter.excerpt || '',
      featured_image_url: newsletter.featured_image_url || '',
      status: newsletter.status,
      scheduled_at: newsletter.scheduled_at ? new Date(newsletter.scheduled_at).toISOString().slice(0, 16) : ''
    });
    setIsCreating(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('newsletter_content')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchNewsletters();
      toast({
        title: "Success",
        description: "Newsletter deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting newsletter:', error);
      toast({
        title: "Error",
        description: "Failed to delete newsletter",
        variant: "destructive"
      });
    }
  };

  const handleSendNow = async (id: string) => {
    try {
      // Update status to sent and set sent_at timestamp
      const { error } = await supabase
        .from('newsletter_content')
        .update({ 
          status: 'sent', 
          sent_at: new Date().toISOString(),
          recipient_count: stats.total_subscribers
        })
        .eq('id', id);

      if (error) throw error;

      await fetchNewsletters();
      await fetchStats();
      
      toast({
        title: "Success",
        description: "Newsletter sent successfully",
      });
    } catch (error) {
      console.error('Error sending newsletter:', error);
      toast({
        title: "Error",
        description: "Failed to send newsletter",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Edit className="h-4 w-4" />;
      case 'scheduled': return <Clock className="h-4 w-4" />;
      case 'sent': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'scheduled': return 'default';
      case 'sent': return 'default';
      default: return 'secondary';
    }
  };

  if (loading && newsletters.length === 0) {
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
          <h2 className="text-2xl font-bold">Newsletter Management</h2>
          <p className="text-muted-foreground">Create and manage newsletter campaigns</p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="bg-gradient-primary text-white hover:shadow-lg">
          <Plus className="h-4 w-4 mr-2" />
          Create Newsletter
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="newsletters">Newsletters</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_subscribers}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Newsletters Sent</CardTitle>
                <Send className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_sent}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Open Rate</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.avg_open_rate}%</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Click Rate</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.avg_click_rate}%</div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Newsletters */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Newsletters</CardTitle>
              <CardDescription>Your latest newsletter campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {newsletters.slice(0, 5).map(newsletter => (
                  <div key={newsletter.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(newsletter.status)}
                        <Badge variant={getStatusColor(newsletter.status)}>
                          {newsletter.status}
                        </Badge>
                      </div>
                      <div>
                        <h4 className="font-medium">{newsletter.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {newsletter.status === 'sent' 
                            ? `Sent to ${newsletter.recipient_count} subscribers`
                            : newsletter.status === 'scheduled'
                            ? `Scheduled for ${new Date(newsletter.scheduled_at!).toLocaleDateString()}`
                            : 'Draft'
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(newsletter)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="newsletters" className="space-y-6">
          {/* Newsletter List */}
          <div className="grid gap-6">
            {newsletters.map(newsletter => (
              <Card key={newsletter.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {newsletter.title}
                          <Badge variant={getStatusColor(newsletter.status)}>
                            {newsletter.status}
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          {newsletter.excerpt || 'No excerpt available'}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {newsletter.status === 'draft' && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm">
                              <Send className="h-4 w-4 mr-1" />
                              Send Now
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Send Newsletter</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will send the newsletter to all {stats.total_subscribers} subscribers immediately. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleSendNow(newsletter.id)}>
                                Send Now
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      <Button size="sm" variant="outline" onClick={() => handleEdit(newsletter)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Newsletter</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this newsletter? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(newsletter.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Recipients:</span>
                      <span className="ml-2">{newsletter.recipient_count}</span>
                    </div>
                    <div>
                      <span className="font-medium">Opens:</span>
                      <span className="ml-2">{newsletter.open_count}</span>
                    </div>
                    <div>
                      <span className="font-medium">Clicks:</span>
                      <span className="ml-2">{newsletter.click_count}</span>
                    </div>
                    <div>
                      <span className="font-medium">Created:</span>
                      <span className="ml-2">{new Date(newsletter.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
              <CardDescription>Detailed analytics for your newsletter campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Detailed analytics charts will be available as you send more newsletters
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Newsletter Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {editingNewsletter ? 'Edit Newsletter' : 'Create Newsletter'}
              </CardTitle>
              <CardDescription>
                {editingNewsletter ? 'Update your newsletter content' : 'Create a new newsletter campaign'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Newsletter title"
                />
              </div>

              <div>
                <Label htmlFor="excerpt">Excerpt</Label>
                <Input
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Brief description"
                />
              </div>

              <div>
                <Label htmlFor="featured_image">Featured Image URL</Label>
                <Input
                  id="featured_image"
                  value={formData.featured_image_url}
                  onChange={(e) => setFormData({ ...formData, featured_image_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Newsletter content..."
                  rows={10}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.status === 'scheduled' && (
                  <div>
                    <Label htmlFor="scheduled_at">Scheduled Date</Label>
                    <Input
                      id="scheduled_at"
                      type="datetime-local"
                      value={formData.scheduled_at}
                      onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  {editingNewsletter ? 'Update' : 'Create'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default NewsletterManagement;