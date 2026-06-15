import { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { BlurViewProps } from 'expo-blur';
import React from 'react';

export interface AnimatedHeaderProps {
  largeTitle?: string;
  subtitle?: string;
  children?: React.ReactNode;
  searchBar?: React.ReactNode;
  rightComponent?: React.ReactNode;
  canGoBack?: boolean;
  onBack?: () => void;
  showsVerticalScrollIndicator?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  headerBackgroundGradient?: {
    colors: string[];
    start?: { x: number; y: number };
    end?: { x: number; y: number };
    locations?: number[];
  };
  headerBlurConfig?: {
    intensity: number;
    tint: BlurViewProps['tint'];
  };
  smallTitleBlurIntensity?: number;
  smallTitleBlurTint?: BlurViewProps['tint'];
  maskGradientColors?: {
    start: string;
    middle: string;
    end: string;
  };
  largeTitleBlurIntensity?: number;
  largeTitleContainerStyle?: StyleProp<ViewStyle>;
  largeHeaderTitleStyle?: StyleProp<TextStyle>;
  largeHeaderSubtitleStyle?: StyleProp<TextStyle>;
  smallHeaderSubtitleStyle?: StyleProp<TextStyle>;
  smallHeaderTitleStyle?: StyleProp<TextStyle>;
  isFlatList?: boolean;
  flatListProps?: import('react-native').FlatListProps<any>;
}
