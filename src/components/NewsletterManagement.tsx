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
  user_id?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  created_at: string;
  user_profiles?: {
    full_name: string;
  };
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
  subject?: string;
  intro_text?: string;
  outro_text?: string;
  scheduled_for?: string;
  created_at: string;
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
  const [selectedContent, setSelectedContent] = useState<IssueItem[]>([]);
  const [contentType, setContentType] = useState<'tool' | 'article' | 'job' | 'event' | 'post'>('tool');
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [contentSearch, setContentSearch] = useState('');
  const [recipientCount, setRecipientCount] = useState(0);
  
  // Common state
  const [interests, setInterests] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (subscriberFilters.frequencies.length || subscriberFilters.interests.length || subscriberFilters.search) {
      fetchFilteredSubscribers();
    } else {
      fetchSubscribers();
    }
  }, [subscriberFilters]);

  useEffect(() => {
    fetchContentItems();
  }, [contentType, contentSearch]);

  useEffect(() => {
    if (currentIssue) {
      fetchRecipientCount();
    }
  }, [currentIssue]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchSubscribers(),
        fetchInterests(),
        createOrGetDraftIssue(),
        fetchContentItems()
      ]);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast({
        title: "Error",
        description: "Failed to load newsletter data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscribers = async () => {
    try {
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedSubscribers = (data || []).map(subscriber => ({
        ...subscriber,
        frequency: subscriber.frequency as 'daily' | 'weekly' | 'monthly',
        interests: [] as Interest[]
      }));

      setSubscribers(formattedSubscribers);
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
          user_profiles(full_name),
          newsletter_subscriber_interests(
            interest_id,
            interests(id, name, slug)
          )
        `);

      if (subscriberFilters.frequencies.length > 0) {
        query = query.in('frequency', subscriberFilters.frequencies);
      }

      if (subscriberFilters.search) {
        query = query.or(`email.ilike.%${subscriberFilters.search}%,user_profiles.full_name.ilike.%${subscriberFilters.search}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      let formattedSubscribers = data.map(subscriber => ({
        ...subscriber,
        interests: subscriber.newsletter_subscriber_interests?.map(si => si.interests).filter(Boolean) || []
      }));

      // Filter by interests if specified
      if (subscriberFilters.interests.length > 0) {
        formattedSubscribers = formattedSubscribers.filter(subscriber =>
          subscriber.interests.some(interest => 
            subscriberFilters.interests.includes(interest.id)
          )
        );
      }

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
        setCurrentIssue(existingDraft[0]);
        await fetchIssueItems(existingDraft[0].id);
      } else {
        // Create new draft issue
        const { data: newIssue, error: createError } = await supabase
          .from('newsletter_issues')
          .insert({
            title: `Newsletter - ${new Date().toLocaleDateString()}`,
            frequency: 'weekly',
            status: 'draft'
          })
          .select()
          .single();

        if (createError) throw createError;
        setCurrentIssue(newIssue);
      }
    } catch (error) {
      console.error('Error creating/getting draft issue:', error);
    }
  };

  const fetchIssueItems = async (issueId: string) => {
    try {
      const { data, error } = await supabase
        .from('newsletter_issue_items')
        .select('*')
        .eq('issue_id', issueId)
        .order('sort_order');

      if (error) throw error;
      setSelectedContent(data || []);
    } catch (error) {
      console.error('Error fetching issue items:', error);
    }
  };

  const fetchContentItems = async () => {
    try {
      if (contentType === 'tool') {
        const { data, error } = await supabase
          .from('tools')
          .select('id, name as title, description, website, created_at')
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;
        setContentItems((data || []).map(item => ({ ...item, type: 'tool' as const })));
      }
    } catch (error) {
      console.error('Error fetching content items:', error);
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

  const toggleSubscriberSelection = (subscriberId: string) => {
    const newSelected = new Set(selectedSubscribers);
    if (newSelected.has(subscriberId)) {
      newSelected.delete(subscriberId);
    } else {
      newSelected.add(subscriberId);
    }
    setSelectedSubscribers(newSelected);
  };

  const selectAllSubscribers = () => {
    if (selectedSubscribers.size === subscribers.length) {
      setSelectedSubscribers(new Set());
    } else {
      setSelectedSubscribers(new Set(subscribers.map(s => s.id)));
    }
  };

  const addToRecipients = async () => {
    if (!currentIssue || selectedSubscribers.size === 0) return;

    try {
      const recipientData = Array.from(selectedSubscribers).map(subscriberId => ({
        issue_id: currentIssue.id,
        subscriber_id: subscriberId
      }));

      const { error } = await supabase
        .from('newsletter_issue_recipients')
        .upsert(recipientData, { onConflict: 'issue_id,subscriber_id' });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Added ${selectedSubscribers.size} subscribers to current issue`
      });

      setSelectedSubscribers(new Set());
      fetchRecipientCount();
    } catch (error) {
      console.error('Error adding recipients:', error);
      toast({
        title: "Error",
        description: "Failed to add recipients",
        variant: "destructive"
      });
    }
  };

  const removeFromRecipients = async () => {
    if (!currentIssue || selectedSubscribers.size === 0) return;

    try {
      const { error } = await supabase
        .from('newsletter_issue_recipients')
        .delete()
        .eq('issue_id', currentIssue.id)
        .in('subscriber_id', Array.from(selectedSubscribers));

      if (error) throw error;

      toast({
        title: "Success",
        description: `Removed ${selectedSubscribers.size} subscribers from current issue`
      });

      setSelectedSubscribers(new Set());
      fetchRecipientCount();
    } catch (error) {
      console.error('Error removing recipients:', error);
      toast({
        title: "Error",
        description: "Failed to remove recipients",
        variant: "destructive"
      });
    }
  };

  const addContentToIssue = async (contentItem: ContentItem) => {
    if (!currentIssue) return;

    try {
      const newItem: Partial<IssueItem> = {
        issue_id: currentIssue.id,
        content_type: contentItem.type,
        content_id: contentItem.id,
        title_snapshot: contentItem.title,
        url_snapshot: contentItem.website || `/${contentItem.type}s/${contentItem.id}`,
        blurb_snapshot: (contentItem.description || '').substring(0, 160),
        sort_order: selectedContent.length
      };

      const { data, error } = await supabase
        .from('newsletter_issue_items')
        .insert(newItem)
        .select()
        .single();

      if (error) throw error;

      setSelectedContent([...selectedContent, data]);

      toast({
        title: "Success",
        description: "Content added to newsletter"
      });
    } catch (error) {
      console.error('Error adding content:', error);
      toast({
        title: "Error",
        description: "Failed to add content",
        variant: "destructive"
      });
    }
  };

  const removeContentFromIssue = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('newsletter_issue_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setSelectedContent(selectedContent.filter(item => item.id !== itemId));

      toast({
        title: "Success",
        description: "Content removed from newsletter"
      });
    } catch (error) {
      console.error('Error removing content:', error);
      toast({
        title: "Error",
        description: "Failed to remove content",
        variant: "destructive"
      });
    }
  };

  const updateIssue = async (updates: Partial<NewsletterIssue>) => {
    if (!currentIssue) return;

    try {
      const { data, error } = await supabase
        .from('newsletter_issues')
        .update(updates)
        .eq('id', currentIssue.id)
        .select()
        .single();

      if (error) throw error;

      setCurrentIssue(data);

      toast({
        title: "Success",
        description: "Newsletter updated"
      });
    } catch (error) {
      console.error('Error updating issue:', error);
      toast({
        title: "Error",
        description: "Failed to update newsletter",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="container max-w-7xl mx-auto py-8 px-6">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading newsletter management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 px-6">
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold mb-4 text-foreground">
          Newsletter Management
        </h1>
        <p className="text-xl text-muted-foreground">
          Manage subscribers and create newsletter issues
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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

        <TabsContent value="subscribers" className="space-y-6">
          {/* Filters Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters & Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Frequency Filters */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Frequency</Label>
                <div className="flex gap-2">
                  {['daily', 'weekly', 'monthly'].map(freq => (
                    <Button
                      key={freq}
                      variant={subscriberFilters.frequencies.includes(freq) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        const newFreqs = subscriberFilters.frequencies.includes(freq)
                          ? subscriberFilters.frequencies.filter(f => f !== freq)
                          : [...subscriberFilters.frequencies, freq];
                        setSubscriberFilters({ ...subscriberFilters, frequencies: newFreqs });
                      }}
                    >
                      {freq.charAt(0).toUpperCase() + freq.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Search */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by email or name..."
                    value={subscriberFilters.search}
                    onChange={(e) => setSubscriberFilters({ ...subscriberFilters, search: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Bulk Actions */}
              {selectedSubscribers.size > 0 && (
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">
                    {selectedSubscribers.size} subscriber{selectedSubscribers.size > 1 ? 's' : ''} selected
                  </span>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={addToRecipients}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add to Current Issue
                    </Button>
                    <Button size="sm" variant="outline" onClick={removeFromRecipients}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove from Current Issue
                    </Button>
                  </div>
                </div>
              )}

              {/* Recipient Counter */}
              <div className="text-sm text-muted-foreground">
                Selected recipients for current issue: <span className="font-medium">{recipientCount}</span>
              </div>
            </CardContent>
          </Card>

          {/* Subscribers Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Subscribers ({subscribers.length})</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAllSubscribers}>
                    {selectedSubscribers.size === subscribers.length ? 'Deselect All' : 'Select All'}
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {subscribers.map(subscriber => (
                  <div 
                    key={subscriber.id} 
                    className="flex items-center space-x-4 p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={selectedSubscribers.has(subscriber.id)}
                      onCheckedChange={() => toggleSubscriberSelection(subscriber.id)}
                    />
                    <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div>
                        <p className="font-medium">{subscriber.email}</p>
                        {subscriber.user_profiles?.full_name && (
                          <p className="text-sm text-muted-foreground">
                            {subscriber.user_profiles.full_name}
                          </p>
                        )}
                      </div>
                      <div>
                        <Badge variant="outline">{subscriber.frequency}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {subscriber.interests.slice(0, 3).map(interest => (
                          <Badge key={interest.id} variant="secondary" className="text-xs">
                            {interest.name}
                          </Badge>
                        ))}
                        {subscriber.interests.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{subscriber.interests.length - 3} more
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(subscriber.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Platform
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="composer" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Content Picker */}
            <Card>
              <CardHeader>
                <CardTitle>Content Picker</CardTitle>
                <CardDescription>Select content to include in your newsletter</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Content Type Tabs */}
                <div className="flex gap-2">
                  {(['tool', 'article', 'job', 'post'] as const).map(type => (
                    <Button
                      key={type}
                      variant={contentType === type ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setContentType(type)}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}s
                    </Button>
                  ))}
                </div>

                {/* Content Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={`Search ${contentType}s...`}
                    value={contentSearch}
                    onChange={(e) => setContentSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Content Items */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {contentItems.map(item => (
                    <div key={item.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                      <div className="flex-1">
                        <h4 className="font-medium line-clamp-1">{item.title}</h4>
                        {item.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {item.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(item.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addContentToIssue(item)}
                        disabled={selectedContent.some(sc => sc.content_id === item.id)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Right Column - Issue Editor */}
            <Card>
              <CardHeader>
                <CardTitle>Issue Editor</CardTitle>
                <CardDescription>Configure your newsletter issue</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Issue Settings */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select
                      value={currentIssue?.frequency}
                      onValueChange={(value) => updateIssue({ frequency: value as any })}
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
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      value={currentIssue?.title || ''}
                      onChange={(e) => updateIssue({ title: e.target.value })}
                    />
                  </div>
                </div>

                {/* Email Content */}
                <div>
                  <Label htmlFor="subject">Email Subject</Label>
                  <Input
                    placeholder="Use {{first_name}} for personalization"
                    value={currentIssue?.subject || ''}
                    onChange={(e) => updateIssue({ subject: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="intro">Intro Text</Label>
                  <Textarea
                    placeholder="Hello {{first_name}}, welcome to this week's newsletter..."
                    value={currentIssue?.intro_text || ''}
                    onChange={(e) => updateIssue({ intro_text: e.target.value })}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="outro">Outro Text</Label>
                  <Textarea
                    placeholder="Thanks for reading! Unsubscribe: {{unsubscribe_url}}"
                    value={currentIssue?.outro_text || ''}
                    onChange={(e) => updateIssue({ outro_text: e.target.value })}
                    rows={3}
                  />
                </div>

                {/* Selected Content */}
                <div>
                  <Label>Selected Content ({selectedContent.length})</Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto mt-2">
                    {selectedContent.map(item => (
                      <div key={item.id} className="flex items-start space-x-3 p-2 border rounded">
                        <GripVertical className="h-4 w-4 text-muted-foreground mt-1" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.title_snapshot}</p>
                          <p className="text-xs text-muted-foreground">{item.content_type}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeContentFromIssue(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recipients Info */}
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm">
                    <strong>Recipients for this issue:</strong> {recipientCount}
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto"
                    onClick={() => setActiveTab('subscribers')}
                  >
                    Manage Recipients →
                  </Button>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4">
                  <Button variant="outline">
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                  <Button>
                    <Send className="h-4 w-4 mr-1" />
                    Send Now
                  </Button>
                  <Button variant="outline">
                    <Calendar className="h-4 w-4 mr-1" />
                    Schedule...
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NewsletterManagement;