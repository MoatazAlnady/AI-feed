import React, { useState, useEffect } from 'react';
import { MessageCircle, X, Bot, Send, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface ChatDockProps {
  className?: string;
}

interface ChatItem {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  isAI: boolean;
  avatar: string;
}

const ChatDock: React.FC<ChatDockProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chats' | 'ai'>('chats');
  const [message, setMessage] = useState('');
  const [aiMessages, setAiMessages] = useState<Array<{id: number, text: string, sender: 'user' | 'ai'}>>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user && isOpen && activeTab === 'chats') {
      fetchConversations();
    }
  }, [user, isOpen, activeTab]);

  const fetchConversations = async () => {
    if (!user) return;
    setChatsLoading(true);

    try {
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          id, last_message_at,
          participant_1:user_profiles!conversations_participant_1_id_fkey(id, full_name, profile_photo),
          participant_2:user_profiles!conversations_participant_2_id_fkey(id, full_name, profile_photo)
        `)
        .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching conversations:', error);
        return;
      }

      const formattedChats: ChatItem[] = await Promise.all((conversations || []).map(async (conv: any) => {
        const other = conv.participant_1?.id === user.id ? conv.participant_2 : conv.participant_1;
        
        // Get last message
        const { data: lastMsg } = await supabase
          .from('conversation_messages')
          .select('body, created_at')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        const name = other?.full_name || 'Unknown';
        const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

        return {
          id: conv.id,
          name,
          lastMessage: lastMsg?.body || 'No messages yet',
          time: formatDistanceToNow(new Date(lastMsg?.created_at || conv.last_message_at), { addSuffix: false }),
          unread: 0,
          isAI: false,
          avatar: initials
        };
      }));

      setChats(formattedChats);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setChatsLoading(false);
    }
  };

  const handleSendAiMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || aiLoading) return;

    const newMessage = {
      id: Date.now(),
      text: message,
      sender: 'user' as const
    };

    setAiMessages(prev => [...prev, newMessage]);
    setMessage('');
    setAiLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { 
          message: newMessage.text,
          userId: user?.id,
          context: 'platform_assistant'
        }
      });

      if (error) throw error;

      const aiResponse = {
        id: Date.now() + 1,
        text: data?.response || "I'm here to help you with any questions about AI tools, creators, or platform features. What would you like to know?",
        sender: 'ai' as const
      };
      setAiMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('AI chat error:', error);
      const aiResponse = {
        id: Date.now() + 1,
        text: "I'm here to help you with any questions about AI tools, creators, or platform features. What would you like to know?",
        sender: 'ai' as const
      };
      setAiMessages(prev => [...prev, aiResponse]);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105"
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 h-96 bg-card border border-border rounded-lg shadow-xl animate-slide-up">
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
                {chatsLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : chats.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm p-4 text-center">
                    <MessageCircle className="h-8 w-8 mb-2 opacity-50" />
                    <p>No conversations yet</p>
                    <p className="text-xs">Start messaging someone!</p>
                  </div>
                ) : (
                  chats.map((chat) => (
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
                  ))
                )}
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
                  {aiLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted text-foreground p-2 rounded-lg">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    </div>
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
                       disabled={aiLoading}
                       className="flex-1 px-3 py-2 text-sm border border-input rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground disabled:opacity-50"
                     />
                     <button
                       type="submit"
                       disabled={aiLoading || !message.trim()}
                       className="px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
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