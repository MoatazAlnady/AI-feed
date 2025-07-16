import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-[#0d1b2a] dark:text-gray-100">
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default AppLayout;