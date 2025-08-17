import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Eye,
  Users,
  ArrowRightLeft,
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
  onSelectionChange: (selectedToolIds: string[]) => void;
}

const ToolComparisonModal: React.FC<ToolComparisonModalProps> = ({
  isOpen,
  onClose,
  selectedTools,
  tools,
  onSelectionChange
}) => {
  const { toast } = useToast();

  if (!isOpen) return null;

  const selectedToolData = tools.filter(tool => selectedTools.includes(tool.id));

  const handleToolToggle = (toolId: string) => {
    const updatedSelection = selectedTools.includes(toolId)
      ? selectedTools.filter(id => id !== toolId)
      : [...selectedTools, toolId];
    
    if (updatedSelection.length > 5) {
      toast({
        title: "Too many tools", 
        description: "Maximum 5 tools can be compared at once",
        variant: "destructive"
      });
      return;
    }
    
    onSelectionChange(updatedSelection);
  };

  const handleCompare = () => {
    if (selectedTools.length < 2) {
      toast({
        title: "Not enough tools",
        description: "Please select at least 2 tools to compare",
        variant: "destructive"
      });
      return;
    }

    window.location.href = `/tools/compare/${selectedTools.join(',')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Select Tools to Compare ({selectedTools.length}/5)
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {tools.map((tool) => (
              <div
                key={tool.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedTools.includes(tool.id)
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleToolToggle(tool.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
                        <span className="text-sm">🤖</span>
                      </div>
                      <h3 className="font-semibold text-sm">{tool.name}</h3>
                    </div>
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                      {tool.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {tool.category_name || 'AI Tool'}
                      </Badge>
                      <span className="text-xs text-gray-500">{tool.pricing}</span>
                    </div>
                  </div>
                  <div className="ml-2">
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        selectedTools.includes(tool.id)
                          ? 'border-primary bg-primary text-white'
                          : 'border-gray-300'
                      }`}
                    >
                      {selectedTools.includes(tool.id) && (
                        <CheckCircle className="h-3 w-3" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {selectedTools.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Selected Tools:</h4>
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedToolData.map((tool) => (
                  <Badge key={tool.id} variant="default" className="flex items-center gap-1">
                    {tool.name}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToolToggle(tool.id);
                      }}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button 
              onClick={handleCompare}
              disabled={selectedTools.length < 2}
            >
              Compare {selectedTools.length > 1 ? `${selectedTools.length} Tools` : 'Tools'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ToolComparisonModal;