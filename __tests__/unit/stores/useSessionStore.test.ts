import { act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useSessionStore } from '../../../src/stores/useSessionStore';

// 定義與 useSessionStore 相同的類型
interface SessionState {
  user: {
    name: string | null;
  } | null;
  login: (name: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

// 模擬 sessionStorage
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
    // 重置 sessionStorage
    window.sessionStorage.clear();
    // 重置 store 狀態
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
    // 恢復原始環境變數
    process.env = originalEnv;
  });

  it('應該有正確的初始狀態', () => {
    const state = useSessionStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated()).toBe(false);
  });

  it('應該可以登入用戶', () => {
    act(() => {
      useSessionStore.getState().login('testUser');
    });

    const { user, isAuthenticated } = useSessionStore.getState();
    expect(user).toEqual({ name: 'testUser' });
    expect(isAuthenticated()).toBe(true);
  });

  it('應該可以登出用戶', () => {
    // 先登入
    act(() => {
      useSessionStore.getState().login('testUser');
    });

    // 再登出
    act(() => {
      useSessionStore.getState().logout();
    });

    const { user, isAuthenticated } = useSessionStore.getState();
    expect(user).toBeNull();
    expect(isAuthenticated()).toBe(false);
  });

  it('應該正確判斷用戶是否已認證', () => {
    // 初始狀態
    expect(useSessionStore.getState().isAuthenticated()).toBe(false);

    // 登入後
    act(() => {
      useSessionStore.getState().login('testUser');
    });
    expect(useSessionStore.getState().isAuthenticated()).toBe(true);

    // 登出後
    act(() => {
      useSessionStore.getState().logout();
    });
    expect(useSessionStore.getState().isAuthenticated()).toBe(false);
  });

  it('應該將狀態持久化到 sessionStorage', async () => {
    // 清空 sessionStorage 以確保測試獨立性
    window.sessionStorage.clear();

    // 創建一個新的 store 實例，確保每次測試都是獨立的
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

    // 登入
    testStore.getState().login('testUser');

    // 等待 Zustand 的異步操作完成
    await new Promise((resolve) => setTimeout(resolve, 100));

    // 直接從 store 獲取狀態進行驗證
    const currentState = testStore.getState();
    expect(currentState.user).toEqual({ name: 'testUser' });
    expect(currentState.isAuthenticated()).toBe(true);

    // 檢查 sessionStorage 中是否有正確的數據
    const storedData = window.sessionStorage.getItem('user-session');
    console.log('Stored data in sessionStorage:', storedData);

    // 確保有存儲數據
    expect(storedData).toBeTruthy();

    // 解析存儲的數據
    const parsedData = JSON.parse(storedData || '{}');
    console.log('Parsed sessionStorage data:', parsedData);

    // 檢查狀態結構
    expect(parsedData.state).toBeDefined();
    expect(parsedData.state.user).toBeDefined();
    expect(parsedData.state.user.name).toBe('testUser');

    // 登出
    testStore.getState().logout();

    // 等待異步操作完成
    await new Promise((resolve) => setTimeout(resolve, 100));

    // 驗證狀態已更新
    expect(testStore.getState().user).toBe(null);
    expect(testStore.getState().isAuthenticated()).toBe(false);

    // 檢查 sessionStorage 是否被清除
    const afterLogout = JSON.parse(
      window.sessionStorage.getItem('user-session') || '{}'
    );
    console.log('After logout sessionStorage:', afterLogout);
    expect(afterLogout.state).toStrictEqual({ user: null });
  });

  it('應該從 sessionStorage 恢復狀態', async () => {
    // 設置模擬的 sessionStorage 數據
    const mockState = {
      state: {
        user: { name: 'restoredUser' }
      },
      version: 0
    };
    window.sessionStorage.setItem('user-session', JSON.stringify(mockState));

    // 定義 store 的類型和狀態
    type TestStoreState = {
      user: { name: string } | null;
      login: (name: string) => void;
      logout: () => void;
      isAuthenticated: () => boolean;
    };

    // 創建一個新的 store 實例
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

    // 創建並初始化 store
    const store = createStore();

    // 等待異步操作完成
    await new Promise((resolve) => setTimeout(resolve, 100));

    // 獲取狀態並驗證
    const state = store.getState();
    console.log('Current store state:', state); // 添加日誌調試
    console.log(
      'Session storage:',
      window.sessionStorage.getItem('user-session')
    ); // 添加日誌調試

    expect(state.user).toEqual({ name: 'restoredUser' });
    expect(state.isAuthenticated()).toBe(true);
  });
});
