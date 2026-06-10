/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

export const Palette = {
  accent: '#01A74E',
  accentPressed: '#018C41',
  border: '#D8E0E7',
  borderSubtle: '#E8EDF2',
  danger: '#D92D20',
  dangerSurface: '#FFF1F0',
  surfaceBase: '#FFFFFF',
  surfaceMuted: '#F7F9FB',
  surfaceRaised: '#FFFFFF',
  textPrimary: '#1F2933',
  textSecondary: '#667085',
  textTertiary: '#8A97A6',
} as const;

export const Colors = {
  light: {
    text: Palette.textPrimary,
    background: Palette.surfaceBase,
    backgroundElement: Palette.surfaceMuted,
    backgroundSelected: '#E8F4EF',
    textSecondary: Palette.textSecondary,
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const FontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: FontFamily.medium,
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: FontFamily.medium,
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 24,
  six: 32,
  seven: 40,
  eight: 64,
} as const;

export const Radius = {
  small: 12,
  medium: 16,
  large: 21,
  pill: 999,
} as const;

export const Typography = {
  body: {
    fontFamily: FontFamily.medium,
    fontSize: 16,
    lineHeight: 24,
  },
  caption: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  label: {
    fontFamily: FontFamily.semibold,
    fontSize: 14,
    lineHeight: 20,
  },
  sectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 19,
    lineHeight: 24,
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: 32,
    lineHeight: 38,
  },
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
