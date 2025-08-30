import React, { useState } from 'react';
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
import { X, AlertTriangle } from 'lucide-react';

interface RejectionReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isLoading?: boolean;
  selectedCount?: number;
  toolNames?: string[];
}

export const RejectionReasonModal: React.FC<RejectionReasonModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  selectedCount = 1,
  toolNames = []
}) => {
  const [rejectionReason, setRejectionReason] = useState('');

  const handleConfirm = () => {
    if (rejectionReason.trim()) {
      onConfirm(rejectionReason.trim());
      setRejectionReason('');
    }
  };

  const handleClose = () => {
    setRejectionReason('');
    onClose();
  };

  const isMultiple = selectedCount > 1;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {isMultiple ? `Reject ${selectedCount} Tools` : 'Reject Tool'}
          </DialogTitle>
          <DialogDescription>
            {isMultiple 
              ? `You are about to reject ${selectedCount} tool submissions. This action cannot be undone.`
              : `You are about to reject this tool submission. This action cannot be undone.`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isMultiple && toolNames.length > 0 && (
            <div className="mb-4">
              <Label className="text-sm font-medium text-muted-foreground">
                Selected Tools:
              </Label>
              <div className="mt-1 max-h-24 overflow-y-auto bg-muted p-2 rounded text-sm">
                {toolNames.map((name, index) => (
                  <div key={index} className="truncate">
                    • {name}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="rejection-reason" className="text-sm font-medium">
              Rejection Reason *
            </Label>
            <Textarea
              id="rejection-reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Please provide a clear reason for rejection. This will be sent to the submitter(s) via notification..."
              rows={4}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {isMultiple 
                ? `This reason will be sent to all ${selectedCount} submitters as a notification.`
                : 'This reason will be sent to the submitter as a notification.'
              }
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!rejectionReason.trim() || isLoading}
          >
            <X className="h-4 w-4 mr-2" />
            {isLoading 
              ? 'Rejecting...' 
              : (isMultiple ? `Reject ${selectedCount} Tools` : 'Reject Tool')
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};