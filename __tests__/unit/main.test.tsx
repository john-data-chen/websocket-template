import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/stores/useSessionStore', () => ({
  useSessionStore: () => ({
    username: 'test-user',
    clearSession: vi.fn()
  })
}));

vi.mock('@vercel/analytics/react', () => ({ Analytics: () => null }));
vi.mock('sonner', () => ({
  Toaster: () => null,
  toast: { error: () => {}, dismiss: () => {} }
}));
vi.mock('@/components/UserTable', () => ({ default: () => <div /> }));
vi.mock('@/components/UsernameDialog', () => ({
  UsernameDialog: () => null
}));

vi.mock('@/App.tsx', () => ({
  __esModule: true,
  default: () => <div data-testid="app-root">App Loaded</div>
}));

describe('main.tsx', () => {
  it('renders App into #root', async () => {
    const root = document.createElement('div');
    root.id = 'root';
    document.body.appendChild(root);

    await import('@/main.tsx');

    await waitFor(() => {
      expect(screen.getByTestId('app-root')).toBeInTheDocument();
    });

    document.body.removeChild(root);
  });
});
