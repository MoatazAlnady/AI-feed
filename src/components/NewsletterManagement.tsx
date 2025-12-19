import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  Mail, 
  Search, 
  Filter, 
  Eye, 
  Send, 
  Calendar, 
  Plus, 
  Trash2,
  Download,
  Settings,
  GripVertical
} from 'lucide-react';

interface Subscriber {
  id: string;
  email: string;
  user_id?: string | null;
  frequency: 'daily' | 'weekly' | 'monthly';
  created_at: string | null;
  user_profiles?: {
    full_name: string;
  } | null;
  interests: Interest[];
}

interface Interest {
  id: string;
  name: string;
  slug: string;
}

interface ContentItem {
  id: string;
  title: string;
  description?: string;
  website?: string;
  created_at: string;
  type: 'tool' | 'article' | 'job' | 'event' | 'post';
}

interface IssueItem {
  id: string;
  content_type: string;
  content_id: string;
  title_snapshot: string;
  url_snapshot: string;
  blurb_snapshot: string;
  sort_order: number;
}

interface NewsletterIssue {
  id: string;
  title: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  status: 'draft' | 'scheduled' | 'sent';
  subject?: string | null;
  intro_text?: string | null;
  outro_text?: string | null;
  scheduled_for?: string | null;
  created_at: string | null;
}

