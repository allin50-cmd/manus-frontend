import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Building2, Receipt, CreditCard,
  FolderOpen, Scale, ScanLine, AlertTriangle, ClipboardList,
  BookOpen, Search, Settings, Shield, LogOut, ChevronLeft, ChevronRight,
  Layers, GitMerge
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useOffline } from '@/contexts/OfflineContext';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  badgeColor?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

function SidebarLogo({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-5 border-b border-gray-800',
      collapsed && 'justify-center'
    )}>
      <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
        <Shield className="w-5 h-5 text-white" />
      </div>
      {!collapsed && (
        <div>
          <div className="font-bold text-white text-sm leading-tight">FineGuard</div>
          <div className="text-xs text-gray-400">MTD Control Centre</div>
        </div>
      )}
    </div>
  );
}

export default function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const { user, logout } = useAuth();
  const { pendingCount } = useOffline();
  const location = useLocation();

  const navGroups: NavGroup[] = [
    {
      title: 'Overview',
      items: [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'MTD Control Centre', path: '/mtd', icon: Scale },
        {
          label: 'Compliance Alerts',
          path: '/alerts',
          icon: AlertTriangle,
          badge: 2,
          badgeColor: 'bg-red-500',
        },
      ],
    },
    {
      title: 'Compliance',
      items: [
        { label: 'Companies', path: '/companies', icon: Building2 },
        { label: 'VAT Returns', path: '/vat', icon: FileText },
        { label: 'Ledger', path: '/ledger', icon: BookOpen },
        {
          label: 'Staging Queue',
          path: '/staging',
          icon: Layers,
          badge: 1,
          badgeColor: 'bg-amber-500',
        },
      ],
    },
    {
      title: 'Ingestion',
      items: [
        {
          label: 'Receipts',
          path: '/receipts',
          icon: Receipt,
          badge: pendingCount > 0 ? pendingCount : undefined,
          badgeColor: 'bg-blue-500',
        },
        { label: 'Scan Receipt', path: '/scan', icon: ScanLine },
        { label: 'Reconciliation', path: '/reconciliation', icon: GitMerge },
      ],
    },
    {
      title: 'Storage',
      items: [
        { label: 'Documents', path: '/documents', icon: FolderOpen },
        { label: 'Companies House', path: '/companies-house', icon: Search },
      ],
    },
    {
      title: 'Admin',
      items: [
        { label: 'Audit Trail', path: '/audit', icon: ClipboardList },
        { label: 'Settings', path: '/settings', icon: Settings },
      ],
    },
  ];

  return (
    <div
      className={cn(
        'sidebar flex flex-col h-full bg-gray-900 text-white transition-all duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <SidebarLogo collapsed={collapsed} />

      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-16 z-10 w-6 h-6 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center hover:bg-gray-600 transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3 text-gray-300" />
        ) : (
          <ChevronLeft className="w-3 h-3 text-gray-300" />
        )}
      </button>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {navGroups.map((group) => (
          <div key={group.title} className="mb-4">
            {!collapsed && (
              <div className="px-3 mb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {group.title}
              </div>
            )}
            {group.items.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'nav-item mb-0.5',
                    isActive ? 'nav-item-active' : 'nav-item-inactive',
                    collapsed && 'justify-center px-2'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className={cn('flex-shrink-0', collapsed ? 'w-5 h-5' : 'w-4 h-4')} />
                  {!collapsed && (
                    <>
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge !== undefined && (
                        <span
                          className={cn(
                            'flex-shrink-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full text-white',
                            item.badgeColor ?? 'bg-gray-500'
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User section */}
      <div className={cn('border-t border-gray-800 p-3', collapsed && 'flex flex-col items-center gap-2')}>
        {!collapsed && user && (
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-white">
                {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{user.name}</div>
              <div className="text-xs text-gray-400 capitalize">{user.role.replace('_', ' ')}</div>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className={cn(
            'flex items-center gap-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors text-sm',
            collapsed ? 'p-2' : 'w-full px-3 py-2'
          )}
          title={collapsed ? 'Sign out' : undefined}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </div>
  );
}
