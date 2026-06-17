import * as React from "react";
import type { BlurTint } from "expo-blur";
import type { ReactNode } from "react";
import type { ViewStyle, PressableProps, DimensionValue } from "react-native";

interface FlipCardContextValue {
  isFlipped: boolean;
  flip: () => void;
  width: number | DimensionValue;
  height: number | DimensionValue;
  borderRadius: number;
  blurIntensity: number;
  animationDuration: number;
  rotation: any;
  scale: any;
  tint: BlurTint;
  scaleEnabled: boolean;
}

interface FlipCardProps extends React.PropsWithChildren {
  readonly width?: number | DimensionValue;
  readonly height?: number | DimensionValue;
  readonly borderRadius?: number;
  readonly blurIntensity?: number;
  readonly containerStyle?: ViewStyle;
  readonly blurTint?: BlurTint;
  readonly animationDuration?: number;
  readonly enableHaptics?: boolean;
  readonly onFlip?: (isFlipped: boolean) => void;
  readonly scaleOnPress?: boolean;
}

interface FlipCardFrontProps extends React.PropsWithChildren {
  readonly style?: ViewStyle;
}

interface FlipCardBackProps extends React.PropsWithChildren {
  readonly style?: ViewStyle;
}

interface FlipCardTriggerProps extends Omit<PressableProps, "onPress"> {
  readonly children?: ReactNode;
  readonly asChild?: boolean;
}

export type {
  FlipCardContextValue,
  FlipCardProps,
  FlipCardFrontProps,
  FlipCardBackProps,
  FlipCardTriggerProps,
};
