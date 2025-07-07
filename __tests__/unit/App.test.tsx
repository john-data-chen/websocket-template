import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App';
import { useSessionStore } from '../../src/stores/useSessionStore';

vi.mock('@vercel/analytics/react', () => ({ Analytics: () => null }));
vi.mock('sonner', () => ({
  Toaster: () => null,
  toast: { error: vi.fn(), dismiss: vi.fn() }
}));
interface UsernameDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (username: string) => void;
}

vi.mock('../../src/components/UsernameDialog', () => ({
  UsernameDialog: ({ open }: UsernameDialogProps) =>
    open ? <div data-testid="login-dialog">LoginDialog</div> : null
}));

// Mock session store for testing
vi.mock('../../src/stores/useSessionStore', () => ({
  useSessionStore: vi.fn()
}));

const mockUseSessionStore = vi.mocked(useSessionStore);

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementation
    mockUseSessionStore.mockReturnValue({
      username: '',
      clearSession: vi.fn()
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it('未登入時顯示請先登入畫面', () => {
    render(<App />);

    expect(screen.getByText('請先登入')).toBeInTheDocument();
    expect(screen.queryByTestId('user-table')).not.toBeInTheDocument();

    // Verify login button is shown
    const loginButtons = screen.getAllByTestId('login-button');
    expect(loginButtons).toHaveLength(1);
    expect(loginButtons[0]).toHaveAttribute('aria-label', 'login-button');
  });

  describe('登入狀態', () => {
    beforeEach(() => {
      mockUseSessionStore.mockReturnValue({
        username: 'Mark.S',
        clearSession: vi.fn()
      });
    });

    it('顯示 UserTable 與歡迎詞', () => {
      render(<App />);

      // Check user table is shown
      expect(screen.getByTestId('user-table')).toBeInTheDocument();

      // Check login prompt is hidden
      expect(screen.queryByText('請先登入')).not.toBeInTheDocument();

      // Check welcome message
      expect(screen.getByText(/歡迎, Mark.S!?/)).toBeInTheDocument();

      // Check logout button is shown
      const logoutButtons = screen.getAllByTestId('logout-button');
      expect(logoutButtons).toHaveLength(1);
    });
  });
});
