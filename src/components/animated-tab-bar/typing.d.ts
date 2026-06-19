import type { Tabs } from 'expo-router';
import type { ComponentProps, ReactNode } from 'react';

declare global {
  type BottomTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];
  type SizeMap = Record<string, { h: number; w: number } | undefined>;
  type Measure = (view: string, width: number, height: number) => void;
  type NavItem = {
    icon: (focused: boolean, color: string, size: number) => ReactNode;
    key: string;
    label: string;
    routeName: string;
  };
  type PanelProps = {
    active: boolean;
    direction: number;
    item: NavItem;
    onClose: () => void;
    onMeasure: Measure;
  };
}

export {};
