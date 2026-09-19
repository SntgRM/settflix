import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { login as apiLogin, logout as apiLogout } from '../api/auth';
import { session } from '../api/session';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => session.getUser());

  const login = useCallback(async (username, password) => {
    const data = await apiLogin(username, password);
    session.save(data);
    setUser(data.user);
    return data;
  }, []);

  const clearSession = useCallback(() => {
    session.clear();
    setUser(null);
  }, []);

  const logout = useCallback(async () => {
    const refresh = session.getRefresh();

    try {
      if (refresh) {
        await apiLogout(refresh);
      }
    } finally {
      clearSession();
    }
  }, [clearSession]);

  useEffect(
    () => session.onExpired(clearSession),
    [clearSession]
  );

  const value = useMemo(
    () => ({ user, login, logout }), 
    [user, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
};
