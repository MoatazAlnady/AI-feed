import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Send, User, Briefcase, Building2, Eye } from 'lucide-react';

interface Recipient {
  id: string;
  full_name: string | null;
  job_title: string | null;
  company: string | null;
  profile_photo: string | null;
}

interface BulkMessageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipients: Recipient[];
  onSuccess?: () => void;
}

const BulkMessageModal = ({ open, onOpenChange, recipients, onSuccess }: BulkMessageModalProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [template, setTemplate] = useState('');
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const placeholders = [
    { key: '{{name}}', label: t('bulkActions.placeholders.name', 'First Name'), icon: User },
    { key: '{{full_name}}', label: t('bulkActions.placeholders.fullName', 'Full Name'), icon: User },
    { key: '{{job_title}}', label: t('bulkActions.placeholders.jobTitle', 'Job Title'), icon: Briefcase },
    { key: '{{company}}', label: t('bulkActions.placeholders.company', 'Company'), icon: Building2 },
  ];

  const insertPlaceholder = (placeholder: string) => {
    setTemplate(prev => prev + placeholder);
  };

  const previewMessage = useMemo(() => {
    if (recipients.length === 0) return template;
    const firstRecipient = recipients[0];
    const firstName = firstRecipient.full_name?.split(' ')[0] || 'there';
    
    return template
      .replace(/\{\{name\}\}/g, firstName)
      .replace(/\{\{full_name\}\}/g, firstRecipient.full_name || 'there')
      .replace(/\{\{job_title\}\}/g, firstRecipient.job_title || 'professional')
      .replace(/\{\{company\}\}/g, firstRecipient.company || 'your company');
  }, [template, recipients]);

  const handleSend = async () => {
    if (!user || !template.trim()) return;

    setSending(true);
    try {
      let successCount = 0;
      let failCount = 0;

      for (const recipient of recipients) {
        const firstName = recipient.full_name?.split(' ')[0] || 'there';
        const personalizedMessage = template
          .replace(/\{\{name\}\}/g, firstName)
          .replace(/\{\{full_name\}\}/g, recipient.full_name || 'there')
          .replace(/\{\{job_title\}\}/g, recipient.job_title || 'professional')
          .replace(/\{\{company\}\}/g, recipient.company || 'your company');

        const { error } = await supabase
          .from('messages')
          .insert({
            sender_id: user.id,
            recipient_id: recipient.id,
            content: personalizedMessage,
          });

        if (error) {
          console.error('Error sending message to', recipient.id, error);
          failCount++;
        } else {
          successCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: t('bulkActions.messagesSent', 'Messages Sent'),
          description: t('bulkActions.messagesSentDesc', 'Successfully sent {{count}} messages', { count: successCount }),
        });
        onOpenChange(false);
        setTemplate('');
        onSuccess?.();
      }

      if (failCount > 0) {
        toast({
          title: t('common.error', 'Error'),
          description: t('bulkActions.someMessagesFailed', 'Failed to send {{count}} messages', { count: failCount }),
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error sending bulk messages:', error);
      toast({
        title: t('common.error', 'Error'),
        description: t('bulkActions.sendError', 'Failed to send messages'),
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('bulkActions.bulkMessage', 'Bulk Message')}</DialogTitle>
          <DialogDescription>
            {t('bulkActions.bulkMessageDesc', 'Send a personalized message to {{count}} recipients', { count: recipients.length })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Recipients Preview */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              {t('bulkActions.recipients', 'Recipients')} ({recipients.length})
            </Label>
            <ScrollArea className="h-20 border rounded-md p-2">
              <div className="flex flex-wrap gap-2">
                {recipients.map((recipient) => (
                  <Badge key={recipient.id} variant="secondary" className="gap-1">
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={recipient.profile_photo || ''} />
                      <AvatarFallback className="text-[8px]">
                        {recipient.full_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    {recipient.full_name || 'Unknown'}
                  </Badge>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Placeholders */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              {t('bulkActions.insertPlaceholder', 'Insert Placeholder')}
            </Label>
            <div className="flex flex-wrap gap-2">
              {placeholders.map((p) => (
                <Button
                  key={p.key}
                  variant="outline"
                  size="sm"
                  onClick={() => insertPlaceholder(p.key)}
                  className="gap-1"
                >
                  <p.icon className="h-3 w-3" />
                  {p.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Message Template */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">
                {t('bulkActions.messageTemplate', 'Message Template')}
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="gap-1 text-xs"
              >
                <Eye className="h-3 w-3" />
                {showPreview ? t('bulkActions.hidePreview', 'Hide Preview') : t('bulkActions.showPreview', 'Show Preview')}
              </Button>
            </div>
            
            {showPreview ? (
              <div className="border rounded-md p-4 bg-muted/30 min-h-[120px]">
                <p className="text-xs text-muted-foreground mb-2">
                  {t('bulkActions.previewFor', 'Preview for')}: {recipients[0]?.full_name || 'First recipient'}
                </p>
                <p className="text-sm whitespace-pre-wrap">{previewMessage || t('bulkActions.noMessage', 'No message yet...')}</p>
              </div>
            ) : (
              <Textarea
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                placeholder={t('bulkActions.templatePlaceholder', 'Hi {{name}}, I came across your profile and was impressed by your work as a {{job_title}} at {{company}}...')}
                className="min-h-[120px] resize-none"
              />
            )}
          </div>
        </div>

        <Separator />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button 
            onClick={handleSend} 
            disabled={sending || !template.trim()}
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            {sending 
              ? t('bulkActions.sending', 'Sending...') 
              : t('bulkActions.sendToAll', 'Send to {{count}}', { count: recipients.length })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkMessageModal;
