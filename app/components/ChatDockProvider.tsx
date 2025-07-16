import { createContext, useContext, useState, ReactNode } from 'react';

interface ChatDockContextType {
  isOpen: boolean;
  toggleChat: () => void;
  messages: Array<{ id: string; text: string; sender: 'user' | 'bot' }>;
  addMessage: (text: string, sender: 'user' | 'bot') => void;
}

const ChatDockContext = createContext<ChatDockContextType | undefined>(undefined);

export function ChatDockProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ id: string; text: string; sender: 'user' | 'bot' }>>([]);

  const toggleChat = () => setIsOpen(!isOpen);

  const addMessage = (text: string, sender: 'user' | 'bot') => {
    const newMessage = {
      id: Math.random().toString(36).substr(2, 9),
      text,
      sender,
    };
    setMessages(prev => [...prev, newMessage]);
  };

  return (
    <ChatDockContext.Provider value={{ isOpen, toggleChat, messages, addMessage }}>
      {children}
    </ChatDockContext.Provider>
  );
}

export const useChatDock = () => {
  const context = useContext(ChatDockContext);
  if (context === undefined) {
    throw new Error('useChatDock must be used within a ChatDockProvider');
  }
  return context;
};