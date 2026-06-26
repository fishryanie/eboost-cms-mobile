import { create } from 'zustand';

interface ScrollStore {
  scrolledTabs: Record<string, boolean>;
  setTabScrolled: (tab: string, isScrolled: boolean) => void;
}

export const useScrollStore = create<ScrollStore>(set => ({
  scrolledTabs: {},
  setTabScrolled: (tab, isScrolled) =>
    set(state => {
      if (state.scrolledTabs[tab] === isScrolled) return state;
      return {
        scrolledTabs: {
          ...state.scrolledTabs,
          [tab]: isScrolled,
        },
      };
    }),
}));
