import { h, createContext, type ComponentChildren } from 'preact';
import { useContext, useState, useEffect, useCallback } from 'preact/hooks';
import { authStore, type AuthUser } from '../services/auth-store';

interface AuthContextType {
  user: AuthUser | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  register: (username: string, email: string, password: string, displayName?: string) => Promise<{ ok: boolean; error?: string }>;
  updateProfile: (data: { display_name?: string; email?: string; password?: string }) => Promise<{ ok: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ComponentChildren }) {
  const [user, setUser] = useState<AuthUser | null>(authStore.user);
  const [isLoading, setIsLoading] = useState(!authStore.isInitialized);

  useEffect(() => {
    const unsub = authStore.subscribe((u) => {
      setUser(u);
      setIsLoading(false);
    });

    if (!authStore.isInitialized) {
      authStore.init().finally(() => {
        setIsLoading(false);
      });
    }

    return () => unsub();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const result = await authStore.login(username, password);
    return result;
  }, []);

  const logout = useCallback(async () => {
    await authStore.logout();
  }, []);

  const register = useCallback(async (username: string, email: string, password: string, displayName?: string) => {
    const result = await authStore.register(username, email, password, displayName);
    return result;
  }, []);

  const updateProfile = useCallback(async (data: { display_name?: string; email?: string; password?: string }) => {
    const result = await authStore.updateProfile(data);
    return result;
  }, []);

  const value: AuthContextType = {
    user,
    isLoggedIn: !!user,
    isAdmin: user?.role === 'admin',
    isLoading,
    login,
    logout,
    register,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
