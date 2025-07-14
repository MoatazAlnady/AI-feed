import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, 
  Search, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Send, 
  User,
  Paperclip,
  Smile,
  Settings,
  Pin,
  MinusSquare,
  Clock,
  Check,
  CheckCheck
} from 'lucide-react';
import { useChatDock } from '@/context/ChatDockContext';
import { useAuth } from '@/context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

const ChatDock: React.FC = () => {
  const { user } = useAuth();
  const { 
    isOpen, 
    toggleOpen, 
    minimized, 
    toggleMinimized,
    threads,
    activeThreadId,
    setActiveThreadId,
    messages,
    sendMessage,
    loadMoreMessages,
    searchQuery,
    setSearchQuery,
    filteredThreads,
    unreadCount,
    activeTab,
    setActiveTab,
    loading
  } = useChatDock();
  
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Focus input when thread is opened
  useEffect(() => {
    if (activeThreadId && !minimized && isOpen) {
      messageInputRef.current?.focus();
    }
  }, [activeThreadId, minimized, isOpen]);
  
  // Set up keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k' && isOpen && !minimized) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      
      // Esc to close active thread or minimize
      if (e.key === 'Escape') {
        if (activeThreadId) {
          setActiveThreadId(null);
        } else if (isOpen && !minimized) {
          toggleMinimized();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, minimized, activeThreadId, setActiveThreadId, toggleMinimized]);
  
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (activeThreadId && newMessage.trim()) {
      sendMessage(activeThreadId, newMessage);
      setNewMessage('');
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+Enter or Cmd+Enter to send
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
    
    // Shift+Enter for new line
    if (e.shiftKey && e.key === 'Enter') {
      // Default behavior (new line)
      return;
    }
    
    // Enter without shift to send
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return timestamp;
    }
  };
  
  // Don't render anything if user is not logged in
  if (!user) return null;
  
  return (
    <>
      {/* Chat Button with Notification Badge */}
      <button
        onClick={toggleOpen}
        className="fixed bottom-6 right-6 p-4 rounded-full shadow-lg z-40 transition-all duration-300 bg-primary-500 hover:bg-primary-600 text-white lg:flex hidden"
        aria-label="Open messaging"
      >
        <MessageCircle className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
      
      {/* Chat Dock */}
      {isOpen && (
        <div 
          className={`fixed bottom-0 right-6 w-80 bg-white dark:bg-gray-800 rounded-t-xl shadow-xl z-40 transition-all duration-300 lg:flex hidden
            ${minimized ? 'h-12' : 'h-[500px]'}`}
          role="dialog"
          aria-labelledby="chat-dock-title"
        >
          {/* Header */}
          <div 
            className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 cursor-pointer"
            onClick={toggleMinimized}
          >
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5 text-primary-500 dark:text-primary-400" />
              <h3 
                id="chat-dock-title"
                className="font-semibold text-gray-900 dark:text-white"
              >
                Messaging
                {unreadCount > 0 && ` (${unreadCount})`}
              </h3>
            </div>
            <div className="flex items-center space-x-1">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  // Open settings
                  window.location.href = '/settings';
                }}
                className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                aria-label="Messaging settings"
              >
                <Settings className="h-4 w-4" />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMinimized();
                }}
                className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                aria-label={minimized ? "Expand messaging" : "Minimize messaging"}
              >
                {minimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleOpen();
                }}
                className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                aria-label="Close messaging"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {!minimized && (
            <div className="flex flex-col h-[calc(100%-48px)]">
              {activeThreadId ? (
                <ActiveThread 
                  threadId={activeThreadId}
                  onBack={() => setActiveThreadId(null)}
                  messages={messages}
                  newMessage={newMessage}
                  setNewMessage={setNewMessage}
                  handleSendMessage={handleSendMessage}
                  handleKeyDown={handleKeyDown}
                  messagesEndRef={messagesEndRef}
                  messageInputRef={messageInputRef}
                  formatTime={formatTime}
                  threads={threads}
                />
              ) : (
                <ThreadList 
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  filteredThreads={filteredThreads}
                  setActiveThreadId={setActiveThreadId}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  loading={loading}
                  formatTime={formatTime}
                  searchInputRef={searchInputRef}
                />
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};

interface ThreadListProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredThreads: any[];
  setActiveThreadId: (id: string | null) => void;
  activeTab: 'focused' | 'other';
  setActiveTab: (tab: 'focused' | 'other') => void;
  loading: boolean;
  formatTime: (timestamp: string) => string;
  searchInputRef: React.RefObject<HTMLInputElement>;
}

const ThreadList: React.FC<ThreadListProps> = ({
  searchQuery,
  setSearchQuery,
  filteredThreads,
  setActiveThreadId,
  activeTab,
  setActiveTab,
  loading,
  formatTime,
  searchInputRef
}) => {
  return (
    <>
      {/* Search */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('focused')}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            activeTab === 'focused'
              ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          Focused
        </button>
        <button
          onClick={() => setActiveTab('other')}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            activeTab === 'other'
              ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          Other
        </button>
      </div>
      
      {/* Thread List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600 dark:border-primary-400"></div>
          </div>
        ) : filteredThreads.length > 0 ? (
          filteredThreads.map((thread) => {
            const participant = thread.participants[0];
            return (
              <button
                key={thread.id}
                onClick={() => setActiveThreadId(thread.id)}
                className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0 flex items-start space-x-3"
              >
                <div className="relative flex-shrink-0">
                  {participant.avatar ? (
                    <img
                      src={participant.avatar}
                      alt={participant.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                  )}
                  <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
                    participant.online ? 'bg-green-500' : 'bg-gray-400'
                  }`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                      {participant.name}
                    </h4>
                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {formatTime(thread.lastMessage.timestamp)}
                    </span>
                  </div>
                  
                  {participant.title && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {participant.title}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                      {thread.lastMessage.senderId === participant.id ? '' : 'You: '}
                      {thread.lastMessage.content}
                    </p>
                    {thread.unreadCount > 0 && (
                      <span className="bg-primary-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                        {thread.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <MessageCircle className="h-8 w-8 text-gray-300 dark:text-gray-600 mb-2" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {searchQuery 
                ? 'No conversations match your search' 
                : activeTab === 'focused'
                  ? 'No focused conversations yet'
                  : 'No other conversations yet'}
            </p>
          </div>
        )}
      </div>
    </>
  );
};

interface ActiveThreadProps {
  threadId: string;
  onBack: () => void;
  messages: any[];
  newMessage: string;
  setNewMessage: (message: string) => void;
  handleSendMessage: (e?: React.FormEvent) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  messageInputRef: React.RefObject<HTMLTextAreaElement>;
  formatTime: (timestamp: string) => string;
  threads: any[];
}

const ActiveThread: React.FC<ActiveThreadProps> = ({
  threadId,
  onBack,
  messages,
  newMessage,
  setNewMessage,
  handleSendMessage,
  handleKeyDown,
  messagesEndRef,
  messageInputRef,
  formatTime,
  threads
}) => {
  const { user } = useAuth();
  const thread = threads.find(t => t.id === threadId);
  const participant = thread?.participants[0];
  
  if (!thread || !participant) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-gray-500 dark:text-gray-400">Conversation not found</p>
        <button
          onClick={onBack}
          className="mt-2 text-primary-600 dark:text-primary-400 hover:underline"
        >
          Back to messages
        </button>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Thread Header */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <button
          onClick={onBack}
          className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        >
          <ChevronDown className="h-5 w-5" />
        </button>
        
        <div className="flex items-center space-x-2">
          {participant.avatar ? (
            <img
              src={participant.avatar}
              alt={participant.name}
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <div className="w-6 h-6 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
              <User className="h-3 w-3 text-white" />
            </div>
          )}
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white text-sm">
              {participant.name}
            </h4>
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          <button className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
            <Pin className="h-4 w-4" />
          </button>
          <button className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
            <MinusSquare className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-3 py-2 rounded-lg ${
                message.senderId === user?.id
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <div className={`flex items-center justify-end mt-1 text-xs ${
                message.senderId === user?.id 
                  ? 'text-primary-100' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                <span>{formatTime(message.timestamp)}</span>
                {message.senderId === user?.id && (
                  <span className="ml-1">
                    {message.read ? (
                      <CheckCheck className="h-3 w-3" />
                    ) : (
                      <Check className="h-3 w-3" />
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message Input */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
          <button
            type="button"
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          
          <div className="flex-1 relative">
            <textarea
              ref={messageInputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={1}
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
            <button
              type="button"
              className="absolute right-2 bottom-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <Smile className="h-5 w-5" />
            </button>
          </div>
          
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="p-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-center">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
};

export default ChatDock;