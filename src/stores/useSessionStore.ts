import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface SessionState {
  username: string | null;
  setUsername: (username: string) => void;
  clearSession: () => void;
  isLoggedIn: () => boolean;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      username: null,
      setUsername: (username: string) => set({ username }),
      clearSession: () => set({ username: null }),
      isLoggedIn: () => !!get().username
    }),
    {
      name: 'user-session',
      storage: createJSONStorage(() => sessionStorage)
    }
  )
);
