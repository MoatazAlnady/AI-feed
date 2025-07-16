import React, { useState } from 'react';
import { X, Send, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface AIChatBotProps {
  initialMessage?: string;
  autoOpen?: boolean;
}

const AIChatBot = ({ initialMessage, autoOpen }: AIChatBotProps) => {
  const [isOpen, setIsOpen] = useState(autoOpen || false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{id: number, text: string, sender: 'user' | 'ai'}>>([]);

  // Handle initial message from search
  React.useEffect(() => {
    if (initialMessage && initialMessage.trim()) {
      const newMessage = {
        id: Date.now(),
        text: initialMessage,
        sender: 'user' as const
      };
      setMessages([newMessage]);
      setIsOpen(true);
      
      // Simulate AI response
      setTimeout(() => {
        const aiResponse = {
          id: Date.now() + 1,
          text: `I understand you're looking for: "${initialMessage}". AI-powered search responses coming soon! I'll help you find the perfect tools and solutions.`,
          sender: 'ai' as const
        };
        setMessages(prev => [...prev, aiResponse]);
      }, 1000);
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
      {/* Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white shadow-lg transition-all duration-300 hover:scale-105"
          size="icon"
        >
          {isOpen ? <X className="h-8 w-8" /> : <Bot className="h-10 w-10" />}
        </Button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-80 h-96 animate-slide-up">
          <Card className="h-full flex flex-col bg-background border shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b bg-gradient-primary text-white rounded-t-lg">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                <h3 className="font-semibold">AI Assistant</h3>
              </div>
              <p className="text-sm opacity-90">Ask me about AI tools and solutions</p>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm">
                  <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Hi! I'm your AI assistant.</p>
                  <p>What AI tools are you looking for?</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg text-sm ${
                        msg.sender === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask about AI tools..."
                  className="flex-1 px-3 py-2 text-sm border border-input rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                />
                <Button type="submit" size="sm" className="px-3">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </>
  );
};

export default AIChatBot;