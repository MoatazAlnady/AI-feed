import React, { useState, useEffect } from 'react';
import { X, MessageCircle, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DualChatTabs from './DualChatTabs';
import MultiChatDock from './MultiChatDock';
import { useAuth } from '@/context/AuthContext';

interface AIChatBotProps {
  initialMessage?: string;
  autoOpen?: boolean;
}

const AIChatBot = ({ initialMessage, autoOpen }: AIChatBotProps) => {
  const { user } = useAuth();
  const [showChat, setShowChat] = useState(autoOpen || false);

  useEffect(() => {
    if (initialMessage && initialMessage.trim()) {
      setShowChat(true);
    }
  }, [initialMessage]);

  const isLoggedIn = !!user;

  return (
    <>
      {/* MultiChatDock handles individual chat windows - only for logged-in users */}
      {isLoggedIn && <MultiChatDock />}

      {/* Main Chat Button */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
        <Button
          onClick={() => setShowChat(!showChat)}
          className="w-14 h-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-all duration-300 hover:scale-105"
          size="icon"
          title={isLoggedIn ? "Messages" : "AI Assistant"}
        >
          {showChat ? (
            <X className="h-6 w-6" />
          ) : isLoggedIn ? (
            <MessageCircle className="h-6 w-6" />
          ) : (
            <Bot className="h-6 w-6" />
          )}
        </Button>
      </div>

      {/* Chat Window with Tabs */}
      <DualChatTabs isOpen={showChat} onClose={() => setShowChat(false)} />
    </>
  );
};

export default AIChatBot;
