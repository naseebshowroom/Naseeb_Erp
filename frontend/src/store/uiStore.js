import { create } from 'zustand';

export const useUiStore = create((set) => ({
  sidebarOpen: true,
  notifications: [],
  loadingStates: {}, // { [key: string]: boolean }

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  setLoading: (key, value) =>
    set((s) => ({ loadingStates: { ...s.loadingStates, [key]: value } })),

  addNotification: (notification) =>
    set((s) => ({
      notifications: [
        { id: Date.now(), ...notification },
        ...s.notifications,
      ].slice(0, 50), // keep max 50
    })),

  clearNotifications: () => set({ notifications: [] }),
}));
