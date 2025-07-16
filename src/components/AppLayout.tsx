import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 text-gray-900 dark:bg-gradient-to-br dark:from-slate-800 dark:via-indigo-900 dark:to-purple-900 dark:text-gray-100">
      <div className="brand-canvas"></div>
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default AppLayout;