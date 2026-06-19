import { BarChart3 } from 'lucide-react';

export default function VaultLine() {
  return (
    <div className="min-h-screen bg-white dark:bg-cosmic-bg">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            VaultLine
          </h1>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="card-elevated p-6 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:shadow-lg transition">
              <h3 className="text-lg font-semibold mb-2">Item {i}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Description for VaultLine</p>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View Details →
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
