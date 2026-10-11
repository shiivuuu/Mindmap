import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('mindmesh_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const profile = await authApi.getProfile();
        setUser(profile);
      } catch (err) {
        console.error('Failed to load profile, clearing token:', err);
        localStorage.removeItem('mindmesh_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [token]);

  const login = async (email, password) => {
    const data = await authApi.login(email, password);
    localStorage.setItem('mindmesh_token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  };

  const loginDemo = async (role = 'student') => {
    if (role === 'admin') {
      return login('admin@mindmesh.ai', 'admin123');
    }
    return login('demo@mindmesh.ai', 'mindmesh123');
  };

  const register = async (email, password, fullName) => {
    const data = await authApi.register(email, password, fullName);
    localStorage.setItem('mindmesh_token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('mindmesh_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        login,
        loginDemo,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
