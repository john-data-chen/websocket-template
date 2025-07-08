import App from '@/App';
import { useSessionStore } from '@/stores/useSessionStore';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the session store for testing

// Mock child components
vi.mock('@/components/ConnectionStatus', () => ({
  ConnectionStatus: () => <div data-testid="connection-status" />
}));

vi.mock('@/components/UserInfo', () => ({
  UserInfo: () => <div data-testid="user-info" />
}));

vi.mock('@/components/UserTable', () => ({
  default: () => <div data-testid="user-table" />
}));

vi.mock('@/components/UsernameDialog', () => ({
  UsernameDialog: () => <div data-testid="username-dialog" />
}));

// Mock stores and hooks
vi.mock('@/stores/useSessionStore');
vi.mock('@/stores/useWebSocketStore', () => ({
  useWebSocketConnection: () => ({ isConnected: true })
}));

// Mock analytics and UI components
vi.mock('@vercel/analytics/react', () => ({
  Analytics: () => null
}));

vi.mock('sonner', () => ({
  Toaster: () => null,
  toast: { error: vi.fn() }
}));

const mockUseSessionStore = vi.mocked(useSessionStore);

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementation (not authenticated)
    mockUseSessionStore.mockReturnValue({
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
      isAuthenticated: () => false
    });
  });

  it('should render the main layout', () => {
    render(<App />);

    // Check for header
    expect(screen.getByRole('banner')).toBeInTheDocument();

    // Check for connection status
    expect(screen.getByTestId('connection-status')).toBeInTheDocument();

    // Check for main content container
    const appRoot = screen.getByTestId('app-root');
    expect(appRoot).toBeInTheDocument();
  });

  it('should show login dialog when not authenticated', () => {
    render(<App />);

    expect(screen.getByTestId('username-dialog')).toBeInTheDocument();
  });

  it('should show user table when authenticated', () => {
    // Mock authenticated state
    mockUseSessionStore.mockReturnValue({
      user: { name: 'Test User' },
      login: vi.fn(),
      logout: vi.fn(),
      isAuthenticated: () => true
    });

    render(<App />);

    expect(screen.getByTestId('user-info')).toBeInTheDocument();
    expect(screen.getByTestId('user-table')).toBeInTheDocument();
  });

  it('should show connection status', () => {
    render(<App />);
    expect(screen.getByTestId('connection-status')).toBeInTheDocument();
  });
});
