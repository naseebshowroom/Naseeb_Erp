import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { settingsService } from '../services/index';

/**
 * Persisted cache for ShopSettings.
 * Loaded once on app boot and cached locally.
 * Used by PDF generators, receipts, and agreements
 * without making a network request every time.
 */
export const useSettingsStore = create(
  persist(
    (set) => ({
      settings: null,
      isLoaded: false,

      fetch: async () => {
        try {
          const res = await settingsService.get();
          if (res.success) {
            set({ settings: res.data, isLoaded: true });
          }
        } catch (_) {
          // Fail silently — use defaults below
        }
      },

      update: async (data) => {
        const res = await settingsService.update(data);
        if (res.success) {
          set({ settings: res.data });
        }
        return res;
      },
    }),
    {
      name: 'naseeb-settings',
      partialize: (state) => ({ settings: state.settings, isLoaded: state.isLoaded }),
    }
  )
);
