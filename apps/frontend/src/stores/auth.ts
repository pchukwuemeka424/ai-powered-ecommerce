'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
import axios from 'axios';
import { authApi } from '@/lib/api';

/** Must stay in sync with backend JWT_EXPIRES_IN (default 10y). Cookie max-age in days. */
const AUTH_TOKEN_COOKIE_DAYS = 3650;

function authCookieOptions(): Cookies.CookieAttributes {
  return { expires: AUTH_TOKEN_COOKIE_DAYS, sameSite: 'strict' };
}

function apiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string; message?: string } | undefined;
    if (data?.error) return data.error;
    if (data?.message) return data.message;
    if (err.response?.status === 400 && data && typeof data === 'object' && 'details' in data) {
      return 'Please check the form and try again.';
    }
  }
  return fallback;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface Store {
  id: string;
  subdomain: string;
  name: string;
  status?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  currentStore: Store | null;
  stores: Store[];
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: Record<string, unknown>) => Promise<void>;
  logout: () => void;
  setCurrentStore: (store: Store) => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      currentStore: null,
      stores: [],
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await authApi.login({
            email: email.trim().toLowerCase(),
            password,
          });
          const { token, user, stores } = data;

          Cookies.set('auth_token', token, authCookieOptions());
          set({
            token,
            user,
            stores,
            currentStore: stores[0] ?? null,
            isLoading: false,
          });
        } catch (err) {
          set({ isLoading: false });
          throw new Error(apiErrorMessage(err, 'Invalid email or password'));
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const { data: response } = await authApi.register(data);
          const { token, user, store } = response;

          Cookies.set('auth_token', token, authCookieOptions());
          set({
            token,
            user,
            stores: [store],
            currentStore: store,
            isLoading: false,
          });
        } catch (err) {
          set({ isLoading: false });
          throw new Error(apiErrorMessage(err, 'Registration failed'));
        }
      },

      logout: () => {
        Cookies.remove('auth_token');
        set({ user: null, token: null, currentStore: null, stores: [] });
        window.location.href = '/auth/login';
      },

      setCurrentStore: (store) => set({ currentStore: store }),

      loadUser: async () => {
        const token = Cookies.get('auth_token');
        if (!token) return;
        set({ isLoading: true });
        try {
          const { data } = await authApi.me();
          set((state) => ({
            token,
            user: data.user,
            stores: data.stores ?? state.stores,
            currentStore:
              state.currentStore &&
              data.stores?.some((s: Store) => s.id === state.currentStore?.id)
                ? state.currentStore
                : (data.stores?.[0] ?? null),
            isLoading: false,
          }));
        } catch {
          Cookies.remove('auth_token');
          set({
            user: null,
            token: null,
            currentStore: null,
            stores: [],
            isLoading: false,
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        currentStore: state.currentStore,
        stores: state.stores,
      }),
    }
  )
);
