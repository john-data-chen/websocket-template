import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/button';

interface FallbackProps {
  error: Error;
  resetError: () => void;
}

type FallbackRender = (props: FallbackProps) => ReactNode;

interface Props {
  children: ReactNode;
  fallback?: ReactNode | FallbackRender;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to an error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call the onError handler if provided
    this.props.onError?.(error, errorInfo);

    // Update state with error info
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  public render() {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Render fallback UI if provided
      if (fallback) {
        if (typeof fallback === 'function') {
          return fallback({
            error: error!,
            resetError: this.handleReset
          });
        }
        return fallback;
      }

      // Default error UI
      return (
        <div
          className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50"
          role="alert"
        >
          <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Something went wrong
            </h2>
            <p className="text-gray-700 mb-4">
              {error?.message || 'An unexpected error occurred'}
            </p>
            <div className="mt-6">
              <Button
                onClick={this.handleReset}
                className="w-full sm:w-auto"
                variant="outline"
              >
                Try again
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

// Default export for backward compatibility
export default ErrorBoundary;
