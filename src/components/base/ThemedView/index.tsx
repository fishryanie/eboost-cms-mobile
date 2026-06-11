import { forwardRef } from 'react';
import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, type ThemeColor } from 'themes';
import { handleFlex, handleFlexGrow, handleFlexShrink, handleRound, handleSquare, mhs, mvs } from 'themes/scaling';

export type ThemedViewProps = ViewProps &
  Omit<ViewStyle, 'flex' | 'flexGrow' | 'flexShrink'> & {
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
    radius?: number;
    round?: number;
    square?: number;
    absoluteFillObject?: boolean;
    safePaddingTop?: boolean | number;
    safePaddingBottom?: boolean | number;
    safeMarginTop?: boolean | number;
    safeMarginBottom?: boolean | number;
    safeTop?: boolean | number;
    safeBottom?: boolean | number;
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

const scaleNumericValue = (value: unknown): number | undefined => (typeof value === 'number' ? mvs(value) : undefined);
const withSafeInset = (inset: number, value?: number): number => (typeof value === 'number' ? inset + value : inset);
const hasSafeInsetValue = (value: boolean | number | undefined): boolean => value !== undefined && value !== false;

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
    ...rest
  },
  ref,
) {
  const safeInsets = useSafeAreaInsets();
  const { viewProps, viewStyle } = splitViewProps(rest as Record<string, unknown>);
  const themedBackgroundColor = lightColor ?? (type ? Colors.light[type] : undefined);

  return (
    <View
      ref={ref}
      style={[
        themedBackgroundColor ? { backgroundColor: themedBackgroundColor } : undefined,
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
        radius !== undefined ? { borderRadius: mhs(radius) } : undefined,
        hasSafeInsetValue(safePaddingTop)
          ? {
              paddingTop: withSafeInset(
                safeInsets.top,
                typeof safePaddingTop === 'number' ? mvs(safePaddingTop) : scaleNumericValue(rest.paddingTop ?? rest.padding),
              ),
            }
          : undefined,
        hasSafeInsetValue(safePaddingBottom)
          ? {
              paddingBottom: withSafeInset(
                safeInsets.bottom,
                typeof safePaddingBottom === 'number' ? mvs(safePaddingBottom) : scaleNumericValue(rest.paddingBottom ?? rest.padding),
              ),
            }
          : undefined,
        hasSafeInsetValue(safeMarginTop)
          ? {
              marginTop: withSafeInset(
                safeInsets.top,
                typeof safeMarginTop === 'number' ? mvs(safeMarginTop) : scaleNumericValue(rest.marginTop ?? rest.margin),
              ),
            }
          : undefined,
        hasSafeInsetValue(safeMarginBottom)
          ? {
              marginBottom: withSafeInset(
                safeInsets.bottom,
                typeof safeMarginBottom === 'number' ? mvs(safeMarginBottom) : scaleNumericValue(rest.marginBottom ?? rest.margin),
              ),
            }
          : undefined,
        hasSafeInsetValue(safeTop)
          ? { top: withSafeInset(safeInsets.top, typeof safeTop === 'number' ? mvs(safeTop) : scaleNumericValue(rest.top)) }
          : undefined,
        hasSafeInsetValue(safeBottom)
          ? { bottom: withSafeInset(safeInsets.bottom, typeof safeBottom === 'number' ? mvs(safeBottom) : scaleNumericValue(rest.bottom)) }
          : undefined,
        viewStyle,
        scaleStyleProp(style),
      ]}
      {...viewProps}
    />
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
  wrap: {
    flexWrap: 'wrap',
  },
});
