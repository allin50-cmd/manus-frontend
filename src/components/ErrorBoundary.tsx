import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Shield, RefreshCw } from 'lucide-react';

interface Props { children: ReactNode }
interface State { hasError: boolean; error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-[#0A0B14] via-[#111327] to-[#0A0B14] flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <Shield className="w-16 h-16 text-[#5A4BFF] mx-auto mb-6" />
            <h1 className="text-3xl font-black text-white mb-3">Something went wrong</h1>
            <p className="text-slate-400 mb-4">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            {this.state.error && (
              <p className="text-xs text-slate-600 bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-8 font-mono break-words text-left">
                {this.state.error.message}
              </p>
            )}
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#5A4BFF] text-white rounded-full font-bold hover:bg-[#6B5BFF] transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> Try Again
              </button>
              <a
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 border border-white/20 text-white rounded-full font-bold hover:bg-white/20 transition-colors"
              >
                Go Home
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