const NewsletterManagement: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('subscribers');
  
  // Subscribers tab state
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [selectedSubscribers, setSelectedSubscribers] = useState<Set<string>>(new Set());
  const [subscriberFilters, setSubscriberFilters] = useState({
    frequencies: [] as string[],
    interests: [] as string[],
    search: ''
  });
  
  // Composer tab state
  const [currentIssue, setCurrentIssue] = useState<NewsletterIssue | null>(null);
  const [issueItems, setIssueItems] = useState<IssueItem[]>([]);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [selectedContentType, setSelectedContentType] = useState<'tool' | 'article' | 'job' | 'event' | 'post'>('tool');
  const [contentSearch, setContentSearch] = useState('');
  const [interests, setInterests] = useState<Interest[]>([]);
  const [recipientCount, setRecipientCount] = useState(0);

  useEffect(() => {
    fetchSubscribers();
    fetchInterests();
    createOrGetDraftIssue();
  }, []);

  useEffect(() => {
    fetchFilteredSubscribers();
  }, [subscriberFilters]);

  useEffect(() => {
    if (currentIssue) {
      fetchIssueItems();
      fetchRecipientCount();
    }
  }, [currentIssue]);

  useEffect(() => {
    fetchContentItems();
  }, [selectedContentType, contentSearch]);

  const fetchSubscribers = async () => {
    try {
      const { data: subscribersData, error } = await supabase
        .from('newsletter_subscribers')
        .select(`
          *,
          newsletter_subscriber_interests(
            interests(id, name, slug)
          )
        `);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to fetch subscribers",
          variant: "destructive"
        });
        return;
      }

      const transformedSubscribers = subscribersData?.map(sub => ({
        id: sub.id,
        email: sub.email,
        user_id: sub.user_id,
        frequency: sub.frequency as 'daily' | 'weekly' | 'monthly',
        created_at: sub.created_at,
        user_profiles: null,
        interests: sub.newsletter_subscriber_interests?.map((ni: any) => ni.interests).flat().filter(Boolean) || []
      })) || [];

      setSubscribers(transformedSubscribers);
    } catch (error) {
      console.error('Error fetching subscribers:', error);
    }
  };

  const fetchFilteredSubscribers = async () => {
    try {
      let query = supabase
        .from('newsletter_subscribers')
        .select(`
          *,
          newsletter_subscriber_interests(
            interests(id, name, slug)
          )
        `);

      if (subscriberFilters.frequencies.length > 0) {
        query = query.in('frequency', subscriberFilters.frequencies);
      }

      if (subscriberFilters.search) {
        query = query.ilike('email', `%${subscriberFilters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      let filteredData = data || [];

      // Filter by interests if specified
      if (subscriberFilters.interests.length > 0) {
        filteredData = filteredData.filter(sub => 
          sub.newsletter_subscriber_interests?.some((ni: any) => 
            subscriberFilters.interests.includes(ni.interests?.id)
          )
        );
      }

      const formattedSubscribers = filteredData.map(sub => ({
        id: sub.id,
        email: sub.email,
        user_id: sub.user_id,
        frequency: sub.frequency as 'daily' | 'weekly' | 'monthly',
        created_at: sub.created_at,
        user_profiles: null,
        interests: sub.newsletter_subscriber_interests?.map((ni: any) => ni.interests).flat().filter(Boolean) || []
      }));

      setSubscribers(formattedSubscribers);
    } catch (error) {
      console.error('Error fetching filtered subscribers:', error);
    }
  };

  const fetchInterests = async () => {
    try {
      const { data, error } = await supabase
        .from('interests')
        .select('*')
        .order('name');

      if (error) throw error;
      setInterests(data || []);
    } catch (error) {
      console.error('Error fetching interests:', error);
    }
  };

  const createOrGetDraftIssue = async () => {
    try {
      // Check for existing draft issue
      const { data: existingDraft, error: draftError } = await supabase
        .from('newsletter_issues')
        .select('*')
        .eq('status', 'draft')
        .order('created_at', { ascending: false })
        .limit(1);

      if (draftError) throw draftError;

      if (existingDraft && existingDraft.length > 0) {
        const draft = existingDraft[0];
        setCurrentIssue({
          id: draft.id,
          title: draft.title,
          frequency: draft.frequency as 'daily' | 'weekly' | 'monthly',
          status: (draft.status as 'draft' | 'scheduled' | 'sent') || 'draft',
          subject: draft.subject,
          intro_text: draft.intro_text,
          outro_text: draft.outro_text,
          scheduled_for: draft.scheduled_for,
          created_at: draft.created_at
        });
        return;
      }

      // Create new draft issue
      const { data, error } = await supabase
        .from('newsletter_issues')
        .insert({
          title: 'New Newsletter Issue',
          frequency: 'weekly',
          status: 'draft'
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setCurrentIssue({
          id: data.id,
          title: data.title,
          frequency: data.frequency as 'daily' | 'weekly' | 'monthly',
          status: (data.status as 'draft' | 'scheduled' | 'sent') || 'draft',
          subject: data.subject,
          intro_text: data.intro_text,
          outro_text: data.outro_text,
          scheduled_for: data.scheduled_for,
          created_at: data.created_at
        });
      }
    } catch (error) {
      console.error('Error creating/getting draft issue:', error);
    }
  };

  const fetchIssueItems = async () => {
    if (!currentIssue) return;

    try {
      const { data, error } = await supabase
        .from('newsletter_issue_items')
        .select('*')
        .eq('issue_id', currentIssue.id)
        .order('sort_order');

      if (error) throw error;
      setIssueItems(data || []);
    } catch (error) {
      console.error('Error fetching issue items:', error);
    }
  };

  const fetchRecipientCount = async () => {
    if (!currentIssue) return;

    try {
      const { count, error } = await supabase
        .from('newsletter_issue_recipients')
        .select('*', { count: 'exact', head: true })
        .eq('issue_id', currentIssue.id);

      if (error) throw error;
      setRecipientCount(count || 0);
    } catch (error) {
      console.error('Error fetching recipient count:', error);
    }
  };

  const updateCurrentIssue = (updates: Partial<NewsletterIssue>) => {
    setCurrentIssue(prev => prev ? ({
      ...prev,
      ...updates
    }) : null);
  };

  const fetchContentItems = async () => {
    try {
      let data: any[] = [];
      
      if (selectedContentType === 'tool') {
        const { data: toolsData, error } = await supabase
          .from('tools')
          .select('id, name, description, website, created_at')
          .eq('status', 'published')
          .ilike('name', `%${contentSearch}%`)
          .limit(20);
        
        if (error) throw error;
        data = toolsData?.map(item => ({
          id: item.id,
          title: item.name,
          description: item.description?.slice(0, 160) || '',
          website: item.website || '',
          created_at: item.created_at,
          type: 'tool' as const
        })) || [];
      } else if (selectedContentType === 'article') {
        const { data: articlesData, error } = await supabase
          .from('articles')
          .select('id, title, excerpt, created_at')
          .eq('status', 'published')
          .ilike('title', `%${contentSearch}%`)
          .limit(20);
        
        if (error) throw error;
        data = articlesData?.map(item => ({
          id: item.id,
          title: item.title,
          description: item.excerpt?.slice(0, 160) || '',
          website: '',
          created_at: item.created_at,
          type: 'article' as const
        })) || [];
      } else if (selectedContentType === 'post') {
        const { data: postsData, error } = await supabase
          .from('posts')
          .select('id, content, created_at')
          .ilike('content', `%${contentSearch}%`)
          .limit(20);
        
        if (error) throw error;
        data = postsData?.map(item => ({
          id: item.id,
          title: 'Post',
          description: item.content?.slice(0, 160) || '',
          website: '',
          created_at: item.created_at,
          type: 'post' as const
        })) || [];
      }

      setContentItems(data);
    } catch (error) {
      console.error('Error fetching content items:', error);
    }
  };

  const addItemToIssue = async (item: ContentItem, type: string) => {
    if (!currentIssue) return;

    try {
      const newItem = {
        issue_id: currentIssue.id,
        content_type: type,
        content_id: item.id,
        title_snapshot: item.title,
        url_snapshot: item.website || '',
        blurb_snapshot: item.description?.slice(0, 160) || '',
        sort_order: issueItems.length
      };

      const { error } = await supabase
        .from('newsletter_issue_items')
        .insert(newItem);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Item added to newsletter issue"
      });

      fetchIssueItems();
    } catch (error) {
      console.error('Error adding item to issue:', error);
      toast({
        title: "Error",
        description: "Failed to add item to issue",
        variant: "destructive"
      });
    }
  };

  const addSubscribersToIssue = async () => {
    if (!currentIssue || selectedSubscribers.size === 0) return;

    try {
      const recipients = Array.from(selectedSubscribers).map(subscriberId => ({
        issue_id: currentIssue.id,
        subscriber_id: subscriberId
      }));

      const { error } = await supabase
        .from('newsletter_issue_recipients')
        .upsert(recipients, { 
          onConflict: 'issue_id,subscriber_id',
          ignoreDuplicates: true 
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Added ${selectedSubscribers.size} subscribers to issue recipients`
      });

      fetchRecipientCount();
      setSelectedSubscribers(new Set());
    } catch (error) {
      console.error('Error adding subscribers to issue:', error);
      toast({
        title: "Error",
        description: "Failed to add subscribers to issue",
        variant: "destructive"
      });
    }
  };

  const saveIssue = async () => {
    if (!currentIssue) return;

    try {
      const { data, error } = await supabase
        .from('newsletter_issues')
        .update({
          title: currentIssue.title,
          frequency: currentIssue.frequency,
          subject: currentIssue.subject,
          intro_text: currentIssue.intro_text,
          outro_text: currentIssue.outro_text
        })
        .eq('id', currentIssue.id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setCurrentIssue({
          id: data.id,
          title: data.title,
          frequency: data.frequency as 'daily' | 'weekly' | 'monthly',
          status: (data.status as 'draft' | 'scheduled' | 'sent') || 'draft',
          subject: data.subject,
          intro_text: data.intro_text,
          outro_text: data.outro_text,
          scheduled_for: data.scheduled_for,
          created_at: data.created_at
        });
        
        toast({
          title: "Success",
          description: "Newsletter issue saved"
        });
      }
    } catch (error) {
      console.error('Error saving issue:', error);
      toast({
        title: "Error",
        description: "Failed to save issue",
        variant: "destructive"
      });
    }
  };

  const [isSending, setIsSending] = useState(false);

  const sendNewsletter = async () => {
    if (!currentIssue || recipientCount === 0) return;

    setIsSending(true);
    try {
      // First save the issue
      await saveIssue();

      // Call the edge function to send the newsletter
      const { error } = await supabase.functions.invoke('send-newsletter', {
        body: { issueId: currentIssue.id }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Newsletter sent to ${recipientCount} recipients`
      });

      // Update issue status locally
      setCurrentIssue(prev => prev ? { ...prev, status: 'sent' } : null);
      
      // Create a new draft issue for next time
      createOrGetDraftIssue();
    } catch (error) {
      console.error('Error sending newsletter:', error);
      toast({
        title: "Error",
        description: "Failed to send newsletter",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const previewNewsletter = () => {
    if (!currentIssue) return;
    
    // Open preview in new tab
    const previewContent = `
      <html>
        <head>
          <title>Newsletter Preview: ${currentIssue.title}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
            .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px 20px; }
            .item { background: #f9fafb; border-radius: 8px; padding: 15px; margin-bottom: 15px; }
            .badge { display: inline-block; background: #e0e7ff; color: #4f46e5; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${currentIssue.title}</h1>
            <p>Preview Mode</p>
          </div>
          <div class="content">
            ${currentIssue.intro_text ? `<p>${currentIssue.intro_text}</p>` : ''}
            ${issueItems.map(item => `
              <div class="item">
                <span class="badge">${item.content_type}</span>
                <h3>${item.title_snapshot}</h3>
                <p>${item.blurb_snapshot}</p>
              </div>
            `).join('')}
            ${currentIssue.outro_text ? `<p>${currentIssue.outro_text}</p>` : ''}
          </div>
        </body>
      </html>
    `;
    
    const blob = new Blob([previewContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const toggleSubscriberSelection = (subscriberId: string) => {
    const newSelection = new Set(selectedSubscribers);
    if (newSelection.has(subscriberId)) {
      newSelection.delete(subscriberId);
    } else {
      newSelection.add(subscriberId);
    }
    setSelectedSubscribers(newSelection);
  };

  const selectAllSubscribers = () => {
    setSelectedSubscribers(new Set(subscribers.map(s => s.id)));
  };

  const clearSelection = () => {
    setSelectedSubscribers(new Set());
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Newsletter Management
          </CardTitle>
          <CardDescription>
            Manage newsletter subscribers and compose issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="subscribers" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Subscribers
              </TabsTrigger>
              <TabsTrigger value="composer" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Composer
              </TabsTrigger>
            </TabsList>

            <TabsContent value="subscribers" className="space-y-4">
              {/* Filters */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Search</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by email or name..."
                          value={subscriberFilters.search}
                          onChange={(e) => setSubscriberFilters(prev => ({ ...prev, search: e.target.value }))}
                          className="pl-9"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Frequency</Label>
                      <Select
                        value={subscriberFilters.frequencies[0] || ""}
                        onValueChange={(value) => setSubscriberFilters(prev => ({ 
                          ...prev, 
                          frequencies: value === "all" ? [] : [value] 
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All frequencies" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All frequencies</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Interests</Label>
                      <Select
                        value={subscriberFilters.interests[0] || ""}
                        onValueChange={(value) => setSubscriberFilters(prev => ({ 
                          ...prev, 
                          interests: value === "all" ? [] : [value] 
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All interests" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All interests</SelectItem>
                          {interests.map(interest => (
                            <SelectItem key={interest.id} value={interest.id}>
                              {interest.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bulk Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllSubscribers}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearSelection}
                  >
                    Clear Selection
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {selectedSubscribers.size} selected
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addSubscribersToIssue}
                    disabled={selectedSubscribers.size === 0}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add to Issue
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Export CSV
                  </Button>
                </div>
              </div>

              {/* Recipients Counter */}
              <div className="bg-primary/10 p-3 rounded-lg">
                <p className="text-sm font-medium">
                  Selected recipients for current issue: {recipientCount}
                </p>
              </div>

              {/* Subscribers Table */}
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b">
                        <tr>
                          <th className="text-left p-4">
                            <Checkbox
                              checked={selectedSubscribers.size === subscribers.length && subscribers.length > 0}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  selectAllSubscribers();
                                } else {
                                  clearSelection();
                                }
                              }}
                            />
                          </th>
                          <th className="text-left p-4">Email</th>
                          <th className="text-left p-4">User</th>
                          <th className="text-left p-4">Frequency</th>
                          <th className="text-left p-4">Interests</th>
                          <th className="text-left p-4">Subscribed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subscribers.map((subscriber) => (
                          <tr key={subscriber.id} className="border-b">
                            <td className="p-4">
                              <Checkbox
                                checked={selectedSubscribers.has(subscriber.id)}
                                onCheckedChange={() => toggleSubscriberSelection(subscriber.id)}
                              />
                            </td>
                            <td className="p-4 font-medium">{subscriber.email}</td>
                            <td className="p-4">
                              {subscriber.user_id ? (
                                <span className="text-sm text-muted-foreground">Registered User</span>
                              ) : (
                                <span className="text-sm text-muted-foreground">Newsletter Only</span>
                              )}
                            </td>
                            <td className="p-4">
                              <Badge variant="outline">
                                {subscriber.frequency}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-wrap gap-1">
                                {subscriber.interests.slice(0, 3).map((interest) => (
                                  <Badge key={interest.id} variant="secondary" className="text-xs">
                                    {interest.name}
                                  </Badge>
                                ))}
                                {subscriber.interests.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{subscriber.interests.length - 3}
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="p-4 text-sm text-muted-foreground">
                              {new Date(subscriber.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="composer" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Content Picker */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Content Picker</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Select
                        value={selectedContentType}
                        onValueChange={(value: any) => setSelectedContentType(value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tool">Tools</SelectItem>
                          <SelectItem value="article">Articles</SelectItem>
                          <SelectItem value="job">Jobs</SelectItem>
                          <SelectItem value="event">Events</SelectItem>
                          <SelectItem value="post">Posts</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search content..."
                          value={contentSearch}
                          onChange={(e) => setContentSearch(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {contentItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{item.title}</h4>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {item.description}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addItemToIssue(item, selectedContentType)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Issue Editor */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Issue Editor</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {currentIssue && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Title</Label>
                            <Input
                              value={currentIssue.title}
                              onChange={(e) => updateCurrentIssue({ title: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Frequency</Label>
                            <Select
                              value={currentIssue.frequency}
                              onValueChange={(value: any) => updateCurrentIssue({ frequency: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label>Email Subject</Label>
                          <Input
                            value={currentIssue.subject || ''}
                            onChange={(e) => updateCurrentIssue({ subject: e.target.value })}
                            placeholder="Subject line (supports {{first_name}})"
                          />
                        </div>

                        <div>
                          <Label>Intro Text</Label>
                          <Textarea
                            value={currentIssue.intro_text || ''}
                            onChange={(e) => updateCurrentIssue({ intro_text: e.target.value })}
                            placeholder="Introduction text (supports {{first_name}}, {{email}})"
                            rows={3}
                          />
                        </div>

                        <div>
                          <Label>Outro Text</Label>
                          <Textarea
                            value={currentIssue.outro_text || ''}
                            onChange={(e) => updateCurrentIssue({ outro_text: e.target.value })}
                            placeholder="Closing text (supports {{unsubscribe_url}})"
                            rows={3}
                          />
                        </div>

                        {/* Selected Items */}
                        <div>
                          <Label>Selected Items ({issueItems.length})</Label>
                          <div className="space-y-2 max-h-48 overflow-y-auto mt-2">
                            {issueItems.map((item, index) => (
                              <div
                                key={item.id}
                                className="flex items-center gap-2 p-2 border rounded"
                              >
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{item.title_snapshot}</p>
                                  <p className="text-xs text-muted-foreground">{item.content_type}</p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    // Remove item logic would go here
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Recipients Info */}
                        <div className="bg-primary/10 p-3 rounded-lg">
                          <p className="text-sm font-medium">
                            Recipients for this issue: {recipientCount}
                          </p>
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 h-auto"
                            onClick={() => setActiveTab('subscribers')}
                          >
                            Manage Recipients
                          </Button>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={saveIssue}
                          >
                            Save Draft
                          </Button>
                          <Button
                            variant="outline"
                            onClick={previewNewsletter}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Preview
                          </Button>
                          <Button
                            disabled={recipientCount === 0 || isSending}
                            onClick={sendNewsletter}
                          >
                            {isSending ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1" />
                                Sending...
                              </>
                            ) : (
                              <>
                                <Send className="h-4 w-4 mr-1" />
                                Send Now
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            disabled={recipientCount === 0}
                          >
                            <Calendar className="h-4 w-4 mr-1" />
                            Schedule
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewsletterManagement;