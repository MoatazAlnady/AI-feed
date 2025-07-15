import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { TrendingUp, Target, Users } from 'lucide-react';

interface PromoteContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentType?: 'tool' | 'article' | 'job';
  contentId?: string;
  contentTitle?: string;
}

export const PromoteContentModal = ({ 
  isOpen, 
  onClose, 
  contentType = 'tool',
  contentId,
  contentTitle 
}: PromoteContentModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const { user } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle promotion submission
    console.log('Promoting content:', { title, description, budget, targetAudience });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Promote Your {contentType === 'tool' ? 'Tool' : contentType === 'article' ? 'Article' : 'Job'}
          </DialogTitle>
          <DialogDescription>
            Boost visibility and reach more users with targeted promotion.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Campaign Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter campaign title"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your promotion campaign"
              rows={3}
            />
          </div>
          
          <div>
            <Label htmlFor="budget">Budget ($)</Label>
            <Input
              id="budget"
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="100"
              min="10"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="audience">Target Audience</Label>
            <Input
              id="audience"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="AI developers, startups, etc."
            />
          </div>
          
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              Estimated reach: 1,000-5,000 users
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                Start Campaign
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};