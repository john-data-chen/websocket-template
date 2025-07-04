import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UsernameDialog } from '../../src/components/UsernameDialog';
import { useSessionStore } from '../../src/stores/useSessionStore';

// Mock useSessionStore
const mockSetUsername = vi.fn();

vi.mock('../../src/stores/useSessionStore', () => {
  return {
    useSessionStore: vi.fn(() => ({
      username: '',
      setUsername: mockSetUsername
    }))
  };
});

const mockUseSessionStore = vi.mocked(useSessionStore);

describe('UsernameDialog', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSessionStore.mockReturnValue({
      username: '',
      setUsername: mockSetUsername
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders dialog with correct title and description', () => {
    render(<UsernameDialog open={true} />);

    expect(screen.getByText('歡迎使用')).toBeInTheDocument();
    expect(
      screen.getByText('請輸入您的名字以繼續使用系統')
    ).toBeInTheDocument();
    expect(screen.getByLabelText('名字')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('請輸入您的名字')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '確認' })).toBeInTheDocument();
  });

  it('shows error when submitting empty form', async () => {
    render(<UsernameDialog open={true} />);

    const submitButton = screen.getByRole('button', { name: '確認' });
    await act(async () => {
      await user.click(submitButton);
    });

    expect(screen.getByText('請輸入您的名字')).toBeInTheDocument();
    expect(mockSetUsername).not.toHaveBeenCalled();
  });

  it('shows error when username is too long', async () => {
    render(<UsernameDialog open={true} />);

    const input = screen.getByPlaceholderText('請輸入您的名字');
    const submitButton = screen.getByRole('button', { name: '確認' });

    await act(async () => {
      await user.type(
        input,
        'This is a very long username that exceeds the limit'
      );
      await user.click(submitButton);
    });

    expect(screen.getByText('名字長度不能超過 20 個字元')).toBeInTheDocument();
    expect(mockSetUsername).not.toHaveBeenCalled();
  });

  it('calls setUsername and closes dialog on valid submission', async () => {
    const onOpenChange = vi.fn();
    const onUsernameSet = vi.fn();

    render(
      <UsernameDialog
        open={true}
        onOpenChange={onOpenChange}
        onUsernameSet={onUsernameSet}
      />
    );

    const input = screen.getByPlaceholderText('請輸入您的名字');
    const submitButton = screen.getByRole('button', { name: '確認' });

    await act(async () => {
      await user.type(input, 'Test User');
      await user.click(submitButton);
    });

    expect(mockSetUsername).toHaveBeenCalledWith('Test User');
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onUsernameSet).toHaveBeenCalledWith('Test User');
  });

  it('trims whitespace from username', async () => {
    render(<UsernameDialog open={true} />);

    const input = screen.getByPlaceholderText('請輸入您的名字');
    const submitButton = screen.getByRole('button', { name: '確認' });

    await act(async () => {
      await user.type(input, '   Test User   ');
      await user.click(submitButton);
    });

    expect(mockSetUsername).toHaveBeenCalledWith('Test User');
  });

  it('opens automatically when username is not set', () => {
    const { rerender } = render(<UsernameDialog />);

    // Initially should be open because username is not set
    expect(screen.getByText('歡迎使用')).toBeInTheDocument();

    // Update with username set
    mockUseSessionStore.mockReturnValueOnce({
      username: 'Test User',
      setUsername: mockSetUsername
    });

    rerender(<UsernameDialog />);

    // Should be closed after username is set
    expect(screen.queryByText('歡迎使用')).toBeInTheDocument();
  });

  it('calls onUsernameSet when username is already set', () => {
    const onUsernameSet = vi.fn();
    mockUseSessionStore.mockReturnValueOnce({
      username: 'Existing User',
      setUsername: mockSetUsername
    });

    render(<UsernameDialog onUsernameSet={onUsernameSet} />);

    expect(onUsernameSet).toHaveBeenCalledWith('Existing User');
  });
});
