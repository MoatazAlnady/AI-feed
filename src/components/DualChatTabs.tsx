import React, { useState } from 'react';
import { Users, Bot, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AIChatBot from './ChatDock';

interface DualChatTabsProps {
  isOpen: boolean;
  onClose: () => void;
}

const DualChatTabs: React.FC<DualChatTabsProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('creator');

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 z-40 w-96 h-[500px] animate-slide-up">
      <Card className="h-full flex flex-col bg-white dark:bg-[#0a1426] border border-gray-200 dark:border-gray-700 shadow-2xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
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
          
          <TabsContent value="creator" className="flex-1 p-4">
            <div className="h-full flex flex-col">
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Creator Chat
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  Connect with other creators in the community
                </p>
                <Button variant="outline" className="w-full">
                  Start Conversation
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="ai" className="flex-1 p-0">
            <div className="h-full flex flex-col">
              <div className="p-4 border-b bg-gradient-primary text-white">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  <h3 className="font-semibold">AI Assistant</h3>
                </div>
                <p className="text-sm opacity-90">Ask me about AI tools and solutions</p>
              </div>
              
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="text-center text-muted-foreground text-sm">
                  <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Hi! I'm your AI assistant.</p>
                  <p>What AI tools are you looking for?</p>
                </div>
              </div>
              
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ask about AI tools..."
                    className="flex-1 px-3 py-2 text-sm border border-input rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                  />
                  <Button size="sm" className="px-3">
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default DualChatTabs;