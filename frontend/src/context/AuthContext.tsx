/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { authService, TOKEN_STORAGE_KEY } from '../api';
import type { UserCreate, UserLogin, UserResponse } from '../types';

interface AuthContextType {
  user: UserResponse | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (credentials: UserLogin) => Promise<void>;
  register: (userData: UserCreate) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  // Verifica si existe un token válido al iniciar la aplicación
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const profile = await authService.getMe();
        setUser(profile);
      } catch {
        authService.logout();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    void initAuth();
  }, []);

  // Escucha expiraciones de token detectadas por el interceptor 401 de Axios
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (credentials: UserLogin): Promise<void> => {
    const response = await authService.login(credentials);
    setUser(response.user);
  };

  const register = async (userData: UserCreate): Promise<void> => {
    const response = await authService.register(userData);
    setUser(response.user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isAdmin: user?.role === 'admin',
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe utilizarse dentro de un AuthProvider');
  }
  return context;
}