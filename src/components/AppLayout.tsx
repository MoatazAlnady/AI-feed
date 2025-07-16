import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen text-gray-900 dark:text-gray-100">
      {/* Light mode orbs */}
      <div className="orb h-[240px] w-[240px] top-10 left-10 dark:hidden" style={{ backgroundColor: 'hsl(var(--c-amber))' }}></div>
      <div className="orb h-[300px] w-[300px] top-1/2 -left-24 dark:hidden" style={{ backgroundColor: 'hsl(var(--c-cyan))' }}></div>
      <div className="orb h-[200px] w-[200px] bottom-20 right-10 dark:hidden" style={{ backgroundColor: 'hsl(var(--c-indigo))' }}></div>

      {/* Dark mode orbs */}
      <div className="orb h-[260px] w-[260px] top-20 right-32 hidden dark:block" style={{ backgroundColor: 'hsl(var(--c-violet))' }}></div>
      <div className="orb h-[320px] w-[320px] bottom-16 left-16 hidden dark:block" style={{ backgroundColor: 'hsl(var(--c-cyan))' }}></div>

      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default AppLayout;