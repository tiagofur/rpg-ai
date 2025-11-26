import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { secureStorage, StoredUser } from '../services/secureStorage';
import { authApi } from '../api/auth';
import { socketService } from '../api/socket';

// ============================================================================
// Types
// ============================================================================

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthState {
  status: AuthStatus;
  user: StoredUser | null;
  accessToken: string | null;
}

export interface AuthContextType extends AuthState {
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;

  // Computed
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ============================================================================
// Context
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    status: 'loading',
    user: null,
    accessToken: null,
  });

  // --------------------------------------------------------------------------
  // Initialize: Check for stored session on app start
  // --------------------------------------------------------------------------
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const [tokens, user] = await Promise.all([
          secureStorage.getTokens(),
          secureStorage.getUser(),
        ]);

        if (tokens && user) {
          // Connect WebSocket with stored token
          socketService.connect(tokens.accessToken);

          setState({
            status: 'authenticated',
            user,
            accessToken: tokens.accessToken,
          });
        } else {
          setState({
            status: 'unauthenticated',
            user: null,
            accessToken: null,
          });
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to initialize auth:', error);
        setState({
          status: 'unauthenticated',
          user: null,
          accessToken: null,
        });
      }
    };

    void initializeAuth();
  }, []);

  // --------------------------------------------------------------------------
  // Login
  // --------------------------------------------------------------------------
  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    const { user, accessToken, refreshToken } = response.data;

    // Save to secure storage
    await Promise.all([
      secureStorage.saveTokens({ accessToken, refreshToken }),
      secureStorage.saveUser(user),
    ]);

    // Connect WebSocket
    socketService.connect(accessToken);

    setState({
      status: 'authenticated',
      user,
      accessToken,
    });
  }, []);

  // --------------------------------------------------------------------------
  // Register
  // --------------------------------------------------------------------------
  const register = useCallback(
    async (email: string, username: string, password: string) => {
      // Register creates user but doesn't return tokens - need to login after
      await authApi.register(email, username, password);

      // Auto-login after successful registration
      await login(email, password);
    },
    [login]
  );

  // --------------------------------------------------------------------------
  // Logout
  // --------------------------------------------------------------------------
  const logout = useCallback(async () => {
    try {
      // Disconnect WebSocket
      socketService.disconnect();

      // Clear storage
      await secureStorage.clearAll();

      setState({
        status: 'unauthenticated',
        user: null,
        accessToken: null,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Logout error:', error);
      // Even if clearing fails, reset state
      setState({
        status: 'unauthenticated',
        user: null,
        accessToken: null,
      });
    }
  }, []);

  // --------------------------------------------------------------------------
  // Refresh Session
  // --------------------------------------------------------------------------
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const refreshToken = await secureStorage.getRefreshToken();
      if (!refreshToken) {
        await logout();
        return false;
      }

      // TODO: Implement refresh token endpoint call
      // const response = await authApi.refresh(refreshToken);
      // await secureStorage.saveTokens(response.data);
      // setState(prev => ({ ...prev, accessToken: response.data.accessToken }));

      return true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to refresh session:', error);
      await logout();
      return false;
    }
  }, [logout]);

  // --------------------------------------------------------------------------
  // Memoized Context Value
  // --------------------------------------------------------------------------
  const contextValue = useMemo<AuthContextType>(
    () => ({
      ...state,
      login,
      register,
      logout,
      refreshSession,
      isAuthenticated: state.status === 'authenticated',
      isLoading: state.status === 'loading',
    }),
    [state, login, register, logout, refreshSession]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

// ============================================================================
// Hook
// ============================================================================

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Convenience hook for just checking auth status
export function useAuthStatus() {
  const { status, isAuthenticated, isLoading } = useAuth();
  return { status, isAuthenticated, isLoading };
}

// Convenience hook for user data only
export function useUser() {
  const { user } = useAuth();
  return user;
}
