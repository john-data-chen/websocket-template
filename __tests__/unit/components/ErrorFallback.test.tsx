import { ErrorFallback } from '@/components/ErrorFallback';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('ErrorFallback', () => {
  const mockResetError = vi.fn();
  const testError = new Error('Test error message');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders error message and reset button', () => {
    render(<ErrorFallback error={testError} resetError={mockResetError} />);

    // 檢查錯誤標題是否正確顯示
    const errorTitle = screen.getByRole('heading', { level: 2 });
    expect(errorTitle).toHaveTextContent('Application Error');

    // 檢查錯誤訊息是否正確顯示
    const errorMessage = screen.getByText('Test error message');
    expect(errorMessage).toBeInTheDocument();

    // 檢查重置按鈕是否存在
    const resetButton = screen.getByRole('button', { name: /try again/i });
    expect(resetButton).toBeInTheDocument();
  });

  it('displays default error message when error has no message', () => {
    const errorWithoutMessage = new Error('');
    render(
      <ErrorFallback error={errorWithoutMessage} resetError={mockResetError} />
    );

    const defaultMessage = screen.getByText(
      'An unexpected error occurred in the application.'
    );
    expect(defaultMessage).toBeInTheDocument();
  });

  it('calls resetError when reset button is clicked', async () => {
    const user = userEvent.setup();
    render(<ErrorFallback error={testError} resetError={mockResetError} />);

    const resetButton = screen.getByRole('button', { name: /try again/i });
    await user.click(resetButton);

    expect(mockResetError).toHaveBeenCalledTimes(1);
  });
});
