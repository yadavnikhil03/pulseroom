import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { loginAccount, logoutAccount, refreshAccount, registerAccount, setAccessToken } from '../utils/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const acceptSession = response => {
    setAccessToken(response.data.accessToken);
    setUser(response.data.user);
    return response.data.user;
  };

  useEffect(() => {
    refreshAccount().then(acceptSession).catch(() => setAccessToken(null)).finally(() => setIsBootstrapping(false));
  }, []);

  const value = useMemo(() => ({
    user,
    isBootstrapping,
    login: credentials => loginAccount(credentials).then(acceptSession),
    register: details => registerAccount(details).then(acceptSession),
    logout: async () => {
      try { await logoutAccount(); } finally { setAccessToken(null); setUser(null); }
    }
  }), [user, isBootstrapping]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
};
