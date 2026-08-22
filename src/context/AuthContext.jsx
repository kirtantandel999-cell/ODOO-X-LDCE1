import React, { createContext, useContext, useState } from 'react';
import { AuthService } from '../services/AuthService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => AuthService.getCurrentUser());
  const [token, setToken] = useState(() => AuthService.getToken());
  const [loading, setLoading] = useState(false);

  // ── Login ─────────────────────────────────────
  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await AuthService.login(email, password);
      setUser(response.user);
      setToken(response.token);
      return response;
    } finally {
      setLoading(false);
    }
  };

  // ── Register + auto-login ─────────────────────
  const register = async (userData) => {
    setLoading(true);
    try {
      const regResponse = await AuthService.register(userData);

      // Auto-login after successful registration to get a JWT token
      try {
        const loginResponse = await AuthService.login(userData.email, userData.password);
        setUser(loginResponse.user);
        setToken(loginResponse.token);
        return { ...regResponse, autoLoggedIn: true };
      } catch {
        // Auto-login failed — caller should redirect to login page
        return { ...regResponse, autoLoggedIn: false };
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Logout ────────────────────────────────────
  const logout = async () => {
    await AuthService.logout();
    setUser(null);
    setToken(null);
  };

  // ── Update user in global state + localStorage ─
  const updateUser = (userData) => {
    setUser(userData);
    try {
      localStorage.setItem('globetrotter_user', JSON.stringify(userData));
    } catch (e) {
      console.error('Failed to persist updated user', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        login,
        register,
        logout,
        updateUser,
        loading,
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
