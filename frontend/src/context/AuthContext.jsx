import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('svc_token') || null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('svc_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'register'

  useEffect(() => {
    if (token) {
      localStorage.setItem('svc_token', token);
    } else {
      localStorage.removeItem('svc_token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('svc_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('svc_user');
    }
  }, [user]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await authApi.login(email, password);
      setToken(response.token);
      setUser({
        email: response.email,
        username: response.username,
        role: response.role,
        userId: response.userId
      });
      setAuthModalOpen(false);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (username, email, password, phoneNumber) => {
    setLoading(true);
    try {
      const response = await authApi.register({ username, email, password, phoneNumber });
      setToken(response.token);
      setUser({
        email: response.email,
        username: response.username,
        role: response.role,
        userId: response.userId
      });
      setAuthModalOpen(false);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('svc_token');
    localStorage.removeItem('svc_user');
  };

  const openLoginModal = () => {
    setAuthModalMode('login');
    setAuthModalOpen(true);
  };

  const openRegisterModal = () => {
    setAuthModalMode('register');
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  const isAuthenticated = !!token && !!user;
  const isAdmin = user?.role === 'ROLE_ADMIN';

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        isAuthenticated,
        isAdmin,
        login,
        register,
        logout,
        authModalOpen,
        authModalMode,
        setAuthModalMode,
        openLoginModal,
        openRegisterModal,
        closeAuthModal
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

