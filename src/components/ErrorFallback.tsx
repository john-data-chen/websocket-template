import { Button } from './ui/button';

interface ErrorFallbackProps {
  readonly error: Error;
  readonly resetError: () => void;
}

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold text-red-600 mb-2">
        Application Error
      </h2>
      <p className="mb-4">
        {error?.message || 'An unexpected error occurred in the application.'}
      </p>
      <Button
        onClick={resetError}
        variant="outline"
        className="border-red-500 text-red-600 hover:bg-red-50"
      >
        Try Again
      </Button>
    </div>
  );
}
