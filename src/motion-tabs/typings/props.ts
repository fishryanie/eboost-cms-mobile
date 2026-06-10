import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs/types';
import type { Route } from 'expo-router/build/react-navigation/native';
import type { ReactNode } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import type { IPalette, ISizeMap, TMenuView, TPopupRenderer } from './base';

interface INavItem {
  icon: <T extends boolean>(focused: T, color: string, size: number) => ReactNode;
  key: string;
  label: string;
  route: Route<string>;
  routeName: string;
}

interface IAnimatedTabBarProps extends BottomTabBarProps {
  popupDisabledRouteNames?: string[];
  popupEnabled?: boolean;
  renderPopupBody?: TPopupRenderer;
}

interface IMorphTabProps {
  active: boolean;
  colors: IPalette;
  item: INavItem;
  onPress: () => void;
}

interface IPanelLayerProps {
  active: boolean;
  colors: IPalette;
  direction: number;
  onLayout: (view: string, width: number, height: number) => void;
  renderPopupBody: TPopupRenderer;
  route: Route<string>;
  view: string;
}

interface IPanelStackProps {
  colors: IPalette;
  direction: number;
  items: INavItem[];
  onMeasure: (view: string, width: number, height: number) => void;
  renderPopupBody: TPopupRenderer;
  view: TMenuView;
}

interface IMeasurementLayerProps {
  colors: IPalette;
  items: INavItem[];
  onMeasure: (view: string, width: number, height: number) => void;
  renderPopupBody: TPopupRenderer;
}

interface ITabToolbarProps {
  activeKey: string | undefined;
  colors: IPalette;
  items: INavItem[];
  onLayout: (event: LayoutChangeEvent) => void;
  onPress: (item: INavItem) => void;
  view: TMenuView;
}

interface ICardMorphOptions {
  sizes: ISizeMap;
  toolbarH: number;
  toolbarMinW: number;
  toolbarW: number;
  view: TMenuView;
}

interface IProfileAccordionItemProps {
  body: string;
  colors: IPalette;
  subtitle: string;
  title: string;
  value: string;
}

export type {
  IAnimatedTabBarProps,
  ICardMorphOptions,
  IMeasurementLayerProps,
  IMorphTabProps,
  INavItem,
  IPanelLayerProps,
  IPanelStackProps,
  IProfileAccordionItemProps,
  ITabToolbarProps,
};
