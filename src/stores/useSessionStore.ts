import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface SessionState {
  user: {
    name: string | null;
  } | null;
  login: (name: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useSessionStore = create<SessionState>()(
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
