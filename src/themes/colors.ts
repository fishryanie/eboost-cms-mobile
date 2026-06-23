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
  antiFlashWhite: '#F1F1F1',
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
