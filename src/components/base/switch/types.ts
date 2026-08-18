import type { ReactNode } from 'react';
import type { ViewProps } from 'react-native';
import type { SharedValue, WithSpringConfig } from 'react-native-reanimated';

export type SwitchIconRenderProps = {
  color: string;
  size: number;
};

export type SwitchDeformation = {
  sideBlobScale?: number;
  squishY?: number;
  stretchX?: number;
};

export type SwitchConnector = {
  height?: number;
  offset?: number;
  show?: boolean;
};

export type SwitchProps = Omit<ViewProps, 'children'> & {
  activeColor?: string;
  animation?: WithSpringConfig;
  blur?: number;
  connector?: SwitchConnector;
  deformation?: SwitchDeformation;
  disabled?: boolean;
  gooey?: number;
  iconColor?: string;
  inactiveColor?: string;
  onDragBegin?: () => void;
  onDragFinish?: (value: boolean) => void;
  onValueChange?: (value: boolean) => void;
  renderActiveIcon?: (props: SwitchIconRenderProps) => ReactNode;
  renderInactiveIcon?: (props: SwitchIconRenderProps) => ReactNode;
  showIcons?: boolean;
  size?: number;
  toggleThreshold?: number;
  trackColor?: string;
  value?: boolean;
};

export type AnimatedOvalProps = {
  centerX: SharedValue<number>;
  centerY: number;
  isOn: SharedValue<boolean>;
  offColor: string;
  onColor: string;
  radiusX: SharedValue<number>;
  radiusY: SharedValue<number>;
};

export type ShadowOvalProps = Omit<AnimatedOvalProps, 'isOn' | 'offColor' | 'onColor'> & {
  color: string;
};

export type AnimatedBridgeProps = {
  centerY: number;
  color: string;
  height: number;
  leftX: number;
  mainX: SharedValue<number>;
  progress: SharedValue<number>;
  rightX: number;
};
