import React, { useState, useEffect } from 'react';
import { Mail, Plus, Send, Calendar, Users, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Newsletter {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  status: string;
  scheduled_at: string | null;
  sent_at: string | null;
  recipient_count: number;
  created_at: string;
}

const CreatorNewsletterManager: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingNewsletter, setEditingNewsletter] = useState<Newsletter | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: ''
  });

  useEffect(() => {
    if (user) {
      fetchNewsletters();
      fetchSubscriberCount();
    }
  }, [user]);

  const fetchNewsletters = async () => {
    try {
      const { data, error } = await supabase
        .from('creator_newsletters')
        .select('*')
        .eq('creator_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNewsletters(data || []);
    } catch (error) {
      console.error('Error fetching newsletters:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriberCount = async () => {
    try {
      const { count, error } = await supabase
        .from('creator_newsletter_subscribers')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', user?.id);

      if (!error) {
        setSubscriberCount(count || 0);
      }
    } catch (error) {
      console.error('Error fetching subscriber count:', error);
    }
  };

  const handleSaveDraft = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Error",
        description: "Title and content are required.",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingNewsletter) {
        const { error } = await supabase
          .from('creator_newsletters')
          .update({
            title: formData.title,
            content: formData.content,
            excerpt: formData.excerpt || null,
            status: 'draft'
          })
          .eq('id', editingNewsletter.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('creator_newsletters')
          .insert({
            creator_id: user?.id,
            title: formData.title,
            content: formData.content,
            excerpt: formData.excerpt || null,
            status: 'draft'
          });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Newsletter saved as draft."
      });

      resetForm();
      fetchNewsletters();
    } catch (error: any) {
      console.error('Error saving newsletter:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save newsletter.",
        variant: "destructive"
      });
    }
  };

  const handleSendNewsletter = async (newsletterId?: string) => {
    const id = newsletterId || editingNewsletter?.id;
    
    if (!id && (!formData.title.trim() || !formData.content.trim())) {
      toast({
        title: "Error",
        description: "Title and content are required.",
        variant: "destructive"
      });
      return;
    }

    try {
      if (!id) {
        // Create and send new newsletter
        const { error } = await supabase
          .from('creator_newsletters')
          .insert({
            creator_id: user?.id,
            title: formData.title,
            content: formData.content,
            excerpt: formData.excerpt || null,
            status: 'sent',
            sent_at: new Date().toISOString(),
            recipient_count: subscriberCount
          });

        if (error) throw error;
      } else {
        // Send existing newsletter
        const { error } = await supabase
          .from('creator_newsletters')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            recipient_count: subscriberCount
          })
          .eq('id', id);

        if (error) throw error;
      }

      toast({
        title: "Newsletter Sent!",
        description: `Your newsletter has been sent to ${subscriberCount} subscribers.`
      });

      resetForm();
      fetchNewsletters();
    } catch (error: any) {
      console.error('Error sending newsletter:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send newsletter.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this newsletter?')) return;

    try {
      const { error } = await supabase
        .from('creator_newsletters')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Deleted",
        description: "Newsletter has been deleted."
      });

      fetchNewsletters();
    } catch (error) {
      console.error('Error deleting newsletter:', error);
      toast({
        title: "Error",
        description: "Failed to delete newsletter.",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({ title: '', content: '', excerpt: '' });
    setEditingNewsletter(null);
    setShowEditor(false);
  };

  const handleEdit = (newsletter: Newsletter) => {
    setEditingNewsletter(newsletter);
    setFormData({
      title: newsletter.title,
      content: newsletter.content,
      excerpt: newsletter.excerpt || ''
    });
    setShowEditor(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
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
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Subscribers</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              {subscriberCount}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Newsletters Sent</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Send className="h-5 w-5 text-green-500" />
              {newsletters.filter(n => n.status === 'sent').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Drafts</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Edit className="h-5 w-5 text-orange-500" />
              {newsletters.filter(n => n.status === 'draft').length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Create/Edit Newsletter */}
      {showEditor ? (
        <Card>
          <CardHeader>
            <CardTitle>{editingNewsletter ? 'Edit Newsletter' : 'Create Newsletter'}</CardTitle>
            <CardDescription>
              Compose your newsletter to send to your {subscriberCount} subscribers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Newsletter title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt (Preview text)</Label>
              <Input
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                placeholder="Brief preview shown in email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Write your newsletter content..."
                rows={12}
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button variant="secondary" onClick={handleSaveDraft}>
                Save Draft
              </Button>
              <Button onClick={() => handleSendNewsletter()}>
                <Send className="h-4 w-4 mr-2" />
                Send Now
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button onClick={() => setShowEditor(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Newsletter
        </Button>
      )}

      {/* Newsletter List */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="drafts">Drafts</TabsTrigger>
          <TabsTrigger value="sent">Sent</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {newsletters.length === 0 ? (
            <div className="text-center py-12 bg-muted/50 rounded-lg">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No newsletters yet. Create your first one!</p>
            </div>
          ) : (
            newsletters.map((newsletter) => (
              <Card key={newsletter.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{newsletter.title}</h3>
                        <Badge className={getStatusColor(newsletter.status)}>
                          {newsletter.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {newsletter.excerpt || newsletter.content.substring(0, 100)}...
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{new Date(newsletter.created_at).toLocaleDateString()}</span>
                        {newsletter.status === 'sent' && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {newsletter.recipient_count} recipients
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {newsletter.status === 'draft' && (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(newsletter)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" onClick={() => handleSendNewsletter(newsletter.id)}>
                            <Send className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(newsletter.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="drafts" className="space-y-4">
          {newsletters.filter(n => n.status === 'draft').map((newsletter) => (
            <Card key={newsletter.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{newsletter.title}</h3>
                    <p className="text-sm text-muted-foreground">{new Date(newsletter.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(newsletter)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" onClick={() => handleSendNewsletter(newsletter.id)}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="sent" className="space-y-4">
          {newsletters.filter(n => n.status === 'sent').map((newsletter) => (
            <Card key={newsletter.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{newsletter.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      Sent {new Date(newsletter.sent_at!).toLocaleDateString()} • {newsletter.recipient_count} recipients
                    </p>
                  </div>
                  <Button size="sm" variant="ghost">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CreatorNewsletterManager;
