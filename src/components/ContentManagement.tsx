import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, FileText, Layout, BarChart, Users, Wrench, Mail, Building } from 'lucide-react';
import AdminToolRequests from './AdminToolRequests';
import AdvancedUserManagement from './AdvancedUserManagement';
import NewsletterManagement from './NewsletterManagement';
import InterestManagement from './InterestManagement';
import PricingManagement from './PricingManagement';

interface ContentItem {
  id: string;
  content_key: string;
  content_value: any;
  content_type: string;
  description: string;
}

const ContentManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from('site_content')
        .select('*')
        .order('content_key');

      if (error) throw error;
      setContent(data || []);
    } catch (error) {
      console.error('Error fetching content:', error);
      toast({
        title: "Error",
        description: "Failed to load content",
        variant: "destructive"
      });
    }
  };

  const updateContent = async (contentKey: string, newValue: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('site_content')
        .update({ 
          content_value: JSON.stringify(newValue),
          updated_at: new Date().toISOString()
        })
        .eq('content_key', contentKey);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Content updated successfully",
      });

      await fetchContent();
      setEditingItem(null);
      setEditValue('');
    } catch (error) {
      console.error('Error updating content:', error);
      toast({
        title: "Error",
        description: "Failed to update content",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (item: ContentItem) => {
    setEditingItem(item.content_key);
    // Remove quotes from JSON string values
    const value = typeof item.content_value === 'string' 
      ? item.content_value.replace(/^"|"$/g, '') 
      : item.content_value;
    setEditValue(value);
  };

  const cancelEditing = () => {
    setEditingItem(null);
    setEditValue('');
  };

  const saveEdit = async () => {
    if (editingItem && editValue !== undefined) {
      await updateContent(editingItem, editValue);
    }
  };

  const renderEditField = (item: ContentItem) => {
    if (editingItem === item.content_key) {
      return (
        <div className="space-y-2">
          {item.content_type === 'textarea' ? (
            <Textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              rows={4}
              className="w-full"
            />
          ) : (
            <Input
              type={item.content_type === 'number' ? 'number' : 'text'}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full"
            />
          )}
          <div className="flex gap-2">
            <Button onClick={saveEdit} disabled={loading} size="sm">
              {loading ? "Saving..." : "Save"}
            </Button>
            <Button onClick={cancelEditing} variant="outline" size="sm">
              Cancel
            </Button>
          </div>
        </div>
      );
    }

    const displayValue = typeof item.content_value === 'string' 
      ? item.content_value.replace(/^"|"$/g, '') 
      : item.content_value;

    return (
      <div className="space-y-2">
        <div className="min-h-[40px] p-2 bg-muted rounded border">
          {item.content_type === 'textarea' ? (
            <p className="whitespace-pre-wrap">{displayValue}</p>
          ) : (
            <span>{displayValue}</span>
          )}
        </div>
        <Button onClick={() => startEditing(item)} size="sm" variant="outline">
          Edit
        </Button>
      </div>
    );
  };

  const organizeContentByCategory = (content: ContentItem[]) => {
    const categories = {
      hero: content.filter(item => item.content_key.startsWith('hero_')),
      features: content.filter(item => item.content_key.startsWith('features_')),
      stats: content.filter(item => item.content_key.startsWith('stats_')),
      cta: content.filter(item => item.content_key.startsWith('cta_')),
      other: content.filter(item => !['hero_', 'features_', 'stats_', 'cta_'].some(prefix => item.content_key.startsWith(prefix)))
    };
    return categories;
  };

  if (!user) {
    return (
      <div className="container max-w-6xl mx-auto py-8 px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Content Management</h1>
          <p className="text-muted-foreground">Please log in to access content management.</p>
        </div>
      </div>
    );
  }

  const categories = organizeContentByCategory(content);

  return (
    <div className="container max-w-6xl mx-auto py-8 px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Content Management
        </h1>
        <p className="text-muted-foreground">
          Manage all website content from this central dashboard.
        </p>
      </div>

      <Tabs defaultValue="hero" className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-9">
          <TabsTrigger value="hero" className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            <span className="hidden sm:inline">Hero</span>
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Features</span>
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            <span className="hidden sm:inline">Stats</span>
          </TabsTrigger>
          <TabsTrigger value="cta" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">CTA</span>
          </TabsTrigger>
          <TabsTrigger value="interests" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Interests</span>
          </TabsTrigger>
          <TabsTrigger value="tools" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            <span className="hidden sm:inline">Tools</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="orgs" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            <span className="hidden sm:inline">Orgs</span>
          </TabsTrigger>
          <TabsTrigger value="newsletter" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Newsletter</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hero" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hero Section Content</CardTitle>
              <CardDescription>
                Manage the main hero section displayed on the homepage.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {categories.hero.map((item) => (
                <div key={item.id} className="space-y-2">
                  <Label className="font-semibold">{item.description}</Label>
                  {renderEditField(item)}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Features Section</CardTitle>
              <CardDescription>
                Manage the features section content and descriptions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {categories.features.map((item) => (
                <div key={item.id} className="space-y-2">
                  <Label className="font-semibold">{item.description}</Label>
                  {renderEditField(item)}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
              <CardDescription>
                Manage the statistics displayed on the homepage.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {categories.stats.map((item) => (
                <div key={item.id} className="space-y-2">
                  <Label className="font-semibold">{item.description}</Label>
                  {renderEditField(item)}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cta" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Call to Action</CardTitle>
              <CardDescription>
                Manage the call to action section at the bottom of the homepage.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {categories.cta.map((item) => (
                <div key={item.id} className="space-y-2">
                  <Label className="font-semibold">{item.description}</Label>
                  {renderEditField(item)}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interests" className="space-y-4">
          <InterestManagement mode="admin" />
        </TabsContent>

        <TabsContent value="tools" className="space-y-4">
          <AdminToolRequests />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <AdvancedUserManagement />
        </TabsContent>

        <TabsContent value="orgs" className="space-y-4">
          <AdvancedUserManagement />
        </TabsContent>

        <TabsContent value="newsletter" className="space-y-4">
          <NewsletterManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContentManagement;