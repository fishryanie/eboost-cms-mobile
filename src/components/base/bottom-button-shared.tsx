import { LinearGradient } from 'expo-linear-gradient';
import { type PropsWithChildren, type ReactElement } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from 'components/ui/button';
import { Palette } from 'themes';
import { fs, mhs, mvs } from 'themes/scaling';

import { ThemedView } from './ThemedView';

export type BottomButtonProps = Partial<{
  backgroundColor: string;
  borderTopRadius: number;
  btnColor: string;
  colorTitle: string;
  disabled: boolean;
  fontSize: number;
  icon: ReactElement;
  LeftComponent: ReactElement;
  loading: boolean;
  maxWidth: number;
  onPress: () => void;
  onSecondaryPress: () => void;
  paddingBottom: number;
  radius: number;
  RightComponent: ReactElement;
  secondaryDisabled: boolean;
  secondaryIcon: ReactElement;
  secondaryLoading: boolean;
  secondaryTitle: string;
  title: string;
  TopComponent: ReactElement;
}>;

export function BottomButtonContainer({
  absolute = false,
  backgroundColor = Palette.surfaceBase,
  borderTopRadius = 0,
  children,
  paddingBottom,
}: PropsWithChildren<Pick<BottomButtonProps, 'backgroundColor' | 'borderTopRadius' | 'paddingBottom'> & { absolute?: boolean }>) {
  const { bottom } = useSafeAreaInsets();
  const resolvedPaddingBottom = paddingBottom === undefined ? (bottom === 0 ? mvs(10) : bottom) : mvs(paddingBottom);

  return (
    <ThemedView
      alignSelf='center'
      backgroundColor={backgroundColor}
      borderTopLeftRadius={mhs(borderTopRadius)}
      borderTopRightRadius={mhs(borderTopRadius)}
      bottom={absolute ? 0 : undefined}
      boxShadow='0 -2px 4px rgba(0, 0, 0, 0.1)'
      paddingBottom={resolvedPaddingBottom}
      paddingHorizontal={mhs(12)}
      paddingTop={mvs(10)}
      position={absolute ? 'absolute' : 'relative'}
      width='100%'
      zIndex={1}>
      {children}
    </ThemedView>
  );
}

export function BottomButtonContent({
  btnColor = 'transparent',
  colorTitle = Palette.surfaceBase,
  disabled,
  fontSize = 16,
  icon,
  LeftComponent,
  loading = false,
  onPress,
  onSecondaryPress,
  radius = 16,
  RightComponent,
  secondaryDisabled,
  secondaryIcon,
  secondaryLoading = false,
  secondaryTitle,
  title = '',
  TopComponent,
}: BottomButtonProps) {
  const gradientColors: [string, string] = disabled
    ? [Palette.border, Palette.border]
    : btnColor === 'transparent'
      ? [Palette.accent, Palette.accentPressed]
      : [btnColor, btnColor];

  return (
    <>
      {TopComponent}
      <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row'>
        {LeftComponent}
        {secondaryTitle && onSecondaryPress ? (
          <ThemedView backgroundColor='transparent' flex={1} marginRight={mhs(10)}>
            <AppButton
              block
              disabled={secondaryDisabled}
              icon={secondaryIcon}
              label={secondaryTitle}
              loading={secondaryLoading}
              onPress={onSecondaryPress}
              style={{ borderRadius: mhs(radius), height: mvs(45) }}
              variant='ghost'
            />
          </ThemedView>
        ) : null}
        <LinearGradient colors={gradientColors} end={{ x: 1, y: 0 }} start={{ x: 0, y: 0 }} style={{ flex: 1, borderRadius: mhs(radius) }}>
          <AppButton
            block
            buttonColor={disabled ? Palette.border : btnColor}
            disabled={disabled}
            icon={icon}
            label={title}
            loading={loading}
            onPress={onPress ?? (() => {})}
            style={{ borderRadius: mhs(radius), height: mvs(45) }}
            textColor={disabled ? Palette.textTertiary : colorTitle}
            textStyle={{ fontSize: fs(fontSize), fontWeight: '600' }}
          />
        </LinearGradient>
        {RightComponent}
      </ThemedView>
    </>
  );
}
