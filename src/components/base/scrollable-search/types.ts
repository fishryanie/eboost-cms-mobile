import type { SharedValue, WithSpringConfig } from 'react-native-reanimated';
import * as React from 'react';
import type { BlurTint } from 'expo-blur';

interface IScrollableSearchItem {
  readonly accentColor?: string;
  readonly description: string;
  readonly id: string;
  readonly section?: string;
  readonly title: string;
}

interface IScrollableSearchContext {
  isFocused: boolean;
  setIsFocused: (focused: boolean) => void;
  scrollY: SharedValue<number>;
  pullDistance: SharedValue<number>;
  shouldAutoFocus: SharedValue<boolean>;
  onPullToFocusCallbackRef: React.MutableRefObject<(() => void) | null>;
}

interface IScrollContent {
  children: React.ReactNode;
  readonly pullThreshold?: number;
}
interface IAnimatedComponent {
  children: React.ReactNode;
  readonly focusedOffset?: number;
  readonly unfocusedOffset?: number;
  readonly enablePullEffect?: boolean;
  readonly onPullToFocus?: () => void;
  readonly springConfig?: WithSpringConfig;
}

interface IOverlay {
  readonly children?: React.ReactNode;
  readonly onPress?: () => void;
  readonly enableBlur?: boolean;
  readonly blurTint?: BlurTint;
  readonly maxBlurIntensity?: number;
}

interface ISearchPanel {
  readonly items: IScrollableSearchItem[];
  readonly onClose: () => void;
  readonly onSelect: (item: IScrollableSearchItem) => void;
  readonly placeholder?: string;
  readonly title?: string;
  readonly visible: boolean;
}

type IFocusedScreen = React.PropsWithChildren;
type IScrollableSearch = React.PropsWithChildren;

export type { IScrollableSearchItem, IScrollableSearchContext, IScrollContent, IAnimatedComponent, IOverlay, ISearchPanel, IFocusedScreen, IScrollableSearch };
