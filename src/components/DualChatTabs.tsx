import React from 'react';
import { Bot, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AIChat from './AIChat';

interface DualChatTabsProps {
  isOpen: boolean;
  onClose: () => void;
}

// Simplified component - ChatDock now uses MultiChatDock for person-to-person chat
const DualChatTabs: React.FC<DualChatTabsProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-24 z-40 w-96 h-[500px] animate-slide-up">
      <Card className="h-full flex flex-col bg-background border border-border shadow-2xl overflow-hidden">
        <div className="p-3 border-b flex items-center justify-between bg-primary/5">
          <div className="flex items-center space-x-2">
            <Bot className="h-5 w-5 text-primary" />
            <span className="font-medium text-foreground">AI Assistant</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 min-h-0">
          <AIChat context="general" />
        </div>
      </Card>
    </div>
  );
};

export default DualChatTabs;
