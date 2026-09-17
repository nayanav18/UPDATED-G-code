import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string, confirm: string) => Promise<{ verificationHint?: string }>;
  verify: (email: string, code: string) => Promise<void>;
  logout: () => void;
  verificationPendingEmail: string | null;
  setVerificationPendingEmail: (email: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [verificationPendingEmail, setVerificationPendingEmail] = useState<string | null>(null);

  useEffect(() => {
    // Check saved session in localStorage (Rule 48: Session State survives refresh)
    try {
      const savedUser = localStorage.getItem('ea_auth_user');
      const savedToken = localStorage.getItem('ea_auth_token');
      if (savedUser && savedToken) {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
      }
    } catch (e) {
      console.error('Failed to restore auth session', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.login({ email, password: pass });
    setUser(res.user);
    setToken(res.token);
    localStorage.setItem('ea_auth_user', JSON.stringify(res.user));
    localStorage.setItem('ea_auth_token', res.token);
  };

  const register = async (name: string, email: string, pass: string, confirm: string) => {
    const res = await api.register({ name, email, password: pass, confirmPassword: confirm });
    setVerificationPendingEmail(email);
    return { verificationHint: res.verificationHint };
  };

  const verify = async (email: string, code: string) => {
    const res = await api.verify({ email, code });
    // After verification, automatically login or prepare for login
    setVerificationPendingEmail(null);
  };

  const logout = () => {
    // Rule 49: Logout must clear the active authenticated session. Do not delete conversations/dashboards/saved work.
    setUser(null);
    setToken(null);
    localStorage.removeItem('ea_auth_user');
    localStorage.removeItem('ea_auth_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        verify,
        logout,
        verificationPendingEmail,
        setVerificationPendingEmail
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
