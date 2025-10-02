import React, { useState } from 'react';
import { Users, Bot, MessageCircle, Send, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useChatDock } from '@/context/ChatDockContext';
import AIChat from './AIChat';

interface DualChatTabsProps {
  isOpen: boolean;
  onClose: () => void;
}

const DualChatTabs: React.FC<DualChatTabsProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('creator');
  const [newMessage, setNewMessage] = useState('');
  const {
    threads,
    activeThreadId,
    setActiveThreadId,
    messages,
    sendMessage,
    searchQuery,
    setSearchQuery,
    filteredThreads,
    loading
  } = useChatDock();

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-24 z-40 w-96 h-[500px] animate-slide-up">
      <Card className="h-full flex flex-col bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-2xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800">
            <TabsTrigger value="creator" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Creator Chat</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center space-x-2">
              <Bot className="h-4 w-4" />
              <span>AI Assistant</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="creator" className="flex-1 p-0 min-h-0">
            <div className="h-full flex flex-col min-h-0">
              {!activeThreadId ? (
                <div className="flex-1 flex flex-col">
                  {/* Search */}
                  <div className="p-4 border-b">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  {/* Thread List */}
                  <div className="flex-1 overflow-y-auto">
                    {loading ? (
                      <div className="p-4 text-center text-gray-500">Loading...</div>
                    ) : filteredThreads.length === 0 ? (
                      <div className="p-4 text-center">
                        <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-500 text-sm">No conversations yet</p>
                        <p className="text-gray-400 text-xs mt-1">Click "Message" on any profile to start chatting</p>
                      </div>
                    ) : (
                      filteredThreads.map((thread) => (
                        <div
                          key={thread.id}
                          onClick={() => setActiveThreadId(thread.id)}
                          className="p-3 border-b hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden">
                              {thread.participants[0]?.avatar ? (
                                <img 
                                  src={thread.participants[0].avatar} 
                                  alt={thread.participants[0].name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500">
                                  <Users className="h-5 w-5" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {thread.participants[0]?.name || 'Deleted User'}
                                </p>
                                <span className="text-xs text-gray-500">
                                  {new Date(thread.lastMessage.timestamp).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                                {thread.lastMessage.content}
                              </p>
                            </div>
                            {thread.unreadCount > 0 && (
                              <div className="w-2 h-2 bg-primary rounded-full"></div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                /* Chat View */
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Chat Header */}
                  <div className="p-4 border-b flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveThreadId(null)}
                        className="p-1"
                      >
                        ←
                      </Button>
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden">
                        {threads.find(t => t.id === activeThreadId)?.participants[0]?.avatar ? (
                          <img 
                            src={threads.find(t => t.id === activeThreadId)?.participants[0]?.avatar} 
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500">
                            <Users className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {threads.find(t => t.id === activeThreadId)?.participants[0]?.name || 'Deleted User'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {threads.find(t => t.id === activeThreadId)?.participants[0]?.title}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Messages */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3 min-h-0">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.senderId === activeThreadId ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg text-sm ${
                            message.senderId === activeThreadId
                              ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                              : 'bg-primary text-primary-foreground'
                          }`}
                        >
                          {message.content}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Message Input */}
                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            if (newMessage.trim() && activeThreadId) {
                              sendMessage(activeThreadId, newMessage);
                              setNewMessage('');
                            }
                          }
                        }}
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          if (newMessage.trim() && activeThreadId) {
                            sendMessage(activeThreadId, newMessage);
                            setNewMessage('');
                          }
                        }}
                        disabled={!newMessage.trim()}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="ai" className="flex-1 p-0 min-h-0">
            <AIChat context="creator" />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default DualChatTabs;