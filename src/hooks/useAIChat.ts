import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { streamChat } from '@/utils/aiStream';

type Message = { role: "user" | "assistant"; content: string };

export function useAIChat(context: string = 'general') {
  const { i18n } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (userInput: string) => {
    if (!userInput.trim()) return;

    const userMsg: Message = { role: "user", content: userInput };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);

    let assistantContent = "";
    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => 
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        return [...prev, { role: "assistant", content: assistantContent }];
      });
    };

    try {
      await streamChat({
        messages: [...messages, userMsg],
        language: i18n.language,
        context,
        onDelta: updateAssistant,
        onDone: () => setIsLoading(false),
        onError: (err) => {
          setError(err);
          setIsLoading(false);
        },
      });
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Failed to send message");
      setIsLoading(false);
    }
  }, [messages, context, i18n.language]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isLoading, error, sendMessage, clearMessages };
}
