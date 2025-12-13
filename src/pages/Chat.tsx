import React from 'react';
import { useTranslation } from 'react-i18next';
import PersonToPersonChat from '@/components/PersonToPesonChat';

const Chat = () => {
  const { t } = useTranslation();
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">{t('chatPage.title')}</h1>
          <p className="text-muted-foreground">{t('chatPage.subtitle')}</p>
        </div>
        
        <PersonToPersonChat />
      </div>
    </div>
  );
};

export default Chat;