import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Eye,
  Users,
  Compare,
  CheckCircle,
  X,
  ExternalLink
} from 'lucide-react';

interface Tool {
  id: string;
  name: string;
  description: string;
  pricing: string;
  category_name?: string;
  average_rating: number;
  review_count: number;
  website: string;
}

interface ToolComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTools: string[];
  tools: Tool[];
}

const ToolComparisonModal: React.FC<ToolComparisonModalProps> = ({
  isOpen,
  onClose,
  selectedTools,
  tools
}) => {
  const { toast } = useToast();

  if (!isOpen) return null;

  const selectedToolData = tools.filter(tool => selectedTools.includes(tool.id));

  const handleCompare = () => {
    if (selectedTools.length < 2) {
      toast({
        title: "Not enough tools",
        description: "Please select at least 2 tools to compare",
        variant: "destructive"
      });
      return;
    }

    if (selectedTools.length > 5) {
      toast({
        title: "Too many tools", 
        description: "Maximum 5 tools can be compared at once",
        variant: "destructive"
      });
      return;
    }

    window.location.href = `/tools/compare/${selectedTools.join(',')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Compare className="h-5 w-5" />
            Tool Comparison ({selectedTools.length}/5)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleCompare}>Compare Now</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ToolComparisonModal;