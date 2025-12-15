import React, { useState, useEffect } from 'react';
import { X, MessageCircle, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AIChat from './AIChat';
import MultiChatDock from './MultiChatDock';

interface AIChatBotProps {
  initialMessage?: string;
  autoOpen?: boolean;
}

const AIChatBot = ({ initialMessage, autoOpen }: AIChatBotProps) => {
  const [showAIChat, setShowAIChat] = useState(autoOpen || false);

  // Handle initial message from search - open AI chat
  useEffect(() => {
    if (initialMessage && initialMessage.trim()) {
      setShowAIChat(true);
    }
  }, [initialMessage]);

  return (
    <>
      {/* MultiChatDock handles all person-to-person messaging */}
      <MultiChatDock />

      {/* AI Chat Button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-3">
        <Button
          onClick={() => setShowAIChat(!showAIChat)}
          className="w-14 h-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-all duration-300 hover:scale-105"
          size="icon"
          title="AI Assistant"
        >
          {showAIChat ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
        </Button>
      </div>

      {/* AI Chat Window */}
      {showAIChat && (
        <div className="fixed bottom-24 right-6 z-40 w-96 h-[500px] animate-slide-up">
          <Card className="h-full flex flex-col bg-background border border-border shadow-2xl overflow-hidden">
            <div className="p-3 border-b flex items-center justify-between bg-primary/5">
              <div className="flex items-center space-x-2">
                <Bot className="h-5 w-5 text-primary" />
                <span className="font-medium text-foreground">AI Assistant</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAIChat(false)}
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
      )}
    </>
  );
};

export default AIChatBot;
