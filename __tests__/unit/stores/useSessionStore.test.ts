import { act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useSessionStore } from '../../../src/stores/useSessionStore';

// Define the same type as useSessionStore
interface SessionState {
  user: {
    name: string | null;
  } | null;
  login: (name: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

// Mock sessionStorage
const mockSessionStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem(key: string) {
      return store[key] || null;
    },
    setItem(key: string, value: string) {
      store[key] = value;
    },
    removeItem(key: string) {
      delete store[key];
    },
    clear() {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key(index: number) {
      return Object.keys(store)[index] || null;
    }
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true
});

describe('useSessionStore', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset sessionStorage
    window.sessionStorage.clear();
    // Reset store state
    const initialState = useSessionStore.getInitialState();
    useSessionStore.setState(
      {
        ...initialState,
        user: null
      },
      true
    );
  });

  afterEach(() => {
    // Restore original environment variables
    process.env = originalEnv;
  });

  it('should have correct initial state', () => {
    const state = useSessionStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated()).toBe(false);
  });

  it('should be able to log in a user', () => {
    act(() => {
      useSessionStore.getState().login('testUser');
    });

    const { user, isAuthenticated } = useSessionStore.getState();
    expect(user).toEqual({ name: 'testUser' });
    expect(isAuthenticated()).toBe(true);
  });

  it('should be able to log out a user', () => {
    // First log in
    act(() => {
      useSessionStore.getState().login('testUser');
    });

    // Then log out
    act(() => {
      useSessionStore.getState().logout();
    });

    const { user, isAuthenticated } = useSessionStore.getState();
    expect(user).toBeNull();
    expect(isAuthenticated()).toBe(false);
  });

  it('should correctly determine if user is authenticated', () => {
    // Initial state
    expect(useSessionStore.getState().isAuthenticated()).toBe(false);

    // After login
    act(() => {
      useSessionStore.getState().login('testUser');
    });
    expect(useSessionStore.getState().isAuthenticated()).toBe(true);

    // After logout
    act(() => {
      useSessionStore.getState().logout();
    });
    expect(useSessionStore.getState().isAuthenticated()).toBe(false);
  });

  it('should persist state to sessionStorage', async () => {
    // Clear sessionStorage to ensure test isolation
    window.sessionStorage.clear();

    // Create a new store instance to ensure each test is independent
    const createTestStore = () =>
      create<SessionState>()(
        persist(
          (set, get) => ({
            user: null,
            login: (name: string) => set({ user: { name } }),
            logout: () => set({ user: null }),
            isAuthenticated: () => !!get().user?.name
          }),
          {
            name: 'user-session',
            storage: createJSONStorage(() => sessionStorage)
          }
        )
      );

    const testStore = createTestStore();

    // Login
    testStore.getState().login('testUser');

    // Wait for Zustand's async operations to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Get state directly from store for validation
    const currentState = testStore.getState();
    expect(currentState.user).toEqual({ name: 'testUser' });
    expect(currentState.isAuthenticated()).toBe(true);

    // Check if sessionStorage has the correct data
    const storedData = window.sessionStorage.getItem('user-session');

    // Ensure there is stored data
    expect(storedData).toBeTruthy();

    // Parse the stored data
    const parsedData = JSON.parse(storedData || '{}');

    // Check state structure
    expect(parsedData.state).toBeDefined();
    expect(parsedData.state.user).toBeDefined();
    expect(parsedData.state.user.name).toBe('testUser');

    // Logout
    testStore.getState().logout();

    // Wait for async operations to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify state is updated
    expect(testStore.getState().user).toBe(null);
    expect(testStore.getState().isAuthenticated()).toBe(false);

    // Check if sessionStorage is cleared
    const afterLogout = JSON.parse(
      window.sessionStorage.getItem('user-session') || '{}'
    );
    expect(afterLogout.state).toStrictEqual({ user: null });
  });

  it('should restore state from sessionStorage', async () => {
    // Set up mock sessionStorage data
    const mockState = {
      state: {
        user: { name: 'restoredUser' }
      },
      version: 0
    };
    window.sessionStorage.setItem('user-session', JSON.stringify(mockState));

    // Define store type and state
    type TestStoreState = {
      user: { name: string } | null;
      login: (name: string) => void;
      logout: () => void;
      isAuthenticated: () => boolean;
    };

    // Create a new store instance
    const createStore = () => {
      const useTestStore = create<TestStoreState>()(
        persist(
          (set, get) => ({
            user: null,
            login: (name: string) => set({ user: { name } }),
            logout: () => set({ user: null }),
            isAuthenticated: () => {
              const state = get();
              return !!state.user?.name;
            }
          }),
          {
            name: 'user-session',
            storage: createJSONStorage(() => sessionStorage)
          }
        )
      );
      return useTestStore;
    };

    // Create and initialize store
    const store = createStore();

    // Wait for async operations to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Get state and validate
    const state = store.getState();

    expect(state.user).toEqual({ name: 'restoredUser' });
    expect(state.isAuthenticated()).toBe(true);
  });
});
