import { Canvas, LinearGradient, RadialGradient, Rect, vec } from '@shopify/react-native-skia';
import { useMutation } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
  type KeyboardEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { loginAdmin } from 'features/auth/auth-service';
import { biometricCredentialStore } from 'features/auth/biometric-credentials';
import { calculateKeyboardAwareScrollY } from 'features/auth/keyboard-avoidance';
import { parseLoginForm, type LoginFieldErrors } from 'features/auth/login-validation';
import { useBiometricLogin } from 'hooks/use-biometric-login';
import FloatingTextInput from 'shared/ui/FloatingTextInput';
import { FontFamily, Palette, Radius, Spacing } from 'themes';
import { fs, mhs, mvs } from 'themes/scaling';

const KEYBOARD_CARD_GAP = mvs(20);
const actionControlHeight = 45;
const biometricSymbolSize = mhs(24);
const cardLogoWidth = mhs(128);
const formGap = mvs(Spacing.four);
const radiusLarge = mhs(Radius.large);
const radiusMedium = mhs(Radius.medium);
const radiusPill = Radius.pill;
const appVersionLabel = 'v1.0.0';

export default function LoginScreen() {
  const formCardRef = useRef<View>(null);
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
            <View style={styles.headingContainer}>
              <View style={styles.headingTag}>
                <Text style={styles.headingTagText}>CMS Admin Portal</Text>
              </View>
              <Text style={styles.headingCoreText}>Welcome back! 👋</Text>
              <Text style={styles.headingSubtitle}>Sign in to manage and publish digital content efficiently</Text>
            </View>

            <View ref={formCardRef} style={styles.formCard}>
              <View style={styles.formHeader}>
                <View style={styles.cardLogoWrap}>
                  <Image
                    contentFit='contain'
                    accessibilityLabel='EBOOST logo'
                    source={require('assets/images/logo-text-black.png')}
                    style={styles.cardLogoImage}
                  />
                </View>
                <View style={styles.formHeaderText}>
                  <Text style={styles.formTitle}>Admin access</Text>
                  <Text style={styles.formSubtitle}>Use your CMS account to continue</Text>
                </View>
              </View>

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
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              <View style={styles.actionRow}>
                <Pressable
                  accessibilityRole='button'
                  disabled={!canSubmit}
                  onPress={handleLogin}
                  style={({ pressed }) => [styles.signInButton, pressed && styles.pressed, !canSubmit && styles.disabled]}>
                  <Text style={styles.signInButtonText}>{isLoading ? 'Signing in...' : 'Sign in'}</Text>
                </Pressable>

                <Pressable
                  accessibilityLabel={`Sign in with ${biometricLabel}`}
                  accessibilityRole='button'
                  disabled={!canSubmitBiometric}
                  onPress={handleBiometricLogin}
                  style={({ pressed }) => [styles.biometricButton, pressed && styles.pressed, !canSubmitBiometric && styles.biometricButtonDisabled]}>
                  <SymbolView
                    name={biometricIcon as never}
                    resizeMode='scaleAspectFit'
                    size={biometricSymbolSize}
                    tintColor={canSubmitBiometric ? Palette.accent : Palette.textTertiary}
                  />
                </Pressable>
              </View>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>EBOOST · Digital Development Team</Text>
              <Text style={styles.footerMeta}>{appVersionLabel} · Secure CMS access</Text>
            </View>
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
      <View style={styles.gradientContent}>{children}</View>
    </>
  );
}

const formBaseStyle = {
  backgroundColor: Palette.surfaceRaised,
  borderColor: 'rgba(1,167,78,0.12)',
  borderRadius: radiusLarge,
  borderWidth: 1,
  boxShadow: '0 18px 44px rgba(1, 167, 78, 0.16)',
  gap: formGap,
  paddingHorizontal: mhs(15),
  paddingVertical: mvs(24),
} as const;

