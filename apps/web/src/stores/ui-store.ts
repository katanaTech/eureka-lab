import { create } from 'zustand';

interface UiState {
  /** Whether the sidebar is open on mobile */
  sidebarOpen: boolean;
  /** Toggle sidebar visibility */
  toggleSidebar: () => void;
  /** Set sidebar state explicitly */
  setSidebarOpen: (open: boolean) => void;
  /** Current locale */
  locale: string;
  /** Set locale */
  setLocale: (locale: string) => void;
}

/**
 * Zustand store for UI state — sidebar, locale, theme preferences.
 */
export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  locale: 'en',
  setLocale: (locale) => set({ locale }),
}));
