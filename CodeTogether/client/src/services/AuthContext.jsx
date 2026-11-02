import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from './api';
import { connectSocket, disconnectSocket } from './socket';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('ct_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('ct_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verify = async () => {
      if (token) {
        try {
          const res = await authAPI.getMe();
          const u = res.data.data.user;
          setUser(u);
          localStorage.setItem('ct_user', JSON.stringify(u));
          connectSocket(token);
        } catch {
          logout();
        }
      }
      setLoading(false);
    };
    verify();
  }, []);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('ct_token', authToken);
    localStorage.setItem('ct_user', JSON.stringify(userData));
    connectSocket(authToken);
  };

  const updateUser = (updatedUser) => {
    setUser((prev) => {
      const nextUser = updatedUser && typeof updatedUser === 'object'
        ? { ...prev, ...updatedUser }
        : prev;

      localStorage.setItem('ct_user', JSON.stringify(nextUser));
      return nextUser;
    });
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('ct_token');
    localStorage.removeItem('ct_user');
    disconnectSocket();
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, loading, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
