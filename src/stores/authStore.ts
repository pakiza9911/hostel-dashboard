import { create } from 'zustand';
import type { User } from '../types';
import { authAPI } from '../lib/api';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  switchRole: (role: User['role']) => Promise<void>;
  fetchUser: () => Promise<void>;
}

export const useAuth = create<AuthState>()((set) => ({
  user: null,
  isLoading: false,
  error: null,
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.login(email, password);
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      console.log('Login successful - saved to localStorage:', { token: token.substring(0, 20) + '...', user });
      set({ user, isLoading: false });
      return { ok: true };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      console.error('Login failed:', errorMessage, error.response?.data);
      alert(`Login failed: ${errorMessage}`);
      set({ error: errorMessage, isLoading: false });
      return { ok: false, error: errorMessage };
    }
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null });
  },
  switchRole: async (role) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.switchRole(role);
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, isLoading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to switch role';
      set({ error: errorMessage, isLoading: false });
    }
  },
  fetchUser: async () => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    console.log('fetchUser called - localStorage:', { 
      hasToken: !!token, 
      hasUser: !!storedUser,
      tokenPreview: token ? token.substring(0, 20) + '...' : 'none'
    });
    
    // First try to load from localStorage for instant access
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log('Loaded user from localStorage:', parsedUser);
        set({ user: parsedUser, isLoading: false });
      } catch (e) {
        console.error('Failed to parse stored user:', e);
        localStorage.removeItem('user');
      }
    }
    
    if (!token) {
      console.log('No token found, setting user to null');
      set({ user: null, isLoading: false });
      return;
    }
    
    // Verify with API in background
    try {
      const response = await authAPI.getMe();
      const user = response.data;
      console.log('API verification successful, user:', user);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, isLoading: false });
    } catch (error: any) {
      console.error('API verification failed:', error);
      // Only clear session if it's a 401 (unauthorized) error
      if (error.response?.status === 401) {
        console.log('401 error - clearing session');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, isLoading: false });
      } else {
        // For other errors, keep the user from localStorage
        console.log('Non-401 error - keeping local session');
        set({ isLoading: false });
      }
    }
  },
}));
