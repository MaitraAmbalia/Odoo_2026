import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useSocket } from '../../hooks/useSocket';

export const AppShell: React.FC = () => {
  // Initialize Socket.io connection and listeners
  useSocket();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="pl-60">
        <main className="p-8 max-w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
