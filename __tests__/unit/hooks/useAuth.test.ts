import { useAuth } from '@/hooks/useAuth';
import { useSessionStore } from '@/stores/useSessionStore';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the session store
vi.mock('@/stores/useSessionStore');

const mockUseSessionStore = vi.mocked(useSessionStore);

describe('useAuth', () => {
  const mockLogin = vi.fn();
  const mockLogoutUser = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementation
    mockUseSessionStore.mockReturnValue({
      user: null,
      login: mockLogin,
      logout: mockLogoutUser,
      isAuthenticated: () => false
    });
  });

  it('should return user from session store', () => {
    const testUser = { name: 'Test User' };
    mockUseSessionStore.mockReturnValue({
      user: testUser,
      login: mockLogin,
      logout: mockLogoutUser,
      isAuthenticated: () => true
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBe(testUser);
  });

  it('should expose login function that calls session store login', () => {
    const { result } = renderHook(() => useAuth());
    const testUsername = 'testuser';

    result.current.login(testUsername);

    expect(mockLogin).toHaveBeenCalledWith(testUsername);
  });

  it('should expose logout function that calls session store logout', () => {
    const { result } = renderHook(() => useAuth());

    result.current.logout();

    expect(mockLogoutUser).toHaveBeenCalled();
  });

  it('should memoize the logout function', () => {
    const { result, rerender } = renderHook(() => useAuth());
    const firstLogout = result.current.logout;

    rerender();

    expect(result.current.logout).toBe(firstLogout);
  });
});
