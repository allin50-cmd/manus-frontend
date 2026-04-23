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
} from 'lucide-react';
import { Link, useLocation } from 'wouter';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/cases', label: 'Cases', icon: Scale },
  { path: '/hearings', label: 'Hearings', icon: Gavel },
  { path: '/documents', label: 'Documents', icon: FileText },
  { path: '/queue', label: 'Queue', icon: ListTodo },
  { path: '/diary', label: 'Diary', icon: CalendarDays },
];

export default function ClerkOSLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-none">
              ClerkOS
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-none mt-0.5">
              Core Engine v1.0
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
            const active = path === '/' ? location === '/' : location.startsWith(path);
            return (
              <Link
                key={path}
                href={path}
                className={[
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100',
                ].join(' ')}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4" />
            )}
            {theme === 'light' ? 'Dark mode' : 'Light mode'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
