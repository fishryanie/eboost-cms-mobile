import { forwardRef } from 'react';
import { Platform, StyleSheet, Text, type ColorValue, type StyleProp, type TextProps, type TextStyle } from 'react-native';

import { Colors, FontFamily, Fonts, Palette, type ThemeColor } from 'themes';
import { fs, mhs, mvs } from 'themes/scaling';

type LayoutValue = TextStyle['width'];
type SpacingValue = TextStyle['padding'];

export type ThemedTextType = 'default' | 'title' | 'small' | 'smallBold' | 'defaultSemiBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  themeColor?: ThemeColor;
  type?: ThemedTextType;
} & Partial<{
    flex: number | boolean;
    flexGrow: number;
    flexShrink: number;
    alignSelf: TextStyle['alignSelf'];
    zIndex: number;
    padding: SpacingValue;
    paddingHorizontal: SpacingValue;
    paddingVertical: SpacingValue;
    paddingLeft: SpacingValue;
    paddingTop: SpacingValue;
    paddingRight: SpacingValue;
    paddingBottom: SpacingValue;
    margin: SpacingValue;
    marginHorizontal: SpacingValue;
    marginVertical: SpacingValue;
    marginLeft: SpacingValue;
    marginTop: SpacingValue;
    marginRight: SpacingValue;
    marginBottom: SpacingValue;
    position: TextStyle['position'];
    top: LayoutValue;
    right: LayoutValue;
    bottom: LayoutValue;
    left: LayoutValue;
    width: LayoutValue;
    height: LayoutValue;
    maxWidth: LayoutValue;
    maxHeight: LayoutValue;
    minWidth: LayoutValue;
    minHeight: LayoutValue;
    opacity: number;
    transform: TextStyle['transform'];
    color: ColorValue;
    fontFamily: TextStyle['fontFamily'];
    fontSize: number;
    fontStyle: TextStyle['fontStyle'];
    fontWeight: TextStyle['fontWeight'];
    letterSpacing: number;
    lineHeight: number;
    textAlign: TextStyle['textAlign'];
    textTransform: TextStyle['textTransform'];
    textDecorationLine: TextStyle['textDecorationLine'];
    includeFontPadding: TextStyle['includeFontPadding'];
  }>;

const HORIZONTAL_TEXT_KEYS = new Set([
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
  'letterSpacing',
]);

const VERTICAL_TEXT_KEYS = new Set([
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
]);

const FONT_TEXT_KEYS = new Set(['fontSize', 'lineHeight']);
const TYPOGRAPHY_TEXT_KEYS = new Set(['fontFamily', 'fontSize', 'fontStyle', 'fontVariant', 'fontWeight', 'lineHeight']);

const TEXT_STYLE_KEYS = new Set([
  ...HORIZONTAL_TEXT_KEYS,
  ...VERTICAL_TEXT_KEYS,
  ...FONT_TEXT_KEYS,
  'alignSelf',
  'backgroundColor',
  'borderColor',
  'borderRadius',
  'borderWidth',
  'color',
  'display',
  'flex',
  'flexGrow',
  'flexShrink',
  'fontFamily',
  'fontStyle',
  'fontVariant',
  'fontWeight',
  'includeFontPadding',
  'opacity',
  'overflow',
  'position',
  'textAlign',
  'textDecorationLine',
  'textShadowColor',
  'textShadowOffset',
  'textShadowRadius',
  'textTransform',
  'transform',
  'zIndex',
]);

const flexStyle = (flex: number | boolean): TextStyle => ({
  flex: typeof flex === 'number' ? flex : flex ? 1 : 0,
});

const scaleTextValue = (key: string, value: unknown): unknown => {
  if (typeof value !== 'number') return value;
  if (FONT_TEXT_KEYS.has(key)) return fs(value);
  if (VERTICAL_TEXT_KEYS.has(key)) return mvs(value);
  if (HORIZONTAL_TEXT_KEYS.has(key) || key.includes('Radius') || key.includes('Width')) return mhs(value);
  return value;
};

const scaleTextStyle = (style: TextStyle): TextStyle => {
  const scaledStyle: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(style)) {
    if (value === undefined) continue;
    scaledStyle[key] = scaleTextValue(key, value);
  }

  return scaledStyle as TextStyle;
};

const scaleStyleProp = (style: StyleProp<TextStyle>): StyleProp<TextStyle> => {
  if (!style) return style;
  const flattened = StyleSheet.flatten(style);
  return flattened ? scaleTextStyle(flattened) : style;
};

const textTypeStyle = (type: ThemedTextType): TextStyle => {
  switch (type) {
    case 'small':
      return {
        fontFamily: FontFamily.medium,
        fontSize: fs(14),
        lineHeight: fs(20),
      };
    case 'smallBold':
      return {
        fontFamily: FontFamily.bold,
        fontSize: fs(14),
        lineHeight: fs(20),
      };
    case 'defaultSemiBold':
      return {
        fontFamily: FontFamily.semibold,
        fontSize: fs(16),
        lineHeight: fs(24),
      };
    case 'title':
      return {
        fontFamily: FontFamily.bold,
        fontSize: fs(40),
        lineHeight: fs(46),
      };
    case 'subtitle':
      return {
        fontFamily: FontFamily.semibold,
        fontSize: fs(27),
        lineHeight: fs(34),
      };
    case 'link':
      return {
        fontFamily: FontFamily.medium,
        fontSize: fs(14),
        lineHeight: fs(30),
      };
    case 'linkPrimary':
      return {
        color: Palette.accent,
        fontFamily: FontFamily.semibold,
        fontSize: fs(14),
        lineHeight: fs(30),
      };
    case 'code':
      return {
        fontFamily: Fonts.mono,
        fontSize: fs(12),
        fontWeight: Platform.select({ android: 700 }) ?? 500,
      };
    case 'default':
    default:
      return {
        fontFamily: FontFamily.medium,
        fontSize: fs(16),
        lineHeight: fs(24),
      };
  }
};

const splitTextProps = (props: Record<string, unknown>) => {
  const textProps: Record<string, unknown> = {};
  const textStyle: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(props)) {
    if (TEXT_STYLE_KEYS.has(key)) {
      textStyle[key] = value;
    } else {
      textProps[key] = value;
    }
  }

  return { textProps, textStyle: scaleTextStyle(textStyle as TextStyle) };
};

function hasTypographyOverride(style: TextStyle) {
  return Object.keys(style).some(key => TYPOGRAPHY_TEXT_KEYS.has(key));
}

export const ThemedText = forwardRef<Text, ThemedTextProps>(function ThemedText(
  { style, lightColor, darkColor: _darkColor, themeColor, type = 'default', flex, color, includeFontPadding = false, ...rest },
  ref,
) {
  const { textProps, textStyle } = splitTextProps(rest as Record<string, unknown>);
  const shouldApplyTypeStyle = type !== 'default' || !hasTypographyOverride(textStyle);
  const themedColor = lightColor ?? Colors.light[themeColor ?? 'text'];
  const resolvedColor = color ?? themedColor;

  return (
    <Text
      ref={ref}
      style={[
        { color: resolvedColor, includeFontPadding },
        shouldApplyTypeStyle ? textTypeStyle(type) : undefined,
        type === 'linkPrimary' && color === undefined ? styles.linkPrimary : undefined,
        flex !== undefined ? flexStyle(flex) : undefined,
        textStyle,
        scaleStyleProp(style),
      ]}
      {...textProps}
    />
  );
});

export const TextTheme = ThemedText;

const styles = StyleSheet.create({
  linkPrimary: {
    color: Palette.accent,
  },
});
