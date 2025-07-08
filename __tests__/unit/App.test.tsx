import App from '@/App';
import { APP_TEXTS } from '@/constants/appTexts';
import { TEST_USER } from '@/constants/mockData';
import { useSessionStore } from '@/stores/useSessionStore';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

vi.mock('@/components/UsernameDialog', () => ({
  UsernameDialog: ({ open }: UsernameDialogProps) =>
    open ? <div data-testid="login-dialog">LoginDialog</div> : null
}));

// Mock session store for testing
vi.mock('@/stores/useSessionStore', () => ({
  useSessionStore: vi.fn()
}));

const mockUseSessionStore = vi.mocked(useSessionStore);

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementation
    mockUseSessionStore.mockReturnValue({
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
      isAuthenticated: () => false
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it('should show login prompt when not logged in', () => {
    render(<App />);
    expect(screen.queryByTestId('user-table')).not.toBeInTheDocument();

    // Verify login button is shown
    const loginButtons = screen.getByTestId('open-login-dialog-button');
    expect(loginButtons).toBeInTheDocument();
  });

  describe('when logged in', () => {
    beforeEach(() => {
      mockUseSessionStore.mockReturnValue({
        user: { name: TEST_USER },
        login: vi.fn(),
        logout: vi.fn(),
        isAuthenticated: () => true
      });
    });

    it('should display UserTable and welcome message', () => {
      render(<App />);

      // Check user table is shown
      expect(screen.getByTestId('user-table')).toBeInTheDocument();

      // Check login prompt is hidden
      expect(
        screen.queryByText(APP_TEXTS.HEADER.WELCOME)
      ).not.toBeInTheDocument();

      // Check welcome message
      expect(screen.getByTestId('welcome-text')).toBeInTheDocument();

      // Check logout button is shown
      const logoutButtons = screen.getAllByTestId('logout-button');
      expect(logoutButtons).toHaveLength(1);
    });
  });
});
