import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { login as apiLogin } from '../api/auth';
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

  const logout = useCallback(() => {
    session.clear();
    setUser(null);
  }, []);

  useEffect(() => session.onExpired(logout), [logout]);

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
};
