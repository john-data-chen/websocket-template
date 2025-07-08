import { useCallback } from 'react';
import { useSessionStore } from '../stores/useSessionStore';

export function useAuth() {
  const { user, login, logout: logoutUser } = useSessionStore();

  const logout = useCallback(() => {
    logoutUser();
  }, [logoutUser]);

  return {
    user,
    login,
    logout
  };
}
