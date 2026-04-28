import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUiStore = create(
  persist(
    (set) => ({
      sidebarOpen: true,
      activeModal: null,
      theme: 'dark',
      offlineMode: false,
      cloudSync: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setModal: (modal) => set({ activeModal: modal }),
      setTheme: (theme) => set({ theme }),
      toggleOfflineMode: () => set((state) => ({ offlineMode: !state.offlineMode })),
      toggleCloudSync: () => set((state) => ({ cloudSync: !state.cloudSync })),
    }),
    { name: 'antigravity-ui-store' }
  )
);
