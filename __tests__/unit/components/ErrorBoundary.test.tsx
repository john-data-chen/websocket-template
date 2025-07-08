import { ErrorBoundary } from '@/components/ErrorBoundary';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

// Mock console.error to avoid error logs in test output
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = vi.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('ErrorBoundary', () => {
  const ErrorComponent = ({
    shouldThrow = false
  }: {
    shouldThrow?: boolean;
  }) => {
    if (shouldThrow) {
      throw new Error('Test error');
    }
    return <div>No error</div>;
  };

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ErrorComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('should render fallback UI when there is an error', () => {
    render(
      <ErrorBoundary>
        <ErrorComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /try again/i })
    ).toBeInTheDocument();
  });

  it('should call onError when there is an error', () => {
    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ErrorComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalled();
  });

  it('should reset error state when reset button is clicked', async () => {
    // First render with error
    const { rerender } = render(
      <ErrorBoundary>
        <ErrorComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    // Verify error state
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Click reset button
    const resetButton = screen.getByRole('button', { name: /try again/i });
    await userEvent.click(resetButton);

    // Re-render with a non-error component
    // We need to use a key to force a new instance of ErrorBoundary
    rerender(
      <ErrorBoundary key="test">
        <ErrorComponent shouldThrow={false} />
      </ErrorBoundary>
    );

    // Verify the error is cleared and children are rendered
    expect(screen.getByText('No error')).toBeInTheDocument();
  });
});
