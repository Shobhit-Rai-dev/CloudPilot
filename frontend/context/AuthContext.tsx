'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => Promise<void>;
  hasPermission: (perm: string) => boolean;
}

const DEFAULT_ADMIN: User = {
  id: 'usr-admin-default',
  email: 'admin@cloudops.io',
  name: 'Cloud Administrator',
  role: 'ADMIN',
  permissions: ['*'],
};

const AuthContext = createContext<AuthContextType>({
  user: DEFAULT_ADMIN,
  token: null,
  isLoading: false,
  login: async () => {},
  logout: () => {},
  switchRole: async () => {},
  hasPermission: () => true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(DEFAULT_ADMIN);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check saved token or initialize default admin
    const savedToken = localStorage.getItem('cloudops_token');
    if (savedToken) {
      setToken(savedToken);
      api
        .getMe()
        .then((userData) => {
          setUser(userData);
        })
        .catch(() => {
          // If offline or expired, preserve default admin
          setUser(DEFAULT_ADMIN);
        })
        .finally(() => setIsLoading(false));
    } else {
      // Auto-authenticate as default admin for seamless demo
      setUser(DEFAULT_ADMIN);
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(email, password);
      localStorage.setItem('cloudops_token', res.access_token);
      setToken(res.access_token);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('cloudops_token');
    setToken(null);
    setUser(null);
  };

  const switchRole = async (role: UserRole) => {
    // Convenient 1-click role switcher for evaluating RBAC behavior
    const roleCredentials: Record<UserRole, { email: string; pass: string }> = {
      ADMIN: { email: 'admin@cloudops.io', pass: 'admin123' },
      DEVELOPER: { email: 'developer@cloudops.io', pass: 'dev123' },
      VIEWER: { email: 'viewer@cloudops.io', pass: 'viewer123' },
    };

    const creds = roleCredentials[role];
    try {
      await login(creds.email, creds.pass);
    } catch {
      // Offline fallback state update
      setUser({
        id: `usr-${role.toLowerCase()}`,
        email: creds.email,
        name: role === 'ADMIN' ? 'Cloud Administrator' : role === 'DEVELOPER' ? 'DevOps Engineer' : 'Security Auditor',
        role: role,
        permissions: role === 'ADMIN' ? ['*'] : role === 'DEVELOPER' ? ['resource.read', 'metrics.read', 'cost.read', 'health.read', 'scaling.recommend'] : ['resource.read', 'metrics.read', 'cost.read', 'health.read'],
      });
    }
  };

  const hasPermission = (perm: string): boolean => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    if (!user.permissions) return false;
    return user.permissions.includes(perm) || user.permissions.includes('*');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        switchRole,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
