/**
 * Main Application Layout
 * Responsive sidebar + header + content shell for the dashboard
 */
import React, { useState, useCallback } from 'react';
import { useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Bot,
  Workflow,
  Wrench,
  BookOpen,
  ScrollText,
  Settings,
  Shield,
  FileText,
  Users,
  Building2,
  Bell,
  Search,
  Menu,
  X,
  ChevronRight,
  LogOut,
  HelpCircle,
  Zap,
  Lock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
  badgeVariant?: 'purple' | 'cyan' | 'gold' | 'red' | 'green';
  section?: string;
}

const NAV_ITEMS: NavItem[] = [
  // Main
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'Main' },
  { path: '/ai-assistant', label: 'AI Assistant', icon: Bot, badge: 'NEW', badgeVariant: 'purple', section: 'Main' },
  { path: '/workflows', label: 'Workflows', icon: Workflow, badge: 3, badgeVariant: 'cyan', section: 'Main' },
  { path: '/mcp-tools', label: 'MCP Tools', icon: Wrench, section: 'Main' },
  // Knowledge
  { path: '/knowledge-base', label: 'Knowledge Base', icon: BookOpen, section: 'Resources' },
  { path: '/audit-log', label: 'Audit Log', icon: ScrollText, section: 'Resources' },
  // Platform
  { path: '/', label: 'VaultLine', icon: Lock, section: 'Products' },
  { path: '/ultai', label: 'UltAi Intake', icon: FileText, section: 'Products' },
  { path: '/fineguard', label: 'FineGuard', icon: Shield, section: 'Products' },
  // Admin
  { path: '/admin', label: 'Admin Panel', icon: Users, section: 'Admin' },
  { path: '/settings', label: 'Settings', icon: Settings, section: 'Admin' },
];

function groupBy<T extends { section?: string }>(items: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = item.section ?? 'Other';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return map;
}

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  collapsed: boolean;
  onClose?: () => void;
}

function Sidebar({ currentPath, onNavigate, collapsed, onClose }: SidebarProps) {
  const groups = groupBy(NAV_ITEMS);

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-[#0F1014] border-r border-white/5',
        'transition-all duration-300 ease-in-out overflow-hidden'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/5 shrink-0">
        <div className="w-8 h-8 bg-gradient-to-br from-brand-purple to-brand-cyan rounded-lg flex items-center justify-center shrink-0">
          <Lock className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate">VaultLine Suite</p>
            <p className="text-[10px] text-gray-500 truncate">Enterprise Platform</p>
          </div>
        )}
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto text-gray-500 hover:text-white lg:hidden p-1"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {Array.from(groups.entries()).map(([section, items]) => (
          <div key={section} className="mb-2">
            {!collapsed && (
              <p className="px-2 py-1 text-[10px] font-semibold text-gray-600 uppercase tracking-widest">
                {section}
              </p>
            )}
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path));
              return (
                <button
                  key={item.path}
                  onClick={() => onNavigate(item.path)}
                  className={cn(
                    'nav-item w-full justify-start',
                    isActive && 'nav-item-active text-white',
                    collapsed && 'justify-center px-2'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-brand-purple' : '')} />
                  {!collapsed && (
                    <>
                      <span className="flex-1 truncate text-left">{item.label}</span>
                      {item.badge !== undefined && (
                        <Badge variant={item.badgeVariant ?? 'default'} className="text-[10px] px-1.5 py-0">
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Footer */}
      <div className="shrink-0 border-t border-white/5 p-2">
        <button className={cn('nav-item w-full', collapsed && 'justify-center')}>
          <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0">
            A
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs text-white font-medium truncate">Admin User</p>
              <p className="text-[10px] text-gray-500 truncate">admin@vaultline.io</p>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function DashboardLayout({ children, title, subtitle, actions }: DashboardLayoutProps) {
  const [location, navigate] = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleNavigate = useCallback((path: string) => {
    navigate(path);
    setMobileSidebarOpen(false);
  }, [navigate]);

  return (
    <div className="flex h-screen bg-brand-navy overflow-hidden">
      {/* Desktop Sidebar */}
      <div
        className={cn(
          'hidden lg:flex flex-col shrink-0 transition-all duration-300',
          sidebarCollapsed ? 'w-14' : 'w-60'
        )}
      >
        <Sidebar
          currentPath={location}
          onNavigate={handleNavigate}
          collapsed={sidebarCollapsed}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 z-50">
            <Sidebar
              currentPath={location}
              onNavigate={handleNavigate}
              collapsed={false}
              onClose={() => setMobileSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="shrink-0 h-14 bg-[#0F1014] border-b border-white/5 flex items-center gap-3 px-4">
          {/* Menu button (mobile) */}
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="lg:hidden text-gray-500 hover:text-white p-1.5 rounded-lg hover:bg-white/5"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Collapse toggle (desktop) */}
          <button
            onClick={() => setSidebarCollapsed((c) => !c)}
            className="hidden lg:flex text-gray-500 hover:text-white p-1.5 rounded-lg hover:bg-white/5"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Page title */}
          {title && (
            <div className="hidden sm:block">
              <h1 className="text-sm font-semibold text-white">{title}</h1>
              {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
            </div>
          )}

          {/* Search */}
          <div className="flex-1 max-w-sm mx-auto relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search anything..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-brand-purple/50"
            />
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1 ml-auto">
            {actions}
            {/* Notifications */}
            <button className="relative p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-brand-purple rounded-full" />
            </button>
            {/* Help */}
            <button className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 max-w-7xl mx-auto w-full animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
