import { useTheme } from '@/contexts/ThemeContext';
import {
  BookOpen,
  LayoutDashboard,
  FileText,
  Gavel,
  ListTodo,
  Moon,
  Scale,
  Sun,
  CalendarDays,
  Layers,
  Menu,
  X,
  User,
  Building2,
  ShieldCheck,
  ClipboardList,
  ClipboardCheck,
  MessageSquare,
  CreditCard,
  Info,
  Users,
  Settings,
  Mic,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'wouter';

const NAV_SECTIONS = [
  {
    label: 'ClerkOS',
    items: [
      { path: '/clerkos', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/cases', label: 'Cases', icon: Scale },
      { path: '/hearings', label: 'Hearings', icon: Gavel },
      { path: '/documents', label: 'Documents', icon: FileText },
      { path: '/queue', label: 'Queue', icon: ListTodo },
      { path: '/voice-reception', label: 'AI Reception', icon: Mic },
      { path: '/diary', label: 'Diary', icon: CalendarDays },
      { path: '/bundles', label: 'Bundles', icon: Layers },
    ],
  },
  {
    label: 'FineGuard Service',
    items: [
      { path: '/fineguard', label: 'Front Door', icon: ShieldCheck },
      { path: '/compliance-bundle', label: 'Company Check', icon: ClipboardCheck },
      { path: '/voice-reception', label: 'AI Reception', icon: Mic },
      { path: '/intake-sheet', label: 'Service Intake', icon: ClipboardList },
      { path: '/book-demo', label: 'Book Demo', icon: MessageSquare },
    ],
  },
  {
    label: 'Manage',
    items: [
      { path: '/pricing', label: 'Pricing', icon: CreditCard },
      { path: '/about', label: 'About', icon: Info },
      { path: '/team', label: 'Team', icon: Users },
      { path: '/admin', label: 'Admin', icon: Settings },
    ],
  },
];

export default function ClerkOSLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const tenantSlug =
    typeof window !== 'undefined'
      ? (localStorage.getItem('clerk-tenant') ?? 'alpha')
      : 'alpha';
  const userName =
    typeof window !== 'undefined'
      ? (localStorage.getItem('clerk-name') ?? 'FineGuard Operator')
      : 'FineGuard Operator';

  const sidebar = (
    <aside className="w-60 flex-shrink-0 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-full">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-200 dark:border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
          <BookOpen className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-none">
            ClerkOS
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-none mt-0.5">
            FineGuard control surface
          </p>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="md:hidden p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tenant badge */}
      <div className="mx-3 mt-3 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center gap-2">
        <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide leading-none">
            Tenant
          </p>
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono truncate">
            {tenantSlug}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-3 space-y-4 overflow-y-auto">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="space-y-0.5">
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              {section.label}
            </p>
            {section.items.map(({ path, label, icon: Icon }) => {
              const active = path === '/' ? location === '/' : location.startsWith(path);
              return (
                <Link
                  key={path}
                  href={path}
                  onClick={() => setSidebarOpen(false)}
                  className={[
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    active
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100',
                  ].join(' ')}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-1">
        {/* User row */}
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
            <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{userName}</p>
        </div>
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          {theme === 'light' ? 'Dark mode' : 'Light mode'}
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">{sidebar}</div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-50 flex">{sidebar}</div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-4 h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">ClerkOS</span>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
