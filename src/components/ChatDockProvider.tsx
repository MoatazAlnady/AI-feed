import React, { useState } from 'react';
import { MessageCircle, X, Bot, Search, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ChatDockProps {
  className?: string;
}

const ChatDock: React.FC<ChatDockProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chats' | 'ai'>('chats');
  const [message, setMessage] = useState('');
  const [aiMessages, setAiMessages] = useState<Array<{id: number, text: string, sender: 'user' | 'ai'}>>([]);
  const { user } = useAuth();

  // Mock chat data
  const chats = [
    {
      id: 1,
      name: 'AI Assistant',
      lastMessage: 'How can I help you today?',
      time: 'now',
      unread: 0,
      isAI: true,
      avatar: '🤖'
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      lastMessage: 'Great article about AI trends!',
      time: '2h',
      unread: 2,
      isAI: false,
      avatar: 'SJ'
    },
    {
      id: 3,
      name: 'Alex Chen',
      lastMessage: 'Thanks for the tool recommendation',
      time: '1d',
      unread: 0,
      isAI: false,
      avatar: 'AC'
    }
  ];

  const handleSendAiMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const newMessage = {
      id: Date.now(),
      text: message,
      sender: 'user' as const
    };

    setAiMessages(prev => [...prev, newMessage]);
    setMessage('');

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        text: "I'm here to help you with any questions about AI tools, creators, or platform features. What would you like to know?",
        sender: 'ai' as const
      };
      setAiMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 h-96 bg-background border border-border rounded-lg shadow-xl animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Messages</h3>
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveTab('chats')}
                className={`px-3 py-1 text-xs rounded ${
                  activeTab === 'chats' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Chats
              </button>
              <button
                onClick={() => setActiveTab('ai')}
                className={`px-3 py-1 text-xs rounded ${
                  activeTab === 'ai' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                AI
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'chats' ? (
              <div className="h-80 overflow-y-auto">
                {chats.map((chat) => (
                  <div
                    key={chat.id}
                    className="flex items-center space-x-3 p-3 hover:bg-muted/50 cursor-pointer border-b border-border/50"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {chat.isAI ? (
                        <Bot className="h-5 w-5 text-primary" />
                      ) : (
                        <span className="text-sm font-medium text-foreground">{chat.avatar}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground truncate">{chat.name}</p>
                        <span className="text-xs text-muted-foreground">{chat.time}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{chat.lastMessage}</p>
                    </div>
                    {chat.unread > 0 && (
                      <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-1 min-w-[1.25rem] h-5 flex items-center justify-center">
                        {chat.unread}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-80 flex flex-col">
                {/* AI Messages */}
                <div className="flex-1 p-3 overflow-y-auto space-y-3">
                  {aiMessages.length === 0 ? (
                    <div className="text-center text-muted-foreground text-sm">
                      <Bot className="h-8 w-8 mx-auto mb-2 text-primary/50" />
                      <p>Hi! I'm your AI assistant.</p>
                      <p>Ask me anything about the platform!</p>
                    </div>
                  ) : (
                    aiMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-2 rounded-lg text-sm ${
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

                {/* AI Input */}
                <form onSubmit={handleSendAiMessage} className="p-3 border-t border-border">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Ask AI assistant..."
                      className="flex-1 px-3 py-2 text-sm border border-input rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                    />
                    <button
                      type="submit"
                      className="px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatDock;