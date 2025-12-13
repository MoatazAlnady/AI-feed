import React, { useState } from 'react';
import { X, Send, MessageCircle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import DualChatTabs from './DualChatTabs';

interface AIChatBotProps {
  initialMessage?: string;
  autoOpen?: boolean;
}

const AIChatBot = ({ initialMessage, autoOpen }: AIChatBotProps) => {
  const [isOpen, setIsOpen] = useState(autoOpen || false);
  const [showDualChat, setShowDualChat] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{id: number, text: string, sender: 'user' | 'ai'}>>([]);

  // Handle initial message from search - stream real AI response
  React.useEffect(() => {
    if (initialMessage && initialMessage.trim()) {
      const newMessage = {
        id: Date.now(),
        text: initialMessage,
        sender: 'user' as const
      };
      setMessages([newMessage]);
      setIsOpen(true);
      setShowDualChat(true);
    }
  }, [initialMessage]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const newMessage = {
      id: Date.now(),
      text: message,
      sender: 'user' as const
    };

    setMessages(prev => [...prev, newMessage]);
    setMessage('');

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        text: "AI-powered search responses coming soon! I'll help you find the perfect tools and solutions.",
        sender: 'ai' as const
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  return (
    <>
      {/* Chat Buttons */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-3">
        <Button
          onClick={() => setShowDualChat(!showDualChat)}
          className="w-14 h-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-all duration-300 hover:scale-105"
          size="icon"
          title="Chat"
        >
          {showDualChat ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        </Button>
      </div>

      {/* Dual Chat Tabs */}
      <DualChatTabs isOpen={showDualChat} onClose={() => setShowDualChat(false)} />

      {/* Chat Window - Remove old single chat window */}
      {/* DualChatTabs handles all chat functionality now */}
    </>
  );
};

export default AIChatBot;