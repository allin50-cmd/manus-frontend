import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  resetErrorBoundary?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.resetErrorBoundary?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0F1014] flex items-center justify-center px-4">
          <div className="flex flex-col items-center gap-6 max-w-md text-center">
            {/* Purple warning icon */}
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[#5A4BFF]/15 border border-[#5A4BFF]/40">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-8 h-8 text-[#5A4BFF]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                />
              </svg>
            </div>

            <div className="flex flex-col gap-2">
              <h1 className="text-white text-2xl font-semibold tracking-tight">
                Something went wrong
              </h1>
              <p className="text-gray-400 text-sm leading-relaxed">
                An unexpected error occurred while rendering this page. You can
                try reloading — if the problem persists, please contact support.
              </p>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 rounded-lg bg-[#5A4BFF] hover:bg-[#4a3bef] active:bg-[#3a2bdf] px-6 py-2.5 text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#5A4BFF]/50 focus:ring-offset-2 focus:ring-offset-[#0F1014]"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
