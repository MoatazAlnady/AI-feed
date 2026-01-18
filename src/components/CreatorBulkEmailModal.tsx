import React, { useState } from 'react';
import { X, Send, User, Users, Bell, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

  const placeholders = [
    { label: 'First Name', value: '{{name}}', description: 'Subscriber\'s first name' },
    { label: 'Full Name', value: '{{full_name}}', description: 'Subscriber\'s full name' },
    { label: 'Your Name', value: '{{creator_name}}', description: 'Your creator name' },
  ];

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
      </DialogContent>
    </Dialog>
  );
};

export default CreatorBulkEmailModal;
