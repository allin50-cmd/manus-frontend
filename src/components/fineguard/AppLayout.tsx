import React, { useState } from 'react';
import { useLocation } from 'wouter';
import {
  LayoutDashboard, Rocket, History, Settings, HelpCircle,
  Users, Building2, Menu, X, Shield, ChevronDown, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href?: string;
  children?: { label: string; href: string }[];
}

const nav: NavItem[] = [
  { label: 'Dashboard',   icon: <LayoutDashboard className="h-4 w-4" />, href: '/app/dashboard' },
  { label: 'Deploy',      icon: <Rocket className="h-4 w-4" />,          href: '/app/deploy' },
  { label: 'History',     icon: <History className="h-4 w-4" />,         href: '/app/history' },
  {
    label: 'Settings', icon: <Settings className="h-4 w-4" />,
    children: [
      { label: 'Domains',        href: '/app/settings/domains' },
      { label: 'Copilot',        href: '/app/settings/copilot' },
      { label: 'Teams',          href: '/app/settings/teams' },
      { label: 'Power Automate', href: '/app/settings/power-automate' },
    ],
  },
  { label: 'Partners',    icon: <Users className="h-4 w-4" />,           href: '/app/partners' },
  { label: 'Help',        icon: <HelpCircle className="h-4 w-4" />,      href: '/app/help' },
];

function SidebarLink({ item }: { item: NavItem }) {
  const [location, navigate] = useLocation();
  const [open, setOpen] = useState(() =>
    item.children?.some((c) => location.startsWith(c.href)) ?? false,
  );

  if (item.children) {
    const isActive = item.children.some((c) => location.startsWith(c.href));
    return (
      <div>
        <button
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'fg-sidebar-link w-full justify-between',
            isActive && 'fg-sidebar-link-active',
          )}
        >
          <span className="flex items-center gap-3">
            {item.icon}
            {item.label}
          </span>
          {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </button>
        {open && (
          <div className="ml-7 mt-1 space-y-1">
            {item.children.map((child) => (
              <button
                key={child.href}
                onClick={() => navigate(child.href)}
                className={cn(
                  'block w-full rounded-md px-3 py-1.5 text-left text-xs font-medium text-slate-400 hover:bg-white/10 hover:text-white transition-colors',
                  location === child.href && 'bg-white/10 text-white',
                )}
              >
                {child.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => navigate(item.href!)}
      className={cn('fg-sidebar-link w-full', location === item.href && 'fg-sidebar-link-active')}
    >
      {item.icon}
      {item.label}
    </button>
  );
}

interface AppLayoutProps {
  title: string;
  children: React.ReactNode;
}

export function AppLayout({ title, children }: AppLayoutProps) {
  const [, navigate] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebar = (
    <nav className="flex flex-col h-full">
      {/* Logo */}
      <div
        className="flex items-center gap-2.5 px-4 py-5 cursor-pointer"
        onClick={() => navigate('/app/dashboard')}
      >
        <Shield className="h-6 w-6 text-brand-gold" />
        <span className="text-base font-bold text-white tracking-tight">FineGuard</span>
      </div>

      {/* Nav */}
      <div className="flex-1 px-3 space-y-1 overflow-y-auto">
        {nav.map((item) => (
          <SidebarLink key={item.label} item={item} />
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/10">
        <p className="text-xs text-slate-500">FineGuard Installer Portal</p>
        <p className="text-xs text-slate-600 mt-0.5">v1.0.0</p>
      </div>
    </nav>
  );

  return (
    <div className="flex h-screen bg-brand-surface overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-56 shrink-0 flex-col bg-brand-navy border-r border-white/5">
        {sidebar}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-56 h-full bg-brand-navy flex flex-col">
            <button
              className="absolute top-4 right-3 text-slate-400 hover:text-white"
              onClick={() => setMobileOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 items-center gap-4 border-b border-gray-200 bg-white px-6 shrink-0">
          <button
            className="lg:hidden text-gray-500 hover:text-gray-700"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-base font-semibold text-gray-900">{title}</h1>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
