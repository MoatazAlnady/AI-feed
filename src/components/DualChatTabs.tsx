import React, { useState, useEffect } from 'react';
import { Bot, X, MessageCircle, Search, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import AIChat from './AIChat';
import { useAuth } from '@/context/AuthContext';
import { useChatDock } from '@/context/ChatDockContext';
import { format } from 'date-fns';

interface DualChatTabsProps {
  isOpen: boolean;
  onClose: () => void;
}

const DualChatTabs: React.FC<DualChatTabsProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { connections, onlineUsers, refreshConnections, loading } = useChatDock();
  const [activeTab, setActiveTab] = useState('chats');
  const [searchTerm, setSearchTerm] = useState('');

  // Refresh connections when tab opens
  useEffect(() => {
    if (isOpen && user) {
      refreshConnections();
    }
  }, [isOpen, user, refreshConnections]);

  const handleOpenChat = (userId: string) => {
    // Open chat via MultiChatDock's global API
    if (window.chatDock?.openChatWith) {
      window.chatDock.openChatWith(userId);
    } else if (window.chatDock?.open) {
      window.chatDock.open(userId);
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      
      if (days === 0) return format(date, 'HH:mm');
      if (days === 1) return 'Yesterday';
      if (days < 7) return format(date, 'EEE');
      return format(date, 'MMM d');
    } catch {
      return '';
    }
  };

  // Filter connections based on search term
  const filteredConnections = connections.filter(conn =>
    conn.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalUnread = connections.reduce((acc, conn) => acc + conn.unreadCount, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 z-40 w-96 h-[500px] animate-slide-up">
      <Card className="h-full flex flex-col bg-card border border-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-3 border-b flex items-center justify-between bg-primary/5">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <TabsList className="grid w-full grid-cols-2 h-9">
              <TabsTrigger value="chats" className="text-sm relative">
                <MessageCircle className="h-4 w-4 mr-1.5" />
                Chats
                {totalUnread > 0 && (
                  <Badge variant="destructive" className="ml-1.5 h-5 min-w-[20px] px-1.5 text-xs">
                    {totalUnread}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="ai" className="text-sm">
                <Bot className="h-4 w-4 mr-1.5" />
                AI Assistant
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 ml-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 bg-card">
          {activeTab === 'chats' ? (
            <div className="h-full flex flex-col">
              {/* Search */}
              <div className="p-3 border-b bg-card">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search connections..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              {/* Connections List */}
              <ScrollArea className="flex-1 bg-card">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : filteredConnections.length > 0 ? (
                  <div className="divide-y divide-border">
                    {filteredConnections.map((conn) => {
                      // Use onlineUsers from context for real-time status
                      const isOnline = onlineUsers.has(conn.id);
                      
                      return (
                        <button
                          key={conn.id}
                          onClick={() => handleOpenChat(conn.id)}
                          className="w-full p-3 text-left hover:bg-muted/50 transition-colors bg-card"
                        >
                          <div className="flex items-start space-x-3">
                            <div className="relative flex-shrink-0">
                              {conn.avatar ? (
                                <img
                                  src={conn.avatar}
                                  alt={conn.name || ''}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                                  <User className="h-5 w-5 text-primary-foreground" />
                                </div>
                              )}
                              {/* Online indicator - using real presence data */}
                              <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-card rounded-full ${
                                isOnline ? 'bg-green-500' : 'bg-muted-foreground/50'
                              }`} />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h3 className="font-medium text-sm text-foreground truncate">
                                  {conn.name || 'Unknown User'}
                                </h3>
                                <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                                  {conn.lastMessage ? formatTime(conn.lastMessage.timestamp) : ''}
                                </span>
                              </div>
                              
                              <div className="flex items-center justify-between mt-0.5">
                                <p className="text-xs text-muted-foreground truncate pr-2">
                                  {conn.lastMessage?.content || 'Start a conversation'}
                                </p>
                                {conn.unreadCount > 0 && (
                                  <Badge variant="default" className="h-5 min-w-[20px] px-1.5 text-xs flex-shrink-0">
                                    {conn.unreadCount}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-card">
                    <MessageCircle className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                    <h3 className="font-medium text-foreground text-sm mb-1">No connections</h3>
                    <p className="text-muted-foreground text-xs">
                      Connect with people to start chatting
                    </p>
                  </div>
                )}
              </ScrollArea>
            </div>
          ) : (
            <AIChat context="general" />
          )}
        </div>
      </Card>
    </div>
  );
};

// Extend window for global chat API
declare global {
  interface Window {
    chatDock?: {
      open: (userId: string) => Promise<boolean>;
      openChatWith: (userId: string) => Promise<boolean>;
      close: (conversationId: string) => void;
      minimize: (conversationId: string) => void;
      focus: (conversationId: string) => void;
    };
  }
}

export default DualChatTabs;