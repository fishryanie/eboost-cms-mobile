import { useCallback, useEffect } from 'react';
import { useAnimatedScrollHandler } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useScrollStore } from 'utils/scroll-store';

export function useTabScrollHandler(tab: string) {
  const updateHeader = useCallback((isScrolled: boolean) => useScrollStore.getState().setTabScrolled(tab, isScrolled), [tab]);

  useEffect(() => {
    updateHeader(false);
  }, [updateHeader]);

  return useAnimatedScrollHandler<{ isScrolled?: boolean }>({
    onScroll: (event, context) => {
      const isScrolled = event.contentOffset.y > 20;
      if (context.isScrolled === isScrolled) return;

      context.isScrolled = isScrolled;
      // Notify React only when the header crosses its visibility threshold.
      scheduleOnRN(updateHeader, isScrolled);
    },
  });
}
