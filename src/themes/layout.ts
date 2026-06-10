import { Platform } from 'react-native';
import { mhs, vs } from 'themes/scaling';

export const Spacing = {
  half: mhs(2),
  one: mhs(4),
  two: mhs(8),
  three: mhs(12),
  four: mhs(16),
  five: mhs(24),
  six: mhs(32),
  seven: mhs(40),
  eight: mhs(64),
} as const;

export const Radius = {
  small: mhs(12),
  medium: mhs(16),
  large: mhs(21),
  pill: 999,
} as const;

export const BottomTabInset = vs(Platform.select({ ios: 50, android: 80 }) ?? 0);
