import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { User, UserRole } from '@/types/fineguard';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  selectedCompanyId: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setSelectedCompany: (companyId: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Mock login for development
const MOCK_USERS: Record<string, User> = {
  'partner@fineguard.co.uk': {
    id: 'u1',
    email: 'partner@fineguard.co.uk',
    name: 'Sarah Thompson',
    role: 'partner' as UserRole,
    companyIds: ['c1', 'c2', 'c3'],
    mfaEnabled: true,
    createdAt: '2023-01-15',
  },
  'accountant@fineguard.co.uk': {
    id: 'u2',
    email: 'accountant@fineguard.co.uk',
    name: 'James Wilson',
    role: 'senior_accountant' as UserRole,
    companyIds: ['c1', 'c2'],
    mfaEnabled: false,
    createdAt: '2023-03-10',
  },
  'demo@fineguard.co.uk': {
    id: 'u3',
    email: 'demo@fineguard.co.uk',
    name: 'Demo User',
    role: 'accountant' as UserRole,
    companyIds: ['c1'],
    mfaEnabled: false,
    createdAt: '2024-01-01',
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('fg_user');
    const companyId = localStorage.getItem('fg_company');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as User;
        setUser(parsed);
        setSelectedCompanyId(companyId ?? parsed.companyIds[0] ?? null);
      } catch {
        localStorage.removeItem('fg_user');
      }
    }
  }, []);

  const login = useCallback(async (email: string, _password: string) => {
    // In production this would call the API
    const mockUser = MOCK_USERS[email.toLowerCase()];
    if (!mockUser) {
      throw new Error('Invalid email or password');
    }

    localStorage.setItem('fg_user', JSON.stringify(mockUser));
    localStorage.setItem('fg_token', 'mock-jwt-token-' + mockUser.id);
    const defaultCompany = mockUser.companyIds[0];
    if (defaultCompany) {
      localStorage.setItem('fg_company', defaultCompany);
      setSelectedCompanyId(defaultCompany);
    }
    setUser(mockUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('fg_user');
    localStorage.removeItem('fg_token');
    localStorage.removeItem('fg_company');
    setUser(null);
    setSelectedCompanyId(null);
  }, []);

  const setSelectedCompany = useCallback((companyId: string) => {
    localStorage.setItem('fg_company', companyId);
    setSelectedCompanyId(companyId);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, selectedCompanyId, login, logout, setSelectedCompany }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
