import { LinearGradient } from 'expo-linear-gradient';
import { ReactElement } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fs, mhs, mvs } from 'themes/scaling';
import { AppButton } from 'components/ui/button';
import { Palette } from 'themes';
import { ThemedView } from './ThemedView';

export type BottomButtonProps = Partial<{
  onPress: () => void;
  disabled: boolean;
  loading: boolean;
  borderTopRadius: number;
  maxWidth: number;
  radius: number;
  title: string;
  btnColor: string;
  colorTitle: string;
  paddingBottom: number;
  backgroundColor: string;
  TopComponent: ReactElement;
  LeftComponent: ReactElement;
  RightComponent: ReactElement;
  fontSize: number;
}>;

export const BottomButton = ({
  onPress,
  disabled,
  TopComponent,
  LeftComponent,
  RightComponent,
  loading = false,
  title = '',
  radius = 16,
  paddingBottom,
  borderTopRadius = 0,
  fontSize = 16,
  colorTitle = Palette.surfaceBase,
  btnColor = 'transparent',
  backgroundColor = Palette.surfaceBase,
}: BottomButtonProps) => {
  const { bottom } = useSafeAreaInsets();

  return (
    <ThemedView
      style={{
        zIndex: 1,
        position: 'absolute',
        alignSelf: 'center',
        bottom: 0,
        width: '100%',
        paddingTop: mvs(10),
        paddingHorizontal: mhs(12),
        borderTopLeftRadius: mhs(borderTopRadius),
        borderTopRightRadius: mhs(borderTopRadius),
        paddingBottom: paddingBottom ? mvs(paddingBottom) : bottom === 0 ? mvs(10) : bottom,
        backgroundColor: backgroundColor,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
      }}>
      {TopComponent && TopComponent}
      <ThemedView style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent' }}>
        {LeftComponent && LeftComponent}
        <LinearGradient
          end={{ x: 1, y: 0 }}
          start={{ x: 0, y: 0 }}
          style={{ flex: 1, borderRadius: mhs(radius) }}
          colors={[Palette.accent, Palette.accentPressed]}>
          <AppButton
            block
            buttonColor={disabled ? Palette.border : btnColor}
            disabled={disabled}
            label={title}
            loading={loading}
            onPress={onPress ?? (() => {})}
            style={{ borderRadius: mhs(radius), height: mvs(45) }}
            textColor={disabled ? Palette.textTertiary : colorTitle}
            textStyle={{ fontSize: fs(fontSize), fontWeight: '600' }}
          />
        </LinearGradient>
        {RightComponent && RightComponent}
      </ThemedView>
    </ThemedView>
  );
};
