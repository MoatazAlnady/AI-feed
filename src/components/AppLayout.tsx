import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AIChatBot from '@/components/ChatDock';
import MultiChatDock from '@/components/MultiChatDock';

const AppLayout: React.FC = () => {
  const location = useLocation();
  
  // Show chat globally (removed path restriction)
  const showChat = true;

  return (
    <div className="min-h-screen text-foreground">
      {/* Light mode orbs */}
      <div className="orb light-only h-[240px] w-[240px] top-10 left-10" style={{ backgroundColor: 'hsl(var(--c-amber))' }}></div>
      <div className="orb light-only h-[300px] w-[300px] top-1/2 -left-24" style={{ backgroundColor: 'hsl(var(--c-cyan))' }}></div>
      <div className="orb light-only h-[200px] w-[200px] bottom-20 right-10" style={{ backgroundColor: 'hsl(var(--c-indigo))' }}></div>

      {/* Dark mode orbs */}
      <div className="orb dark-only h-[260px] w-[260px] top-20 right-32 hidden" style={{ backgroundColor: 'hsl(var(--c-violet))' }}></div>
      <div className="orb dark-only h-[320px] w-[320px] bottom-16 left-16 hidden" style={{ backgroundColor: 'hsl(var(--c-cyan))' }}></div>

      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
      
      {/* Global Chat Widget */}
      {showChat && <AIChatBot />}
      
      {/* Multi-window Chat Dock */}
      <MultiChatDock />
    </div>
  );
};

export default AppLayout;