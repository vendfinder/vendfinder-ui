'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface RouterErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface RouterErrorBoundaryProps {
  children: React.ReactNode;
}

export class RouterErrorBoundary extends React.Component<
  RouterErrorBoundaryProps,
  RouterErrorBoundaryState
> {
  constructor(props: RouterErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): RouterErrorBoundaryState {
    // Check if this is a router state parsing error
    if (error.message?.includes('router state header')) {
      return { hasError: true, error };
    }
    return { hasError: false };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log router state errors for debugging
    if (error.message?.includes('router state header')) {
      console.warn('Router state parsing error caught:', error.message);

      // Clear potentially corrupted router state from localStorage
      if (typeof window !== 'undefined') {
        try {
          const keys = Object.keys(localStorage);
          keys.forEach((key) => {
            if (key.includes('next-router') || key.includes('__next')) {
              localStorage.removeItem(key);
            }
          });
        } catch (e) {
          // Ignore storage errors
        }
      }
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });

    // Force a page refresh to reset router state
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Navigation Error
            </h2>
            <p className="text-gray-600 mb-6">
              A navigation error occurred. This usually resolves automatically.
            </p>
            <button
              onClick={this.handleRetry}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default RouterErrorBoundary;
