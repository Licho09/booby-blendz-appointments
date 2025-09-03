import { useState, useEffect } from 'react';
import { authAPI } from '../services/api';

interface User {
  id: string;
  email: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true
  });

  useEffect(() => {
    // Check for existing session on mount
    const checkAuth = () => {
      const user = authAPI.getCurrentUser();
      const isAuthenticated = authAPI.isAuthenticated();
      
      setAuthState({
        user,
        isAuthenticated,
        isLoading: false
      });
    };

    checkAuth();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const response = await authAPI.login(credentials);
      
      if (response.success) {
        const user = authAPI.getCurrentUser();
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false
        });
        return { success: true };
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return { success: false, error: response.error || 'Login failed' };
      }
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return { success: false, error: error instanceof Error ? error.message : 'Login failed' };
    }
  };

  const signup = async (userData: { email: string; password: string; confirmPassword: string }) => {
    if (userData.password !== userData.confirmPassword) {
      return { success: false, error: 'Passwords do not match' };
    }

    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const response = await authAPI.register({
        email: userData.email,
        password: userData.password
      });
      
      if (response.success) {
        const user = authAPI.getCurrentUser();
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false
        });
        return { success: true };
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return { success: false, error: response.error || 'Registration failed' };
      }
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return { success: false, error: error instanceof Error ? error.message : 'Registration failed' };
    }
  };

  const logout = () => {
    authAPI.logout();
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false
    });
  };

  return {
    ...authState,
    login,
    signup,
    logout
  };
};
