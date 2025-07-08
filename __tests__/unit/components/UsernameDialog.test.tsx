import { UsernameDialog } from '@/components/UsernameDialog';
import { useSessionStore } from '@/stores/useSessionStore';
import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockLogin = vi.fn();

vi.mock('@/stores/useSessionStore', () => ({
  useSessionStore: vi.fn(() => ({
    user: null,
    login: mockLogin,
    logout: vi.fn(),
    isAuthenticated: () => false
  }))
}));

const mockedUseSessionStore = vi.mocked(useSessionStore);

describe('UsernameDialog', () => {
  const mockHandleOpenChange = vi.fn();
  const mockOnUsernameSet = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseSessionStore.mockReturnValue({
      user: null,
      login: mockLogin,
      logout: vi.fn(),
      isAuthenticated: () => false
    });
  });

  it('should render the dialog when username is not set', () => {
    render(
      <UsernameDialog
        open={true}
        onOpenChange={mockHandleOpenChange}
        onUsernameSet={mockOnUsernameSet}
      />
    );
    expect(screen.getByTestId('username-dialog')).toBeInTheDocument();
  });

  it('should call setUsername and onUsernameSet when form is submitted', async () => {
    const user = userEvent.setup();

    render(
      <UsernameDialog
        open={true}
        onOpenChange={mockHandleOpenChange}
        onUsernameSet={mockOnUsernameSet}
      />
    );

    const input = screen.getByTestId('username-input');
    const submitButton = screen.getByTestId('confirm-username-button');

    await act(async () => {
      await user.type(input, 'TestUser');
      await user.click(submitButton);
    });

    expect(mockOnUsernameSet).toHaveBeenCalledWith('TestUser');
    expect(mockHandleOpenChange).toHaveBeenCalledWith(false);
  });

  it('should show error when submitting empty form', async () => {
    const user = userEvent.setup();

    render(
      <UsernameDialog
        open={true}
        onOpenChange={mockHandleOpenChange}
        onUsernameSet={mockOnUsernameSet}
      />
    );

    const submitButton = screen.getByTestId('confirm-username-button');
    await act(async () => {
      await user.click(submitButton);
    });
    expect(mockLogin).not.toHaveBeenCalled();
  });
});
