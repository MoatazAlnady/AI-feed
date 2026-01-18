import React, { useState, useEffect } from 'react';
import { X, Send, User, Users, Bell, Eye, Save, FolderOpen, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  created_at: string;
}

interface CreatorBulkEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriberCount: number;
  creatorName: string;
}

const CreatorBulkEmailModal: React.FC<CreatorBulkEmailModalProps> = ({
  isOpen,
  onClose,
  subscriberCount,
  creatorName
}) => {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [sendPushNotification, setSendPushNotification] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'compose' | 'preview'>('compose');
  
  // Template management
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [templateName, setTemplateName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  const placeholders = [
    { label: 'First Name', value: '{{name}}', description: 'Subscriber\'s first name' },
    { label: 'Full Name', value: '{{full_name}}', description: 'Subscriber\'s full name' },
    { label: 'Your Name', value: '{{creator_name}}', description: 'Your creator name' },
  ];

  // Fetch templates on modal open
  useEffect(() => {
    if (isOpen && user) {
      fetchTemplates();
    }
  }, [isOpen, user]);

  const fetchTemplates = async () => {
    if (!user) return;
    setLoadingTemplates(true);
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('id, name, subject, html_content, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error && !error.message.includes('does not exist')) {
        console.error('Error fetching templates:', error);
      } else if (data) {
        setTemplates(data as unknown as EmailTemplate[]);
      }
    } catch (err) {
      console.error('Error fetching templates:', err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const loadTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setContent(template.html_content);
      setSelectedTemplateId(templateId);
      toast.success(`Loaded template: ${template.name}`);
    }
  };

  const saveTemplate = async () => {
    if (!user || !templateName.trim() || !subject.trim()) {
      toast.error('Please enter a template name and subject');
      return;
    }

    setSavingTemplate(true);
    try {
      const { error } = await supabase
        .from('email_templates')
        .insert({
          user_id: user.id,
          name: templateName.trim(),
          subject: subject,
          html_content: content,
          template_type: 'bulk_email'
        } as any);

      if (error) throw error;

      toast.success('Template saved!');
      setShowSaveDialog(false);
      setTemplateName('');
      fetchTemplates();
    } catch (err: any) {
      console.error('Error saving template:', err);
      toast.error(err.message || 'Failed to save template');
    } finally {
      setSavingTemplate(false);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!confirm('Delete this template?')) return;

    try {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', templateId as any);

      if (error) throw error;

      toast.success('Template deleted');
      if (selectedTemplateId === templateId) {
        setSelectedTemplateId('');
      }
      fetchTemplates();
    } catch (err: any) {
      console.error('Error deleting template:', err);
      toast.error('Failed to delete template');
    }
  };

  const insertPlaceholder = (placeholder: string) => {
    setContent(prev => prev + placeholder);
  };

  const getPreviewContent = () => {
    return content
      .replace(/\{\{name\}\}/g, 'John')
      .replace(/\{\{full_name\}\}/g, 'John Doe')
      .replace(/\{\{creator_name\}\}/g, creatorName)
      .replace(/\{\{subscriber_email\}\}/g, 'john@example.com');
  };

  const getPreviewSubject = () => {
    return subject
      .replace(/\{\{name\}\}/g, 'John')
      .replace(/\{\{full_name\}\}/g, 'John Doe')
      .replace(/\{\{creator_name\}\}/g, creatorName);
  };

  const handleSend = async () => {
    if (!subject.trim()) {
      toast.error('Please enter a subject line');
      return;
    }
    if (!content.trim()) {
      toast.error('Please enter email content');
      return;
    }

    setIsSending(true);
    try {
      // Create HTML template with styling
      const htmlTemplate = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 1px solid #eee; margin-bottom: 20px; }
            .content { padding: 20px 0; white-space: pre-wrap; }
            .footer { text-align: center; padding-top: 20px; border-top: 1px solid #eee; margin-top: 20px; color: #888; font-size: 12px; }
            a { color: #3b82f6; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0; color: #3b82f6;">AI Feed</h1>
            <p style="margin: 5px 0 0; color: #888;">Update from ${creatorName}</p>
          </div>
          <div class="content">
            ${content.replace(/\n/g, '<br>')}
          </div>
          <div class="footer">
            <p>You're receiving this because you subscribed to ${creatorName} on AI Feed.</p>
            <p><a href="https://aifeed.app/creator-unsubscribe?creator=${user?.id}">Unsubscribe</a></p>
          </div>
        </body>
        </html>
      `;

      const { data, error } = await supabase.functions.invoke('send-creator-bulk-email', {
        body: {
          subject,
          html_template: htmlTemplate,
          send_push_notification: sendPushNotification
        }
      });

      if (error) throw error;

      toast.success(`Email sent to ${data.sent_count} subscribers!`);
      
      if (data.errors && data.errors.length > 0) {
        console.warn('Some emails failed:', data.errors);
      }

      onClose();
      setSubject('');
      setContent('');
      setSelectedTemplateId('');
    } catch (err: any) {
      console.error('Error sending bulk email:', err);
      toast.error(err.message || 'Failed to send emails');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Send Bulk Email
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Sending to {subscriberCount} subscriber{subscriberCount !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'compose' | 'preview')}>
          <TabsList className="w-full">
            <TabsTrigger value="compose" className="flex-1">Compose</TabsTrigger>
            <TabsTrigger value="preview" className="flex-1">
              <Eye className="h-4 w-4 mr-1" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="compose" className="space-y-4 mt-4">
            {/* Template Selector */}
            {templates.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Load Saved Template</Label>
                <div className="flex gap-2">
                  <Select value={selectedTemplateId} onValueChange={loadTemplate}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedTemplateId && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteTemplate(selectedTemplateId)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Placeholders */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Insert Placeholders</Label>
              <div className="flex flex-wrap gap-2">
                {placeholders.map((p) => (
                  <Button
                    key={p.value}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => insertPlaceholder(p.value)}
                    title={p.description}
                  >
                    <User className="h-3 w-3 mr-1" />
                    {p.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject Line *</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Hey {{name}}, check out my latest update!"
              />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content">Email Content *</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your message here. Use {{name}} to personalize..."
                rows={10}
              />
            </div>

            {/* Push Notification Toggle */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Also send push notification</span>
              </div>
              <Switch
                checked={sendPushNotification}
                onCheckedChange={setSendPushNotification}
              />
            </div>

            {/* Save Template Button */}
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowSaveDialog(true)}
              disabled={!subject.trim()}
              className="w-full"
            >
              <Save className="h-4 w-4 mr-2" />
              Save as Template
            </Button>
          </TabsContent>

          <TabsContent value="preview" className="mt-4">
            <div className="border rounded-lg p-4 bg-card">
              <div className="space-y-4">
                <div className="border-b pb-2">
                  <Label className="text-xs text-muted-foreground">Subject</Label>
                  <p className="font-medium">{getPreviewSubject() || '(No subject)'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Content</Label>
                  <div className="mt-2 whitespace-pre-wrap text-sm">
                    {getPreviewContent() || '(No content)'}
                  </div>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              This is how your email will appear to "John Doe" (john@example.com)
            </p>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isSending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isSending || !subject.trim() || !content.trim()}>
            {isSending ? (
              <>Sending...</>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send to {subscriberCount} Subscribers
              </>
            )}
          </Button>
        </div>

        {/* Save Template Dialog */}
        <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Save as Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="templateName">Template Name</Label>
                <Input
                  id="templateName"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g., Weekly Newsletter"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={saveTemplate} disabled={savingTemplate || !templateName.trim()}>
                  {savingTemplate ? 'Saving...' : 'Save Template'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};

export default CreatorBulkEmailModal;
