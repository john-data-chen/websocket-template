import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UsernameDialog } from '../../../src/components/UsernameDialog';
import { useSessionStore } from '../../../src/stores/useSessionStore';

const mockLogin = vi.fn();

vi.mock('../../../src/stores/useSessionStore', () => ({
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

    expect(screen.getByText('歡迎使用')).toBeInTheDocument();
    expect(screen.getByLabelText('名字')).toBeInTheDocument();
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

    const input = screen.getByLabelText('名字');
    const submitButton = screen.getByRole('button', { name: /確認/i });

    await act(async () => {
      await user.type(input, 'TestUser');
      await user.click(submitButton);
    });

    expect(mockLogin).toHaveBeenCalledWith('TestUser');
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

    const submitButton = screen.getByRole('button', { name: /確認/i });
    await act(async () => {
      await user.click(submitButton);
    });
    expect(mockLogin).not.toHaveBeenCalled();
  });
});
