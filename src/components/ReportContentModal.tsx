import React, { useState } from 'react';
import { X, Flag, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface ReportContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentType: 'tool' | 'article' | 'post' | 'user' | 'comment' | 'job';
  contentId: string;
  contentTitle?: string;
}

const reportReasons = [
  { value: 'spam', label: 'Spam', description: 'Promotional or unsolicited content' },
  { value: 'fraud', label: 'Fraud / Scam', description: 'Deceptive or fraudulent content' },
  { value: 'fake', label: 'Fake / Misleading', description: 'False or misleading information' },
  { value: 'sensitive', label: 'Sensitive Content', description: 'Adult or disturbing content' },
  { value: 'harassment', label: 'Harassment / Bullying', description: 'Targeting or attacking individuals' },
  { value: 'hate_speech', label: 'Hate Speech', description: 'Discrimination or hateful content' },
  { value: 'violence', label: 'Violence / Threats', description: 'Violent or threatening content' },
  { value: 'copyright', label: 'Copyright Violation', description: 'Stolen or unauthorized content' },
  { value: 'impersonation', label: 'Impersonation', description: 'Pretending to be someone else' },
  { value: 'privacy', label: 'Privacy Violation', description: 'Sharing private information' },
  { value: 'other', label: 'Other', description: 'Other violation not listed above' },
];

const ReportContentModal: React.FC<ReportContentModalProps> = ({
  isOpen,
  onClose,
  contentType,
  contentId,
  contentTitle,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');

  const getContentTypeLabel = () => {
    switch (contentType) {
      case 'tool': return 'Tool';
      case 'article': return 'Article';
      case 'post': return 'Post';
      case 'user': return 'User';
      case 'comment': return 'Comment';
      case 'job': return 'Job';
      default: return 'Content';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason) {
      toast({
        title: "Error",
        description: "Please select a reason for reporting.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to report content.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('reports')
        .insert({
          reporter_id: user.id,
          content_type: contentType,
          content_id: contentId,
          reason: reason,
          description: details || null,
          status: 'pending',
        });

      if (error) throw error;

      toast({
        title: "Report Submitted",
        description: "Thank you for helping keep our community safe. We'll review your report.",
      });

      onClose();
      setReason('');
      setDetails('');
    } catch (error: any) {
      console.error('Error submitting report:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Flag className="h-5 w-5 text-destructive" />
              Report {getContentTypeLabel()}
            </h2>
            {contentTitle && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                "{contentTitle}"
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Warning Notice */}
          <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium mb-1">Help us keep the community safe</p>
              <p>Reports are reviewed by our moderation team. False reports may result in action against your account.</p>
            </div>
          </div>

          {/* Report Reasons */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Why are you reporting this {contentType}?</Label>
            <RadioGroup value={reason} onValueChange={setReason} className="space-y-2">
              {reportReasons.map((option) => (
                <div
                  key={option.value}
                  className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                    reason === option.value 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-muted-foreground/30'
                  }`}
                  onClick={() => setReason(option.value)}
                >
                  <RadioGroupItem value={option.value} id={option.value} className="mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor={option.value} className="text-sm font-medium cursor-pointer">
                      {option.label}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">{option.description}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Additional Details */}
          <div className="space-y-2">
            <Label htmlFor="details" className="text-base font-medium">
              Additional Details (Optional)
            </Label>
            <Textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide any additional context that might help us understand the issue..."
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !reason}
              className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {loading ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportContentModal;
