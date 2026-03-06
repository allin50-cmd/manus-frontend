import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useOffline } from '@/contexts/OfflineContext';
import { cn } from '@/lib/utils';

export default function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { isOnline, pendingCount } = useOffline();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <div className="relative flex-shrink-0">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(p => !p)}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />

        {/* Offline banner */}
        {!isOnline && (
          <div className="bg-amber-500 text-white text-center text-sm py-1.5 font-medium flex-shrink-0">
            You are offline.
            {pendingCount > 0 && (
              <span className="ml-2">
                {pendingCount} upload{pendingCount !== 1 ? 's' : ''} queued — will sync automatically when connection restored.
              </span>
            )}
          </div>
        )}

        {/* Page content */}
        <main
          className={cn(
            'flex-1 overflow-auto',
            'p-6'
          )}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
