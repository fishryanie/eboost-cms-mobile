import { Canvas, LinearGradient, RadialGradient, Rect, vec } from '@shopify/react-native-skia';
import { useMutation } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  useWindowDimensions,
  type KeyboardEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type View as NativeView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText, ThemedView } from 'components/base';

import { loginAdmin } from 'features/auth/auth-service';
import { biometricCredentialStore } from 'features/auth/biometric-credentials';
import { calculateKeyboardAwareScrollY } from 'features/auth/keyboard-avoidance';
import { parseLoginForm, type LoginFieldErrors } from 'features/auth/login-validation';
import { useBiometricLogin } from 'hooks/use-biometric-login';
import { AppButton } from 'shared/ui';
import FloatingTextInput from 'shared/ui/FloatingTextInput';
import { FontFamily, Palette, Radius, Spacing } from 'themes';
import { mhs, mvs } from 'themes/scaling';

const KEYBOARD_CARD_GAP = mvs(20);
const actionControlHeight = 45;
const biometricSymbolSize = mhs(24);
const cardLogoWidth = 128;
const formGap = Spacing.four;
const radiusLarge = Radius.large;
const radiusMedium = Radius.medium;
const radiusPill = Radius.pill;
const appVersionLabel = 'v1.0.0';

export default function LoginScreen() {
  const formCardRef = useRef<NativeView>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollYRef = useRef(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const { biometricIcon, biometricLabel, canUseBiometric, completeAuthenticatedSession, handleBiometricLogin, isBiometricLoading, queueBiometricOptIn } =
    useBiometricLogin({ setErrorMessage });
  const loginMutation = useMutation({
    mutationFn: loginAdmin,
    onSuccess: async (response, credentials) => {
      if (!response.token) {
        setErrorMessage(response.message || 'The CMS did not return an admin token.');
        return;
      }

      await Promise.all([biometricCredentialStore.setLastUsername(credentials.username), queueBiometricOptIn(credentials)]);
      await completeAuthenticatedSession(response.token);
    },
    onError: error => {
      setErrorMessage(error instanceof Error ? error.message : 'Please check your credentials and try again.');
    },
  });

  const updateUsername = (value: string) => {
    setUsername(value);
    setFieldErrors(current => ({ ...current, username: undefined }));
  };

  const updatePassword = (value: string) => {
    setPassword(value);
    setFieldErrors(current => ({ ...current, password: undefined }));
  };

  const handleLogin = () => {
    setErrorMessage('');
    const parsedForm = parseLoginForm({ password, username });

    if (!parsedForm.success) {
      setFieldErrors(parsedForm.fieldErrors);
      return;
    }

    setFieldErrors({});
    loginMutation.mutate(parsedForm.data);
  };

  const isLoading = loginMutation.isPending;
  const canSubmit = !isLoading && !isBiometricLoading;
  const canSubmitBiometric = canUseBiometric && !isLoading && !isBiometricLoading;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollYRef.current = event.nativeEvent.contentOffset.y;
  };

  const keepCardAboveKeyboard = useCallback((event: KeyboardEvent) => {
    const keyboardTopY = event.endCoordinates.screenY;

    requestAnimationFrame(() => {
      formCardRef.current?.measureInWindow((_x, cardY, _width, cardHeight) => {
        const nextScrollY = calculateKeyboardAwareScrollY({
          cardBottomY: cardY + cardHeight,
          currentScrollY: scrollYRef.current,
          gap: KEYBOARD_CARD_GAP,
          keyboardTopY,
        });

        if (nextScrollY !== scrollYRef.current) {
          scrollViewRef.current?.scrollTo({ animated: true, y: nextScrollY });
        }
      });
    });
  }, []);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', keepCardAboveKeyboard);
    const frameSubscription = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillChangeFrame' : 'keyboardDidShow', keepCardAboveKeyboard);

    return () => {
      showSubscription.remove();
      frameSubscription.remove();
    };
  }, [keepCardAboveKeyboard]);

  return (
    <BackgroundGradient colors={['#FFFFFF', '#FFFFFF', '#F7FBF9', '#EFF8F4', '#E8F4EF', '#FFFFFF', '#FFFFFF']}>
      <SafeAreaView style={styles.container}>
        <TouchableWithoutFeedback accessible={false} onPress={Keyboard.dismiss}>
          <ScrollView
            ref={scrollViewRef}
            automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
            contentContainerStyle={styles.scrollContainer}
            contentInsetAdjustmentBehavior='automatic'
            keyboardDismissMode='interactive'
            keyboardShouldPersistTaps='handled'
            onScroll={handleScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}>
            <ThemedView alignItems='center' marginBottom={Spacing.six}>
              <ThemedView backgroundColor='#E8F4EF' borderRadius={radiusPill} marginBottom={Spacing.four} paddingHorizontal={Spacing.four} paddingVertical={7}>
                <ThemedText color={Palette.accent} fontFamily={FontFamily.bold} fontSize={11} letterSpacing={0}>
                  CMS Admin Portal
                </ThemedText>
              </ThemedView>
              <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={36} lineHeight={42} marginBottom={Spacing.two} textAlign='center'>
                Welcome back! 👋
              </ThemedText>
              <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={15} lineHeight={22} maxWidth={300} textAlign='center'>
                Sign in to manage and publish digital content efficiently
              </ThemedText>
            </ThemedView>

            <ThemedView
              ref={formCardRef}
              backgroundColor={Palette.surfaceRaised}
              borderColor='rgba(1,167,78,0.12)'
              borderRadius={radiusLarge}
              borderWidth={1}
              boxShadow='0 18px 44px rgba(1, 167, 78, 0.16)'
              gap={formGap}
              paddingHorizontal={15}
              paddingVertical={24}>
              <ThemedView alignItems='center' flexDirection='row' justifyContent='flex-start' marginBottom={12}>
                <ThemedView alignItems='center' flexShrink={0} height={36} justifyContent='center' marginLeft={-12} marginRight={-8} width={cardLogoWidth}>
                  <Image
                    contentFit='contain'
                    accessibilityLabel='EBOOST logo'
                    source={require('assets/images/logo-text-black.png')}
                    style={styles.cardLogoImage}
                  />
                </ThemedView>
                <ThemedView borderLeftColor={Palette.borderSubtle} borderLeftWidth={1} flex={1} gap={Spacing.half} paddingLeft={Spacing.two}>
                  <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={15} lineHeight={20}>
                    Admin access
                  </ThemedText>
                  <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={12} lineHeight={16}>
                    Use your CMS account to continue
                  </ThemedText>
                </ThemedView>
              </ThemedView>

              <FloatingTextInput
                autoCapitalize='none'
                autoComplete='email'
                editable={!isLoading}
                error={fieldErrors.username}
                keyboardType='email-address'
                label='Email'
                onChangeText={updateUsername}
                onSubmitEditing={handleLogin}
                placeholder='abc@gmail.com'
                returnKeyType='next'
                textContentType='emailAddress'
                value={username}
              />

              <FloatingTextInput
                autoCapitalize='none'
                autoComplete='password'
                editable={!isLoading}
                error={fieldErrors.password}
                label='Password'
                onChangeText={updatePassword}
                onSubmitEditing={handleLogin}
                placeholder='Enter your password'
                returnKeyType='done'
                secureTextEntry
                textContentType='password'
                value={password}
              />

              {errorMessage ? (
                <ThemedView backgroundColor={Palette.dangerSurface} borderColor='#FDA29B' borderRadius={radiusMedium} borderWidth={1} padding={Spacing.three}>
                  <ThemedText color='#B42318' fontFamily={FontFamily.semibold} fontSize={14} lineHeight={20}>
                    {errorMessage}
                  </ThemedText>
                </ThemedView>
              ) : null}

              <ThemedView alignItems='stretch' flexDirection='row' gap={Spacing.two}>
                <AppButton
                  buttonColor={Palette.accent}
                  disabled={!canSubmit}
                  label='Sign in'
                  loading={isLoading}
                  loadingLabel='Signing in...'
                  onPress={handleLogin}
                  style={styles.primaryActionButton}
                  textColor='#FFFFFF'
                  textStyle={styles.primaryActionLabel}
                />

                <AppButton
                  accessibilityLabel={`Sign in with ${biometricLabel}`}
                  buttonColor={canSubmitBiometric ? '#F3FAF6' : Palette.surfaceMuted}
                  disabled={!canSubmitBiometric}
                  icon={
                    <SymbolView
                      name={biometricIcon as never}
                      resizeMode='scaleAspectFit'
                      size={biometricSymbolSize}
                      tintColor={canSubmitBiometric ? Palette.accent : Palette.textTertiary}
                    />
                  }
                  onPress={handleBiometricLogin}
                  scale={0.92}
                  style={[styles.iconActionButton, !canSubmitBiometric && styles.iconActionButtonDisabled]}
                  textColor={Palette.accent}
                />
              </ThemedView>
            </ThemedView>

            <ThemedView alignItems='center' gap={Spacing.half} marginTop={Spacing.six}>
              <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.regular} fontSize={11} lineHeight={18} textAlign='center'>
                EBOOST · Digital Development Team
              </ThemedText>
              <ThemedText color='rgba(102, 112, 133, 0.74)' fontFamily={FontFamily.regular} fontSize={10} lineHeight={14} textAlign='center'>
                {appVersionLabel} · Secure CMS access
              </ThemedText>
            </ThemedView>
          </ScrollView>
        </TouchableWithoutFeedback>
      </SafeAreaView>
    </BackgroundGradient>
  );
}

