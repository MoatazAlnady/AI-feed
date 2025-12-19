import React, { useState, useRef } from 'react';
import { X, AlertTriangle, Upload, Image, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface ReportProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const problemCategories = [
  { value: 'bug', label: 'Bug / Technical Issue' },
  { value: 'feature', label: 'Feature Request' },
  { value: 'account', label: 'Account Problem' },
  { value: 'payment', label: 'Payment Issue' },
  { value: 'performance', label: 'Performance / Speed Issue' },
  { value: 'accessibility', label: 'Accessibility Problem' },
  { value: 'other', label: 'Other' },
];

const ReportProblemModal: React.FC<ReportProblemModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Screenshot must be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      setScreenshot(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeScreenshot = () => {
    setScreenshot(null);
    setScreenshotPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!category) {
      toast({
        title: "Error",
        description: "Please select a problem category.",
        variant: "destructive",
      });
      return;
    }

    if (!subject.trim()) {
      toast({
        title: "Error",
        description: "Please enter a subject.",
        variant: "destructive",
      });
      return;
    }

    if (!description.trim()) {
      toast({
        title: "Error",
        description: "Please describe the problem.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      let screenshotUrl = null;

      // Upload screenshot if provided
      if (screenshot && user) {
        const fileExt = screenshot.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('support-attachments')
          .upload(fileName, screenshot);

        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage
            .from('support-attachments')
            .getPublicUrl(fileName);
          screenshotUrl = urlData.publicUrl;
        }
      }

      // Create support ticket
      const { error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user?.id || 'anonymous',
          subject: `[${category.toUpperCase()}] ${subject}`,
          message: description + (screenshotUrl ? `\n\n[Screenshot: ${screenshotUrl}]` : ''),
          priority: category === 'bug' || category === 'payment' ? 'high' : 'medium',
          status: 'open',
        });

      if (error) throw error;

      toast({
        title: "Report Submitted",
        description: "Thank you for your feedback. We'll look into this issue.",
      });

      // Reset form and close
      setCategory('');
      setSubject('');
      setDescription('');
      removeScreenshot();
      onClose();
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
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Report a Problem
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Let us know about issues you're experiencing
            </p>
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
          {/* Problem Category */}
          <div className="space-y-4">
            <Label className="text-base font-medium">What type of problem are you experiencing?</Label>
            <RadioGroup value={category} onValueChange={setCategory}>
              {problemCategories.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label htmlFor={option.value} className="text-sm cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject" className="text-base font-medium">
              Subject
            </Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of the issue"
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-base font-medium">
              Describe the Problem
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide as much detail as possible. What were you trying to do? What happened instead? Any error messages?"
              rows={5}
              className="resize-none"
            />
          </div>

          {/* Screenshot Upload */}
          <div className="space-y-2">
            <Label className="text-base font-medium">
              Attach Screenshot (Optional)
            </Label>
            
            {screenshotPreview ? (
              <div className="relative rounded-lg overflow-hidden border border-border">
                <img
                  src={screenshotPreview}
                  alt="Screenshot preview"
                  className="w-full max-h-48 object-contain bg-muted"
                />
                <button
                  type="button"
                  onClick={removeScreenshot}
                  className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
              >
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Click to upload a screenshot
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG up to 5MB
                </p>
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleScreenshotChange}
              className="hidden"
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
              disabled={loading || !category || !subject.trim() || !description.trim()}
              className="flex-1"
            >
              {loading ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportProblemModal;
