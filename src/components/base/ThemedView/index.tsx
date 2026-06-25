import { forwardRef } from 'react';
import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Palette, type ThemeColor } from 'themes';
import { Radius, Spacing } from 'themes/layout';
import { handleFlex, handleFlexGrow, handleFlexShrink, handleRound, handleSquare, mhs, mvs } from 'themes/scaling';

import { SkeletonShimmer, type SkeletonReduceMotion } from './skeleton-shimmer';

type SpacingKey = keyof typeof Spacing;
type RadiusKey = keyof typeof Radius;

type ViewStyleSpacingKeys =
  | 'gap'
  | 'rowGap'
  | 'columnGap'
  | 'margin'
  | 'marginTop'
  | 'marginBottom'
  | 'marginLeft'
  | 'marginRight'
  | 'marginHorizontal'
  | 'marginVertical'
  | 'padding'
  | 'paddingTop'
  | 'paddingBottom'
  | 'paddingLeft'
  | 'paddingRight'
  | 'paddingHorizontal'
  | 'paddingVertical'
  | 'top'
  | 'bottom'
  | 'left'
  | 'right';

type ViewStyleRadiusKeys = 'borderRadius' | 'borderTopLeftRadius' | 'borderTopRightRadius' | 'borderBottomLeftRadius' | 'borderBottomRightRadius';

type DimensionValueWithSpacing = number | 'auto' | `${number}%` | SpacingKey;

export type ThemedViewProps = ViewProps &
  Omit<ViewStyle, 'width' | 'height'> & { width?: number | string; height?: number | string } & Omit<
    ViewStyle,
    'flex' | 'flexGrow' | 'flexShrink' | ViewStyleSpacingKeys | ViewStyleRadiusKeys
  > & {
    gap?: number | SpacingKey;
    rowGap?: number | SpacingKey;
    columnGap?: number | SpacingKey;
    margin?: DimensionValueWithSpacing;
    marginTop?: DimensionValueWithSpacing;
    marginBottom?: DimensionValueWithSpacing;
    marginLeft?: DimensionValueWithSpacing;
    marginRight?: DimensionValueWithSpacing;
    marginHorizontal?: DimensionValueWithSpacing;
    marginVertical?: DimensionValueWithSpacing;
    padding?: DimensionValueWithSpacing;
    paddingTop?: DimensionValueWithSpacing;
    paddingBottom?: DimensionValueWithSpacing;
    paddingLeft?: DimensionValueWithSpacing;
    paddingRight?: DimensionValueWithSpacing;
    paddingHorizontal?: DimensionValueWithSpacing;
    paddingVertical?: DimensionValueWithSpacing;
    top?: DimensionValueWithSpacing;
    bottom?: DimensionValueWithSpacing;
    left?: DimensionValueWithSpacing;
    right?: DimensionValueWithSpacing;

    borderRadius?: number | RadiusKey;
    borderTopLeftRadius?: number | RadiusKey;
    borderTopRightRadius?: number | RadiusKey;
    borderBottomLeftRadius?: number | RadiusKey;
    borderBottomRightRadius?: number | RadiusKey;
  } & {
    lightColor?: string;
    darkColor?: string;
    type?: ThemeColor;
    flex?: number | boolean;
    flexGrow?: number | true;
    flexShrink?: number | true;
    row?: boolean;
    rowCenter?: boolean;
    contentCenter?: boolean;
    wrap?: boolean;
    radius?: number | RadiusKey;
    round?: number;
    square?: number;
    absoluteFillObject?: boolean;
    safePaddingTop?: boolean | number | SpacingKey;
    safePaddingBottom?: boolean | number | SpacingKey;
    safeMarginTop?: boolean | number | SpacingKey;
    safeMarginBottom?: boolean | number | SpacingKey;
    safeTop?: boolean | number | SpacingKey;
    safeBottom?: boolean | number | SpacingKey;
    loading?: boolean;
    skeletonBaseColor?: string;
    skeletonShimmerColor?: string;
    skeletonDuration?: number;
    skeletonReduceMotion?: SkeletonReduceMotion;
  };

