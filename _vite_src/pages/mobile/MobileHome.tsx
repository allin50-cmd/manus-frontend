import { ArrowLeft, Bell } from 'lucide-react';
import { useLocation } from 'wouter';

export default function MobileHome() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-white dark:bg-cosmic-bg flex flex-col">
      {/* Mobile Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">Home</h1>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">
            <Bell className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-4 py-6">
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="card-elevated p-4 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Item {i}</h3>
                <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                  Active
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Mobile Home content</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
