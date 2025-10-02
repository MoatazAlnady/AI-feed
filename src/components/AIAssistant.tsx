import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, X, Maximize2, Minimize2, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import useI18nGuard from '../hooks/useI18nGuard';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIAssistantProps {
  mode: 'creator' | 'employer';
  className?: string;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ mode, className = '' }) => {
  const { t } = useTranslation();
  useI18nGuard();
  
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Initial greeting message
  useEffect(() => {
    const initialMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: mode === 'creator' 
        ? `Hi ${user?.user_metadata?.full_name || 'there'}! I'm your AI Feed assistant. I can help you with information about AI tools, answer questions about the platform, or assist with your content creation. What can I help you with today?`
        : `Hello ${user?.user_metadata?.full_name || 'there'}! I'm your AI Feed talent assistant. I can help you find the right talent, create search queries, or answer questions about candidates. How can I assist your recruitment needs today?`,
      timestamp: new Date()
    };
    setMessages([initialMessage]);
  }, [mode, user]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const context = mode === 'creator' ? 'creator' : 'employer';
      const conversationHistory = messages.map(m => ({ role: m.role, content: m.content }));
      
      let assistantContent = "";
      const updateAssistant = (chunk: string) => {
        assistantContent += chunk;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => 
              i === prev.length - 1 
                ? { ...m, content: assistantContent, timestamp: new Date() } 
                : m
            );
          }
          return [...prev, { 
            id: (Date.now() + 1).toString(), 
            role: "assistant", 
            content: assistantContent,
            timestamp: new Date()
          }];
        });
      };

      const { streamChat } = await import('@/utils/aiStream');
      await streamChat({
        messages: [...conversationHistory, { role: 'user', content: userInput }],
        language: localStorage.getItem('preferredLocale') || 'en',
        context,
        onDelta: updateAssistant,
        onDone: () => setIsLoading(false),
        onError: (err) => {
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `Error: ${err}`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorMessage]);
          setIsLoading(false);
        },
      });
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error processing your request. Please try again later.",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleChat = () => {
    if (isMinimized) {
      setIsMinimized(false);
    } else {
      setIsOpen(!isOpen);
    }
  };

  const closeChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
  };

  const minimizeChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMinimized(!isMinimized);
  };

  const clearChat = () => {
    const initialMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: mode === 'creator' 
        ? `Hi ${user?.user_metadata?.full_name || 'there'}! I'm your AI Feed assistant. I can help you with information about AI tools, answer questions about the platform, or assist with your content creation. What can I help you with today?`
        : `Hello ${user?.user_metadata?.full_name || 'there'}! I'm your AI Feed talent assistant. I can help you find the right talent, create search queries, or answer questions about candidates. How can I assist your recruitment needs today?`,
      timestamp: new Date()
    };
    setMessages([initialMessage]);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Quick suggestions based on mode
  const suggestions = mode === 'creator' 
    ? [
        "How do I create a new AI tool?",
        "What makes a good article?",
        "How can I get verified?",
        "How do I check my analytics?"
      ]
    : [
        "Find Python developers with ML experience",
        "How do I post a job?",
        "What subscription plan is best for me?",
        "How can I contact candidates?"
      ];

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    setTimeout(() => {
      handleSubmit();
    }, 100);
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={toggleChat}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-lg z-40 transition-all duration-300 ${
          isOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-primary-500 hover:bg-primary-600'
        }`}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <Bot className="h-6 w-6 text-white" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div 
          ref={chatContainerRef}
          className={`fixed bottom-20 right-6 w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl z-40 transition-all duration-300 ${
            isMinimized ? 'h-16' : 'h-[600px] max-h-[80vh]'
          } ${className}`}
        >
          {/* Header */}
          <div 
            className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer"
            onClick={minimizeChat}
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {mode === 'creator' ? 'AI Feed Assistant' : 'Talent Search AI'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {mode === 'creator' 
                    ? 'Ask me about tools, content, or features' 
                    : 'Ask me about finding talent or posting jobs'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {!isMinimized && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    clearChat();
                  }}
                  className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title="Clear chat"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                  </svg>
                </button>
              )}
              <button 
                onClick={minimizeChat}
                className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                {isMinimized ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>
              <button 
                onClick={closeChat}
                className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto h-[calc(100%-8rem)] dark:bg-gray-800">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className="flex items-start space-x-2 max-w-[80%]">
                        {message.role === 'assistant' && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center flex-shrink-0">
                            <Bot className="h-4 w-4 text-white" />
                          </div>
                        )}
                        <div
                          className={`p-3 rounded-2xl ${
                            message.role === 'user'
                              ? 'bg-primary-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            message.role === 'user' ? 'text-primary-100' : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {formatTime(message.timestamp)}
                          </p>
                        </div>
                        {message.role === 'user' && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center flex-shrink-0">
                            <User className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="flex items-start space-x-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center flex-shrink-0">
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                        <div className="p-3 rounded-2xl bg-gray-100 dark:bg-gray-700">
                          <div className="flex space-x-2">
                            <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '600ms' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Quick Suggestions */}
              {messages.length <= 2 && (
                <div className="px-4 mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('auto.tryAsking')}</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <form onSubmit={handleSubmit} className="flex items-center space-x-2">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Ask the ${mode === 'creator' ? 'AI assistant' : 'talent assistant'} a question...`}
                    className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none max-h-24 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={1}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="p-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </form>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                  {mode === 'creator' 
                    ? 'AI assistant can help with platform features, tools, and content creation' 
                    : 'Talent assistant can help with finding candidates and optimizing job postings'}
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default AIAssistant;