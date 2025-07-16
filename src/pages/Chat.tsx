import React from 'react';
import PersonToPersonChat from '@/components/PersonToPesonChat';

const Chat = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="text-muted-foreground">Connect and chat with other members of the community</p>
        </div>
        
        <PersonToPersonChat />
      </div>
    </div>
  );
};

export default Chat;