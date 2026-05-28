import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Home, Moon, SearchX, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export default function NotFound() {
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen theme-light-default bg-gradient-to-br from-[#0F1014] via-[#1A1D28] to-[#0F1014] flex items-center justify-center px-4">
      <button
        type="button"
        onClick={toggleTheme}
        aria-pressed={theme === 'dark'}
        aria-label={theme === 'light' ? 'Turn dark mode on' : 'Turn dark mode off'}
        className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1A1D28] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"
      >
        {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      </button>
      <div className="text-center">
        <SearchX className="w-24 h-24 text-gray-600 mx-auto mb-6" />
        <h1 className="text-6xl font-bold text-white mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-400 mb-2">Page Not Found</h2>
        <p className="text-gray-500 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button
          onClick={() => setLocation('/')}
          className="bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white"
        >
          <Home className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
      </div>
    </div>
  );
}
