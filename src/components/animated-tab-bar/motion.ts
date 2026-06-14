import { Easing, type EasingFunctionFactory as IEasingFunction } from 'react-native-reanimated';

import type { INavItem, IPalette } from './types';

const EASING: IEasingFunction = Easing.bezier(0.22, 1, 0.36, 1);
const DURATION = 600;
const ICON_BOX = 50;
const LABEL_PAD = 14;
const LABEL_MARGIN = -6;
const PANEL_SLIDE = 65;
const TAB_HEIGHT = 48;

function palette<T extends 'dark' | 'light'>(scheme: T): IPalette {
  if (scheme === 'dark') {
    return {
      accent: 'rgba(255,255,255,0.10)',
      border: 'rgba(255,255,255,0.06)',
      foreground: '#f5f5f7',
      hover: 'rgba(255,255,255,0.06)',
      input: 'rgba(255,255,255,0.06)',
      muted: '#8e8e93',
      surface: 'rgba(24,24,27,0.92)',
    };
  }

  return {
    accent: 'rgba(0,0,0,0.06)',
    border: 'rgba(0,0,0,0.08)',
    foreground: '#0a0a0a',
    hover: 'rgba(0,0,0,0.04)',
    input: 'rgba(0,0,0,0.04)',
    muted: '#71717a',
    surface: 'rgba(255,255,255,0.98)',
  };
}

function estimateToolbarWidth(items: INavItem[], activeKey: string | undefined) {
  const active = items.find(item => item.key === activeKey);
  const labelW = active ? Math.ceil(active.label.length * 8.5 + 4) + LABEL_PAD + LABEL_MARGIN : 0;
  const gaps = Math.max(items.length - 1, 0) * 2;
  return items.length * ICON_BOX + labelW + gaps + 12;
}

function viewIndex(items: INavItem[], view: string) {
  return items.findIndex(item => item.key === view);
}

export { DURATION, EASING, ICON_BOX, LABEL_PAD, LABEL_MARGIN, PANEL_SLIDE, TAB_HEIGHT, estimateToolbarWidth, palette, viewIndex };
