import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAIChat } from '@/hooks/useAIChat';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';

interface AIChatProps {
  context?: string;
  initialGreeting?: string;
}

const AIChat: React.FC<AIChatProps> = ({ context = 'general', initialGreeting }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const { messages, isLoading, error, sendMessage, clearMessages } = useAIChat(context);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Initial greeting
  useEffect(() => {
    if (messages.length === 0) {
      const greeting = initialGreeting || 
        `Hi ${user?.user_metadata?.full_name || 'there'}! I'm your AI assistant. How can I help you today?`;
      // We don't add the greeting as a message anymore, just let the user start fresh
    }
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    await sendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const formatTime = (index: number) => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b bg-gradient-primary text-white">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <h3 className="font-semibold">{t('chat.aiAssistant', 'AI Assistant')}</h3>
        </div>
        <p className="text-sm opacity-90">
          {context === 'creator' && 'Ask me about AI tools and solutions'}
          {context === 'employer' && 'Ask me about finding talent'}
          {context === 'general' && 'How can I help you today?'}
        </p>
      </div>
      
      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto bg-background max-h-[calc(100%-140px)]">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-8">
            <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Welcome! 👋</p>
            <p>I'm here to help you with anything about AI Feed.</p>
            <p className="mt-2">Start by asking a question!</p>
          </div>
        )}
        
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className="flex items-start space-x-2 max-w-[85%]">
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                )}
                <div
                  className={`p-3 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  <p className={`text-xs mt-1 opacity-60`}>
                    {formatTime(index)}
                  </p>
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="p-3 rounded-2xl bg-muted">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '600ms' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {error && (
            <div className="text-center text-destructive text-sm py-2">
              {error}
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Input */}
      <div className="p-4 border-t bg-background">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('chat.typeMessage', 'Type your message...')}
            className="flex-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none max-h-24 bg-background"
            rows={1}
          />
          <Button
            type="submit"
            size="sm"
            disabled={!input.trim() || isLoading}
            className="px-3 flex items-center justify-center"
            title="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AIChat;