const styles = StyleSheet.create({
  actionRow: {
    alignItems: 'stretch',
    flexDirection: 'row',
    gap: mhs(Spacing.two),
  },
  biometricButton: {
    alignItems: 'center',
    backgroundColor: '#F3FAF6',
    borderColor: 'rgba(1,167,78,0.22)',
    borderRadius: radiusPill,
    borderWidth: 1,
    justifyContent: 'center',
    height: actionControlHeight,
    width: actionControlHeight,
  },
  biometricButtonDisabled: {
    backgroundColor: Palette.surfaceMuted,
    borderColor: Palette.borderSubtle,
  },
  cardLogoImage: {
    height: mvs(34),
    width: cardLogoWidth,
    objectFit: 'fill',
  },
  cardLogoWrap: {
    alignItems: 'center',
    flexShrink: 0,
    height: mvs(36),
    justifyContent: 'center',
    marginLeft: -mhs(12),
    marginRight: -mhs(8),
    width: cardLogoWidth,
  },
  container: {
    flex: 1,
  },
  disabled: {
    opacity: 1,
  },
  errorBox: {
    backgroundColor: Palette.dangerSurface,
    borderColor: '#FDA29B',
    borderRadius: radiusMedium,
    borderWidth: 1,
    padding: mhs(Spacing.three),
  },
  errorText: {
    color: '#B42318',
    fontFamily: FontFamily.semibold,
    fontSize: fs(14),
    lineHeight: fs(20),
  },
  footer: {
    alignItems: 'center',
    gap: mvs(Spacing.half),
    marginTop: mvs(Spacing.six),
  },
  footerMeta: {
    color: 'rgba(102, 112, 133, 0.74)',
    fontFamily: FontFamily.regular,
    fontSize: fs(10),
    lineHeight: fs(14),
    textAlign: 'center',
  },
  footerText: {
    color: Palette.textTertiary,
    fontFamily: FontFamily.regular,
    fontSize: fs(11),
    lineHeight: fs(18),
    textAlign: 'center',
  },
  formCard: formBaseStyle,
  formHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: mvs(12),
  },
  formHeaderText: {
    borderLeftColor: Palette.borderSubtle,
    borderLeftWidth: 1,
    flex: 1,
    gap: mvs(Spacing.half),
    paddingLeft: mhs(Spacing.two),
  },
  formSubtitle: {
    color: Palette.textSecondary,
    fontFamily: FontFamily.regular,
    fontSize: fs(12),
    lineHeight: fs(16),
  },
  formTitle: {
    color: Palette.textPrimary,
    fontFamily: FontFamily.bold,
    fontSize: fs(15),
    lineHeight: fs(20),
  },
  gradientCanvas: {
    flex: 1,
  },
  gradientContent: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  headingContainer: {
    alignItems: 'center',
    marginBottom: mvs(Spacing.six),
  },
  headingCoreText: {
    color: Palette.textPrimary,
    fontFamily: FontFamily.bold,
    fontSize: fs(36),
    lineHeight: fs(42),
    marginBottom: mvs(Spacing.two),
    textAlign: 'center',
  },
  headingSubtitle: {
    color: Palette.textSecondary,
    fontFamily: FontFamily.regular,
    fontSize: fs(15),
    lineHeight: fs(22),
    maxWidth: mhs(300),
    textAlign: 'center',
  },
  headingTag: {
    backgroundColor: '#E8F4EF',
    borderRadius: radiusPill,
    marginBottom: mvs(Spacing.four),
    paddingHorizontal: mhs(Spacing.four),
    paddingVertical: mvs(7),
  },
  headingTagText: {
    color: Palette.accent,
    fontFamily: FontFamily.bold,
    fontSize: fs(11),
    letterSpacing: 0,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
  scrollContainer: {
    paddingBottom: mvs(84),
    paddingHorizontal: mhs(Spacing.five),
    paddingTop: mvs(94),
  },
  signInButton: {
    alignItems: 'center',
    backgroundColor: Palette.accent,
    borderRadius: radiusPill,
    boxShadow: '0 8px 18px rgba(1, 167, 78, 0.18)',
    flex: 1,
    justifyContent: 'center',
    height: actionControlHeight,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
    fontSize: fs(16),
    lineHeight: fs(22),
  },
});
