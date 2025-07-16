import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen text-gray-900 dark:text-gray-100 overflow-x-hidden">
      <Header />
      <main className="w-full">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default AppLayout;