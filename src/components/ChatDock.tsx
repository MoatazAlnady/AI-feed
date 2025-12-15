import React, { useState, useEffect } from 'react';
import { X, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DualChatTabs from './DualChatTabs';
import MultiChatDock from './MultiChatDock';

interface AIChatBotProps {
  initialMessage?: string;
  autoOpen?: boolean;
}

const AIChatBot = ({ initialMessage, autoOpen }: AIChatBotProps) => {
  const [showChat, setShowChat] = useState(autoOpen || false);

  useEffect(() => {
    if (initialMessage && initialMessage.trim()) {
      setShowChat(true);
    }
  }, [initialMessage]);

  return (
    <>
      {/* MultiChatDock handles individual chat windows */}
      <MultiChatDock />

      {/* Main Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setShowChat(!showChat)}
          className="w-14 h-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-all duration-300 hover:scale-105"
          size="icon"
          title="Messages"
        >
          {showChat ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        </Button>
      </div>

      {/* Chat Window with Tabs */}
      <DualChatTabs isOpen={showChat} onClose={() => setShowChat(false)} />
    </>
  );
};

export default AIChatBot;
