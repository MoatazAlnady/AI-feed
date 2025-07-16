import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EditMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageId: string;
  currentContent: string;
  onUpdate: (messageId: string, newContent: string) => void;
}

const EditMessageModal: React.FC<EditMessageModalProps> = ({
  isOpen,
  onClose,
  messageId,
  currentContent,
  onUpdate
}) => {
  const [content, setContent] = useState(currentContent);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Message cannot be empty",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('messages')
        .update({ 
          content: content.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (error) throw error;

      onUpdate(messageId, content.trim());
      onClose();
      toast({
        title: "Success",
        description: "Message updated successfully"
      });
    } catch (error) {
      console.error('Error updating message:', error);
      toast({
        title: "Error",
        description: "Failed to update message",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Message</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Edit your message..."
            rows={4}
            className="resize-none"
          />
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading || !content.trim()}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditMessageModal;