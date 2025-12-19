import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Crown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAIChat } from '@/hooks/useAIChat';
import { useAIChatUsage } from '@/hooks/useAIChatUsage';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface AIChatProps {
  context?: string;
  initialGreeting?: string;
}

const AIChat: React.FC<AIChatProps> = ({ context = 'general', initialGreeting }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const { messages, isLoading, error, sendMessage, clearMessages } = useAIChat(context);
  const { 
    promptsUsed, 
    dailyLimit, 
    remainingPrompts, 
    isLimitReached, 
    isLoading: isUsageLoading,
    incrementUsage 
  } = useAIChatUsage();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading || isLimitReached) return;

    // Increment usage first
    const canProceed = await incrementUsage();
    if (!canProceed) {
      return;
    }

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
    <div className="h-full flex flex-col min-h-0">
      <div className="p-4 border-b bg-gradient-primary text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            <h3 className="font-semibold">{t('chat.aiAssistant', 'AI Assistant')}</h3>
          </div>
          {user && !isUsageLoading && (
            <div className="flex items-center gap-2 text-xs bg-white/20 px-2 py-1 rounded-full">
              <Sparkles className="h-3 w-3" />
              <span>{remainingPrompts}/{dailyLimit} {t('chat.promptsLeft', 'left')}</span>
            </div>
          )}
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
            {user && (
              <p className="mt-4 text-xs text-muted-foreground">
                {dailyLimit === 1 
                  ? t('chat.freeUserLimit', 'Free users: 1 prompt/day')
                  : t('chat.premiumUserLimit', 'Premium users: 10 prompts/day')}
              </p>
            )}
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
      
      {/* Rate Limit Warning */}
      {user && isLimitReached && (
        <div className="px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-3">
            <Crown className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                {t('chat.limitReached', 'Daily limit reached')}
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {dailyLimit === 1 
                  ? t('chat.upgradePremiumMessage', 'Upgrade to Premium for 10 prompts/day')
                  : t('chat.comeBackTomorrow', 'Come back tomorrow for more prompts')}
              </p>
            </div>
            {dailyLimit === 1 && (
              <Button
                size="sm"
                onClick={() => navigate('/upgrade')}
                className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white"
              >
                {t('premium.upgrade', 'Upgrade')}
              </Button>
            )}
          </div>
        </div>
      )}
      
      {/* Input */}
      <div className="p-4 border-t bg-background">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isLimitReached 
                ? t('chat.limitReachedPlaceholder', 'Daily limit reached...') 
                : t('chat.typeMessage', 'Type your message...')
            }
            disabled={isLimitReached}
            className="flex-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none max-h-24 bg-background disabled:opacity-50 disabled:cursor-not-allowed"
            rows={1}
          />
          <Button
            type="submit"
            size="sm"
            disabled={!input.trim() || isLoading || isLimitReached}
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