function BackgroundGradient({ children, colors }: { children: ReactNode; colors: string[] }) {
  const { width, height } = useWindowDimensions();

  return (
    <>
      <Canvas style={styles.gradientCanvas}>
        <Rect x={0} y={0} width={width} height={height}>
          <RadialGradient c={vec(width / 2, -height * 0.19)} r={height * 0.55} colors={colors} positions={[0.1, 0.2, 0.5, 0.6, 0.7, 0.959, 1]} />
        </Rect>
        <Rect x={0} y={height * 0.72} width={width} height={height * 0.28}>
          <LinearGradient start={vec(width / 2, height * 0.72)} end={vec(width / 2, height)} colors={['rgba(255,255,255,0)', 'rgba(1,167,78,0.08)']} />
        </Rect>
      </Canvas>
      <ThemedView bottom={0} left={0} position='absolute' right={0} top={0}>
        {children}
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  iconActionButton: {
    alignItems: 'center',
    borderColor: 'rgba(1,167,78,0.22)',
    borderRadius: radiusPill,
    borderWidth: 1,
    height: actionControlHeight,
    paddingHorizontal: 0,
    paddingVertical: 0,
    width: actionControlHeight,
  },
  iconActionButtonDisabled: {
    borderColor: Palette.borderSubtle,
  },
  cardLogoImage: {
    height: mvs(34),
    width: mhs(cardLogoWidth),
    objectFit: 'fill',
  },
  container: {
    flex: 1,
  },
  gradientCanvas: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: mvs(84),
    paddingHorizontal: mhs(Spacing.five),
    paddingTop: mvs(94),
  },
  primaryActionButton: {
    borderRadius: radiusPill,
    boxShadow: '0 8px 18px rgba(1, 167, 78, 0.18)',
    flex: 1,
    height: actionControlHeight,
  },
  primaryActionLabel: {
    fontSize: 16,
    lineHeight: 22,
  },
});
