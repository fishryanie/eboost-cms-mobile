import { Platform } from 'react-native';
import { fs } from 'themes/scaling';

export const FontFamily = {
  thin: 'Inter_100Thin',
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  black: 'Inter_900Black',
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

export const Typography = {
  body: {
    fontFamily: FontFamily.medium,
    fontSize: fs(16),
    lineHeight: fs(24),
  },
  caption: {
    fontFamily: FontFamily.regular,
    fontSize: fs(12),
    lineHeight: fs(16),
  },
  label: {
    fontFamily: FontFamily.semibold,
    fontSize: fs(14),
    lineHeight: fs(20),
  },
  sectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: fs(19),
    lineHeight: fs(24),
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: fs(32),
    lineHeight: fs(38),
  },
} as const;
