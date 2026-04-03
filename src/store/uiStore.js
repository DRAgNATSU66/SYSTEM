import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUiStore = create(
  persist(
    (set) => ({
      sidebarOpen: true,
      activeModal: null,
      theme: 'dark',
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setModal: (modal) => set({ activeModal: modal }),
      setTheme: (theme) => set({ theme })
    }),
    { name: 'antigravity-ui-store' }
  )
);
