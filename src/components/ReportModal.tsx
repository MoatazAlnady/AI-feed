import React, { useState } from 'react';
import { X, Flag, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'content' | 'user';
  targetId: string;
  targetTitle?: string;
}

const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  type,
  targetId,
  targetTitle
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');

  const reportReasons = {
    content: [
      { value: 'spam', label: 'Spam or misleading content' },
      { value: 'inappropriate', label: 'Inappropriate or offensive content' },
      { value: 'copyright', label: 'Copyright infringement' },
      { value: 'misinformation', label: 'False or misleading information' },
      { value: 'harassment', label: 'Harassment or bullying' },
      { value: 'other', label: 'Other' }
    ],
    user: [
      { value: 'harassment', label: 'Harassment or bullying' },
      { value: 'impersonation', label: 'Impersonation' },
      { value: 'spam', label: 'Spam behavior' },
      { value: 'inappropriate', label: 'Inappropriate behavior' },
      { value: 'fake', label: 'Fake account' },
      { value: 'other', label: 'Other' }
    ]
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      toast({
        title: "Error",
        description: "Please select a reason for reporting.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Report Submitted",
        description: "Thank you for your report. We'll review it and take appropriate action."
      });
      
      onClose();
      setReason('');
      setDetails('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Flag className="h-5 w-5 text-red-500" />
              Report {type === 'content' ? 'Content' : 'User'}
            </h2>
            {targetTitle && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                "{targetTitle}"
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium mb-1">Help us keep the community safe</p>
              <p>Reports are reviewed by our moderation team. False reports may result in action against your account.</p>
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-base font-medium">Why are you reporting this {type}?</Label>
            <RadioGroup value={reason} onValueChange={setReason}>
              {reportReasons[type].map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label htmlFor={option.value} className="text-sm cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="details" className="text-base font-medium">
              Additional Details (Optional)
            </Label>
            <Textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Please provide any additional context that might help us understand the issue..."
              rows={4}
              className="resize-none"
            />
          </div>

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
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;