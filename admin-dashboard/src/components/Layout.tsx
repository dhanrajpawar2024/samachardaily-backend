import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header }  from './Header';
import { useState } from 'react';

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <Sidebar open={sidebarOpen} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header onToggleSidebar={() => setSidebarOpen(v => !v)} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

