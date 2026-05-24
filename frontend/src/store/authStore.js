import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import authService from '../services/authService';
import { handleApiError } from '../utils/errorHandler';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      // ── Actions ──────────────────────────────────────────

      login: async (username, password) => {
        const res = await authService.login(username, password);
        if (res.success) {
          set({
            user: res.user,
            accessToken: res.accessToken,
            isAuthenticated: true,
          });
        }
        return res;
      },

      logout: async () => {
        try {
          await authService.logout();
        } catch (_) {
          // Ignore logout errors — clear local state regardless
        }
        set({ user: null, accessToken: null, isAuthenticated: false });
      },

      refreshAuth: async () => {
        try {
          const res = await authService.refreshToken();
          if (res.success) {
            set({ accessToken: res.accessToken });
            return true;
          }
        } catch (_) {
          set({ user: null, accessToken: null, isAuthenticated: false });
          return false;
        }
      },

      setAccessToken: (accessToken) => set({ accessToken }),

      // Sync user profile from server (e.g. after page reload)
      syncProfile: async () => {
        try {
          const res = await authService.getCurrentUser();
          if (res.success) {
            set({ user: res.data });
          }
        } catch (err) {
          handleApiError(err, { silent: true });
        }
      },
    }),
    {
      name: 'naseeb-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
