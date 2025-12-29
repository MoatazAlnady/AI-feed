import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Send, 
  MoreVertical, 
  Phone, 
  Video, 
  Paperclip, 
  Smile,
  User,
  MessageCircle,
  Star,
  Archive,
  Filter,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  read: boolean;
  type: 'text' | 'attachment';
}

interface Conversation {
  id: string;
  participant: {
    id: string;
    name: string;
    avatar?: string;
    title?: string;
    online: boolean;
    company?: string;
  };
  lastMessage: Message;
  unreadCount: number;
  messages: Message[];
  category: 'candidate' | 'client' | 'team' | 'other';
  priority: 'high' | 'medium' | 'low';
  archived: boolean;
}

const EmployerMessages: React.FC = () => {
  const { user } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<'all' | 'candidate' | 'client' | 'team'>('all');
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, [user]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      
      // In real implementation, fetch from database
      // For now, show mock data for demonstration
      const mockConversations: Conversation[] = [
        {
          id: '1',
          participant: {
            id: 'candidate1',
            name: 'Sarah Johnson',
            avatar: '/api/placeholder/40/40',
            title: 'Senior Frontend Developer',
            online: true,
            company: 'Tech Corp'
          },
          lastMessage: {
            id: 'msg1',
            senderId: 'candidate1',
            content: 'Thank you for considering my application. I am very excited about this opportunity.',
            timestamp: '2025-01-16T14:30:00Z',
            read: false,
            type: 'text'
          },
          unreadCount: 2,
          messages: [
            {
              id: 'msg1',
              senderId: 'candidate1',
              content: 'Thank you for considering my application. I am very excited about this opportunity.',
              timestamp: '2025-01-16T14:30:00Z',
              read: false,
              type: 'text'
            },
            {
              id: 'msg2',
              senderId: user?.id || '',
              content: 'Hi Sarah, we\'d like to schedule an interview. Are you available next week?',
              timestamp: '2025-01-16T13:00:00Z',
              read: true,
              type: 'text'
            }
          ],
          category: 'candidate',
          priority: 'high',
          archived: false
        },
        {
          id: '2',
          participant: {
            id: 'candidate2',
            name: 'Michael Chen',
            avatar: '/api/placeholder/40/40',
            title: 'Full Stack Developer',
            online: false,
            company: 'StartupXYZ'
          },
          lastMessage: {
            id: 'msg3',
            senderId: user?.id || '',
            content: 'Could you provide more details about your experience with React?',
            timestamp: '2025-01-16T10:15:00Z',
            read: true,
            type: 'text'
          },
          unreadCount: 0,
          messages: [
            {
              id: 'msg3',
              senderId: user?.id || '',
              content: 'Could you provide more details about your experience with React?',
              timestamp: '2025-01-16T10:15:00Z',
              read: true,
              type: 'text'
            }
          ],
          category: 'candidate',
          priority: 'medium',
          archived: false
        }
      ];
      
      setConversations(mockConversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.lastMessage.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || conv.category === filterCategory;
    const matchesArchived = showArchived ? conv.archived : !conv.archived;
    
    return matchesSearch && matchesCategory && matchesArchived;
  });

  const selectedConv = conversations.find(conv => conv.id === selectedConversation);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      senderId: user?.id || '',
      content: newMessage,
      timestamp: new Date().toISOString(),
      read: true,
      type: 'text'
    };

    setConversations(prev => prev.map(conv => {
      if (conv.id === selectedConversation) {
        return {
          ...conv,
          messages: [...conv.messages, newMsg],
          lastMessage: newMsg
        };
      }
      return conv;
    }));

    setNewMessage('');
  };

  const markAsRead = (conversationId: string) => {
    setConversations(prev => prev.map(conv => {
      if (conv.id === conversationId) {
        return {
          ...conv,
          unreadCount: 0,
          messages: conv.messages.map(msg => ({ ...msg, read: true }))
        };
      }
      return conv;
    }));
  };

  const archiveConversation = (conversationId: string) => {
    setConversations(prev => prev.map(conv => 
      conv.id === conversationId ? { ...conv, archived: !conv.archived } : conv
    ));
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return formatTime(timestamp);
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Messages</h2>
          <p className="text-gray-600 dark:text-gray-400">Communicate with candidates and team members</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as any)}
              className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Messages</option>
              <option value="candidate">Candidates</option>
              <option value="client">Clients</option>
              <option value="team">Team</option>
            </select>
          </div>
          
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`flex items-center space-x-2 px-3 py-1 text-sm rounded-lg transition-colors ${
              showArchived 
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' 
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
            }`}
          >
            <Archive className="h-4 w-4" />
            <span>{showArchived ? 'Show Active' : 'Show Archived'}</span>
          </button>
        </div>
      </div>

      {/* Messages Interface */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden" style={{ height: 'calc(100vh - 280px)' }}>
        <div className="flex h-full">
          {/* Conversations List */}
          <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            {/* Search */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length > 0 ? (
                filteredConversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => {
                      setSelectedConversation(conversation.id);
                      if (conversation.unreadCount > 0) {
                        markAsRead(conversation.id);
                      }
                    }}
                    className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 ${
                      selectedConversation === conversation.id ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-700' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-white" />
                        </div>
                        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
                          conversation.participant.online ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                              {conversation.participant.name}
                            </h3>
                            <div className={`w-2 h-2 rounded-full ${getPriorityColor(conversation.priority)}`} />
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(conversation.lastMessage.timestamp)}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {conversation.participant.title}
                        </p>
                        
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {conversation.lastMessage.content}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <span className="bg-primary-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-8 text-center">
                  <MessageCircle className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {showArchived ? 'No archived conversations' : 'No conversations yet'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {showArchived 
                      ? 'Archived conversations will appear here.' 
                      : 'Start connecting with candidates to begin messaging.'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedConv ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
                        selectedConv.participant.online ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {selectedConv.participant.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedConv.participant.title} • {selectedConv.participant.online ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => archiveConversation(selectedConv.id)}
                      className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title={selectedConv.archived ? 'Unarchive' : 'Archive'}
                    >
                      <Archive className="h-5 w-5" />
                    </button>
                    <button className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                      <Phone className="h-5 w-5" />
                    </button>
                    <button className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                      <Video className="h-5 w-5" />
                    </button>
                    <button className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {selectedConv.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className="max-w-xs lg:max-w-md">
                        <div
                          className={`px-4 py-2 rounded-2xl ${
                            message.senderId === user?.id
                              ? 'bg-primary-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTime(message.timestamp)}
                          </p>
                          {message.senderId === user?.id && (
                            <div className="flex items-center space-x-1">
                              {message.read ? (
                                <CheckCircle className="h-3 w-3 text-primary-500" />
                              ) : (
                                <Clock className="h-3 w-3 text-gray-400" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                    <button
                      type="button"
                      className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Paperclip className="h-5 w-5" />
                    </button>
                    
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-full focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <Smile className="h-5 w-5" />
                      </button>
                    </div>
                    
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="p-2 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              /* No conversation selected */
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Select a conversation
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Choose a conversation from the list to start messaging.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployerMessages;