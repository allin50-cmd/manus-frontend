import { useEffect } from 'react';
import { useAuth } from '../../_core/hooks/useAuth';
import { AlertCircle, BarChart3, List } from 'lucide-react';

export default function AgentCompanyDetail() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin">
            <AlertCircle className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-cosmic-bg p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">AgentCompanyDetail</h1>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="card-elevated p-6 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold">Overview</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400">Agent data and analytics</p>
          </div>

          <div className="card-elevated p-6 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <List className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold">Details</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400">View detailed information</p>
          </div>
        </div>
      </div>
    </div>
  );
}
