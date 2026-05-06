import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  retryCount: number;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, retryCount: 0 };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ClerkOS] Uncaught error:', error, info);
  }

  private handleRetry = () => {
    this.setState((s) => ({ hasError: false, error: undefined, retryCount: s.retryCount + 1 }));
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-6">
          <div className="text-center max-w-sm w-full">
            <div className="w-14 h-14 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
              <AlertTriangle className="w-7 h-7 text-rose-600 dark:text-rose-400" />
            </div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Something went wrong
            </h1>
            {this.state.error?.message && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1 font-mono bg-slate-100 dark:bg-slate-800 rounded px-3 py-2 text-left break-all">
                {this.state.error.message}
              </p>
            )}
            {this.state.retryCount > 0 && (
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
                Retry attempt {this.state.retryCount}
              </p>
            )}
            <button
              onClick={this.handleRetry}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
