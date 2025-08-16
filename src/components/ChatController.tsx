import { useChatDock } from '@/context/ChatDockContext';

// Global chat controller utility
export const useChatController = () => {
  const { openChatWith } = useChatDock();
  
  return {
    openChatWith
  };
};

// Export singleton function for global access
let globalOpenChatWith: ((userId: string, opts?: { createIfMissing?: boolean }) => Promise<void>) | null = null;

export const setGlobalChatController = (openChatWith: (userId: string, opts?: { createIfMissing?: boolean }) => Promise<void>) => {
  globalOpenChatWith = openChatWith;
};

export const openChatWith = async (userId: string, opts?: { createIfMissing?: boolean }) => {
  if (!globalOpenChatWith) {
    throw new Error('Chat controller not initialized');
  }
  return globalOpenChatWith(userId, opts);
};