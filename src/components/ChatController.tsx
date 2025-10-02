import { useChatDock } from '@/context/ChatDockContext';

// Global chat controller utility
export const useChatController = () => {
  const { openChatWith } = useChatDock();
  
  return {
    openChatWith
  };
};

// Export singleton function for global access
let globalOpenChatWith: ((userId: string, opts?: { createIfMissing?: boolean }) => Promise<boolean>) | null = null;

export const setGlobalChatController = (openChatWith: (userId: string, opts?: { createIfMissing?: boolean }) => Promise<boolean>) => {
  globalOpenChatWith = openChatWith;
};

export const openChatWith = async (userId: string, opts?: { createIfMissing?: boolean }): Promise<boolean> => {
  if (!globalOpenChatWith) {
    throw new Error('Chat controller not initialized');
  }
  return globalOpenChatWith(userId, opts);
};