const HORIZONTAL_VIEW_KEYS = new Set([
  'left',
  'right',
  'width',
  'maxWidth',
  'minWidth',
  'margin',
  'marginLeft',
  'marginRight',
  'marginHorizontal',
  'padding',
  'paddingLeft',
  'paddingRight',
  'paddingHorizontal',
  'columnGap',
  'gap',
]);

const VERTICAL_VIEW_KEYS = new Set([
  'top',
  'bottom',
  'height',
  'maxHeight',
  'minHeight',
  'marginTop',
  'marginBottom',
  'marginVertical',
  'paddingTop',
  'paddingBottom',
  'paddingVertical',
  'rowGap',
]);

const VIEW_STYLE_KEYS = new Set([
  ...HORIZONTAL_VIEW_KEYS,
  ...VERTICAL_VIEW_KEYS,
  'alignContent',
  'alignItems',
  'alignSelf',
  'aspectRatio',
  'backfaceVisibility',
  'backgroundColor',
  'borderBottomColor',
  'borderBottomLeftRadius',
  'borderBottomRightRadius',
  'borderBottomWidth',
  'borderColor',
  'borderCurve',
  'borderEndColor',
  'borderEndWidth',
  'borderLeftColor',
  'borderLeftWidth',
  'borderRadius',
  'borderRightColor',
  'borderRightWidth',
  'borderStartColor',
  'borderStartWidth',
  'borderStyle',
  'borderTopColor',
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderTopWidth',
  'borderWidth',
  'boxShadow',
  'display',
  'elevation',
  'flex',
  'flexBasis',
  'flexDirection',
  'flexGrow',
  'flexShrink',
  'flexWrap',
  'justifyContent',
  'opacity',
  'overflow',
  'position',
  'shadowColor',
  'shadowOffset',
  'shadowOpacity',
  'shadowRadius',
  'transform',
  'zIndex',
]);

const scaleViewValue = (key: string, value: unknown): unknown => {
  if (typeof value === 'string') {
    if (key.includes('Radius') && value in Radius) {
      return Radius[value as RadiusKey];
    }
    if (value in Spacing) {
      return Spacing[value as SpacingKey];
    }
  }

  if (typeof value !== 'number') return value;
  if (VERTICAL_VIEW_KEYS.has(key)) return mvs(value);
  if (HORIZONTAL_VIEW_KEYS.has(key) || key.includes('Radius') || key.includes('Width')) return mhs(value);
  return value;
};

const scaleViewStyle = (style: ViewStyle): ViewStyle => {
  const scaledStyle: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(style)) {
    if (value === undefined) continue;
    scaledStyle[key] = scaleViewValue(key, value);
  }

  return scaledStyle as ViewStyle;
};

const scaleStyleProp = (style: StyleProp<ViewStyle>): StyleProp<ViewStyle> => {
  if (!style) return style;
  const flattened = StyleSheet.flatten(style);
  return flattened ? scaleViewStyle(flattened) : style;
};

const resolveSafeSpacing = (value: boolean | number | string | undefined, fallback: unknown, isVertical: boolean): number | undefined => {
  if (typeof value === 'string' && value in Spacing) {
    return Spacing[value as SpacingKey];
  }
  if (typeof value === 'number') {
    return isVertical ? mvs(value) : mhs(value);
  }
  if (typeof fallback === 'string' && fallback in Spacing) {
    return Spacing[fallback as SpacingKey];
  }
  if (typeof fallback === 'number') {
    return isVertical ? mvs(fallback) : mhs(fallback);
  }
  return undefined;
};
const withSafeInset = (inset: number, value?: number): number => (typeof value === 'number' ? inset + value : inset);
const hasSafeInsetValue = (value: boolean | number | string | undefined): boolean => value !== undefined && value !== false;

const splitViewProps = (props: Record<string, unknown>) => {
  const viewProps: Record<string, unknown> = {};
  const viewStyle: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(props)) {
    if (VIEW_STYLE_KEYS.has(key)) {
      viewStyle[key] = value;
    } else {
      viewProps[key] = value;
    }
  }

  return { viewProps, viewStyle: scaleViewStyle(viewStyle as ViewStyle) };
};

export const ThemedView = forwardRef<View, ThemedViewProps>(function ThemedView(
  {
    children,
    style,
    lightColor,
    darkColor: _darkColor,
    type,
    row,
    wrap,
    rowCenter,
    contentCenter,
    absoluteFillObject,
    safePaddingTop,
    safePaddingBottom,
    safeMarginTop,
    safeMarginBottom,
    safeTop,
    safeBottom,
    radius,
    round,
    square,
    flex,
    flexGrow,
    flexShrink,
    loading = false,
    skeletonBaseColor,
    skeletonShimmerColor = Palette.surfaceBase,
    skeletonDuration = 1000,
    skeletonReduceMotion = 'system',
    ...rest
  },
  ref,
) {
  const safeInsets = useSafeAreaInsets();
  const { viewProps, viewStyle } = splitViewProps(rest as Record<string, unknown>);
  const themedBackgroundColor = lightColor ?? (type ? Colors.light[type] : undefined);
  const loadingBackgroundColor = skeletonBaseColor ?? themedBackgroundColor ?? Palette.surfaceMuted;

  return (
    <View
      ref={ref}
      style={[
        loading ? { backgroundColor: loadingBackgroundColor } : themedBackgroundColor ? { backgroundColor: themedBackgroundColor } : undefined,
        flex !== undefined ? handleFlex(flex) : undefined,
        flexGrow !== undefined ? handleFlexGrow(flexGrow) : undefined,
        flexShrink !== undefined ? handleFlexShrink(flexShrink) : undefined,
        row && styles.row,
        wrap && styles.wrap,
        rowCenter && styles.rowCenter,
        contentCenter && styles.contentCenter,
        absoluteFillObject && StyleSheet.absoluteFill,
        round !== undefined ? handleRound(round) : undefined,
        square !== undefined ? handleSquare(square) : undefined,
        radius !== undefined
          ? { borderRadius: typeof radius === 'string' && radius in Radius ? Radius[radius as RadiusKey] : mhs(radius as number) }
          : undefined,
        hasSafeInsetValue(safePaddingTop)
          ? {
              paddingTop: withSafeInset(safeInsets.top, resolveSafeSpacing(safePaddingTop, rest.paddingTop ?? rest.padding, true)),
            }
          : undefined,
        hasSafeInsetValue(safePaddingBottom)
          ? {
              paddingBottom: withSafeInset(safeInsets.bottom, resolveSafeSpacing(safePaddingBottom, rest.paddingBottom ?? rest.padding, true)),
            }
          : undefined,
        hasSafeInsetValue(safeMarginTop)
          ? {
              marginTop: withSafeInset(safeInsets.top, resolveSafeSpacing(safeMarginTop, rest.marginTop ?? rest.margin, true)),
            }
          : undefined,
        hasSafeInsetValue(safeMarginBottom)
          ? {
              marginBottom: withSafeInset(safeInsets.bottom, resolveSafeSpacing(safeMarginBottom, rest.marginBottom ?? rest.margin, true)),
            }
          : undefined,
        hasSafeInsetValue(safeTop) ? { top: withSafeInset(safeInsets.top, resolveSafeSpacing(safeTop, rest.top, true)) } : undefined,
        hasSafeInsetValue(safeBottom) ? { bottom: withSafeInset(safeInsets.bottom, resolveSafeSpacing(safeBottom, rest.bottom, true)) } : undefined,
        viewStyle,
        loading ? styles.loadingContainer : undefined,
        scaleStyleProp(style),
      ]}
      {...viewProps}>
      {loading ? undefined : children}
      {loading && (
        <SkeletonShimmer
          baseColor={loadingBackgroundColor}
          shimmerColor={skeletonShimmerColor}
          duration={skeletonDuration}
          reduceMotion={skeletonReduceMotion}
        />
      )}
    </View>
  );
});

export const ViewTheme = ThemedView;

const styles = StyleSheet.create({
  contentCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  rowCenter: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  loadingContainer: {
    overflow: 'hidden',
    position: 'relative',
  },
  wrap: {
    flexWrap: 'wrap',
  },
});
