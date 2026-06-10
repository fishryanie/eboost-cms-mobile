import { Canvas, RadialGradient, Rect, vec } from '@shopify/react-native-skia';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
  type KeyboardEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FontFamily, Palette, Radius, Spacing } from 'constants/theme';
import { loginAdmin } from 'features/auth/auth-service';
import { biometricCredentialStore, type BiometricCredentials } from 'features/auth/biometric-credentials';
import { getBiometricButtonLabel, getBiometricSymbolName } from 'features/auth/biometric-auth';
import { calculateKeyboardAwareScrollY } from 'features/auth/keyboard-avoidance';
import { parseLoginForm, type LoginFieldErrors } from 'features/auth/login-validation';
import { sessionStore } from 'shared/session/session-store';
import { sessionKeys } from 'shared/session/use-session-token';
import FloatingTextInput from 'shared/ui/FloatingTextInput';

const KEYBOARD_CARD_GAP = 20;

export default function LoginScreen() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const formCardRef = useRef<View>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollYRef = useRef(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [biometricIcon, setBiometricIcon] = useState('lock.shield');
  const [biometricLabel, setBiometricLabel] = useState('Biometric');
  const [canUseBiometric, setCanUseBiometric] = useState(false);
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);
  const [isBiometricPromptSaving, setIsBiometricPromptSaving] = useState(false);
  const [password, setPassword] = useState('');
  const [pendingBiometricCredentials, setPendingBiometricCredentials] = useState<BiometricCredentials | null>(null);
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);
  const [supportsBiometric, setSupportsBiometric] = useState(false);
  const [username, setUsername] = useState('');
  const loginMutation = useMutation({
    mutationFn: loginAdmin,
    onSuccess: async (response, credentials) => {
      if (!response.token) {
        setErrorMessage(response.message || 'The CMS did not return an admin token.');
        return;
      }
      await biometricCredentialStore.setLastUsername(credentials.username);
      await sessionStore.setToken(response.token);
      await queryClient.invalidateQueries({ queryKey: sessionKeys.token });
      await queryClient.invalidateQueries({ queryKey: ['locations'] });

      const hasSavedBiometricCredentials = await biometricCredentialStore.hasCredentials();
      if (supportsBiometric && !hasSavedBiometricCredentials) {
        setPendingBiometricCredentials(credentials);
        setShowBiometricPrompt(true);
        return;
      }

      router.replace('/home');
    },
    onError: error => {
      setErrorMessage(error instanceof Error ? error.message : 'Please check your credentials and try again.');
    },
  });

  useEffect(() => {
    let isMounted = true;

    async function loadBiometricState() {
      const [hasHardware, isEnrolled, authenticationTypes, hasSavedBiometricCredentials] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
        LocalAuthentication.supportedAuthenticationTypesAsync(),
        biometricCredentialStore.hasCredentials(),
      ]);

      if (!isMounted) {
        return;
      }

      setBiometricLabel(getBiometricButtonLabel(authenticationTypes, Platform.OS));
      setBiometricIcon(getBiometricSymbolName(authenticationTypes));
      setSupportsBiometric(hasHardware && isEnrolled);
      setCanUseBiometric(hasHardware && isEnrolled && hasSavedBiometricCredentials);
    }

    loadBiometricState().catch(() => {
      if (isMounted) {
        setCanUseBiometric(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

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
  const handleBiometricLogin = async () => {
    setErrorMessage('');
    setIsBiometricLoading(true);

    try {
      const savedCredentials = await biometricCredentialStore.getCredentials();

      if (!savedCredentials) {
        setCanUseBiometric(false);
        setErrorMessage('Please sign in with your CMS account once before using biometric login.');
        return;
      }

      const response = await loginAdmin(savedCredentials);
      if (!response.token) {
        setErrorMessage(response.message || 'The CMS did not return an admin token.');
        return;
      }

      await sessionStore.setToken(response.token);
      await queryClient.invalidateQueries({ queryKey: sessionKeys.token });
      await queryClient.invalidateQueries({ queryKey: ['locations'] });
      router.replace('/home');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Biometric sign in was cancelled or failed. Please try again.');
    } finally {
      setIsBiometricLoading(false);
    }
  };

  const continueToHome = () => {
    setPendingBiometricCredentials(null);
    setShowBiometricPrompt(false);
    router.replace('/home');
  };

  const handleEnableBiometricPrompt = async () => {
    if (!pendingBiometricCredentials) {
      continueToHome();
      return;
    }

    setIsBiometricPromptSaving(true);

    try {
      await biometricCredentialStore.saveCredentials(pendingBiometricCredentials);
      setCanUseBiometric(true);
      continueToHome();
    } catch {
      setIsBiometricPromptSaving(false);
      continueToHome();
    }
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
        <Modal animationType='fade' onRequestClose={continueToHome} transparent visible={showBiometricPrompt}>
          <View style={styles.modalOverlay}>
            <View style={styles.biometricPromptCard}>
              <View style={styles.biometricPromptIcon}>
                <SymbolView name={biometricIcon as never} resizeMode='scaleAspectFit' size={28} tintColor={Palette.accent} />
              </View>
              <Text style={styles.biometricPromptTitle}>Enable {biometricLabel} sign in?</Text>
              <Text style={styles.biometricPromptText}>Use your saved CMS account to sign in faster next time after biometric verification.</Text>
              <View style={styles.biometricPromptSwitchRow}>
                <View style={styles.biometricPromptSwitchCopy}>
                  <Text style={styles.biometricPromptSwitchTitle}>Fast sign in</Text>
                  <Text style={styles.biometricPromptSwitchText}>You can turn this off later in Settings.</Text>
                </View>
                <Switch
                  disabled={isBiometricPromptSaving}
                  onValueChange={value => {
                    if (value) {
                      void handleEnableBiometricPrompt();
                    }
                  }}
                  trackColor={{ false: Palette.border, true: '#9EE6BD' }}
                  thumbColor={Palette.surfaceRaised}
                  value={isBiometricPromptSaving}
                />
              </View>
              <Pressable
                accessibilityRole='button'
                disabled={isBiometricPromptSaving}
                onPress={continueToHome}
                style={({ pressed }) => [styles.biometricPromptSkipButton, pressed && styles.pressed, isBiometricPromptSaving && styles.disabled]}>
                <Text style={styles.biometricPromptSkipText}>{isBiometricPromptSaving ? 'Saving...' : 'Not now'}</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
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
              <Text style={styles.headingCoreText}>Welcome back</Text>
              <Text style={styles.headingSubtitle}>Sign in to manage locations, chargers, users, and service requests.</Text>
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
                  <Text style={styles.formSubtitle}>Use your CMS account to continue.</Text>
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
                    size={24}
                    tintColor={canSubmitBiometric ? Palette.accent : Palette.textTertiary}
                  />
                </Pressable>
              </View>
            </View>

            <Text style={styles.footerText}>EBOOST CMS · Admin workspace</Text>
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
      </Canvas>
      <View style={styles.gradientContent}>{children}</View>
    </>
  );
}

const formBaseStyle = {
  backgroundColor: Palette.surfaceRaised,
  borderColor: 'rgba(1,167,78,0.12)',
  borderRadius: Radius.large,
  borderWidth: 1,
  boxShadow: '0 16px 40px rgba(22, 72, 52, 0.10)',
  gap: Spacing.four,
  paddingHorizontal: 22,
  paddingVertical: 24,
} as const;

const styles = StyleSheet.create({
  actionRow: {
    alignItems: 'stretch',
    flexDirection: 'row',
    gap: Spacing.two,
  },
  biometricButton: {
    alignItems: 'center',
    backgroundColor: '#F3FAF6',
    borderColor: 'rgba(1,167,78,0.22)',
    borderRadius: Radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 56,
    width: 56,
  },
  biometricButtonDisabled: {
    backgroundColor: Palette.surfaceMuted,
    borderColor: Palette.borderSubtle,
  },
  biometricPromptCard: {
    backgroundColor: Palette.surfaceRaised,
    borderRadius: Radius.large,
    gap: Spacing.four,
    maxWidth: 420,
    padding: Spacing.five,
    width: '88%',
  },
  biometricPromptIcon: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#E8F4EF',
    borderRadius: Radius.pill,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  biometricPromptSkipButton: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    justifyContent: 'center',
    minHeight: 44,
  },
  biometricPromptSkipText: {
    color: Palette.textSecondary,
    fontFamily: FontFamily.semibold,
    fontSize: 15,
    lineHeight: 20,
  },
  biometricPromptSwitchCopy: {
    flex: 1,
    gap: Spacing.half,
  },
  biometricPromptSwitchRow: {
    alignItems: 'center',
    backgroundColor: Palette.surfaceMuted,
    borderColor: Palette.borderSubtle,
    borderRadius: Radius.medium,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.three,
    justifyContent: 'space-between',
    padding: Spacing.three,
  },
  biometricPromptSwitchText: {
    color: Palette.textTertiary,
    fontFamily: FontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  biometricPromptSwitchTitle: {
    color: Palette.textPrimary,
    fontFamily: FontFamily.semibold,
    fontSize: 15,
    lineHeight: 20,
  },
  biometricPromptText: {
    color: Palette.textSecondary,
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  biometricPromptTitle: {
    color: Palette.textPrimary,
    fontFamily: FontFamily.bold,
    fontSize: 20,
    lineHeight: 26,
  },
  cardLogoImage: {
    height: 34,
    width: 128,
    objectFit: 'fill',
  },
  cardLogoWrap: {
    alignItems: 'center',
    flexShrink: 0,
    height: 36,
    justifyContent: 'center',
    marginLeft: -12,
    marginRight: -4,
    width: 128,
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
    borderRadius: Radius.medium,
    borderWidth: 1,
    padding: Spacing.three,
  },
  errorText: {
    color: '#B42318',
    fontFamily: FontFamily.semibold,
    fontSize: 14,
    lineHeight: 20,
  },
  footerText: {
    color: Palette.textTertiary,
    fontFamily: FontFamily.regular,
    fontSize: 11,
    lineHeight: 18,
    marginTop: Spacing.five,
    textAlign: 'center',
  },
  formCard: formBaseStyle,
  formHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: -2,
  },
  formHeaderText: {
    borderLeftColor: Palette.borderSubtle,
    borderLeftWidth: 1,
    flex: 1,
    gap: Spacing.half,
    paddingLeft: Spacing.two,
  },
  formSubtitle: {
    color: Palette.textSecondary,
    fontFamily: FontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  formTitle: {
    color: Palette.textPrimary,
    fontFamily: FontFamily.bold,
    fontSize: 15,
    lineHeight: 20,
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
    marginBottom: Spacing.six,
  },
  headingCoreText: {
    color: Palette.textPrimary,
    fontFamily: FontFamily.bold,
    fontSize: 36,
    letterSpacing: -0.8,
    lineHeight: 42,
    marginBottom: Spacing.two,
    textAlign: 'center',
  },
  headingSubtitle: {
    color: Palette.textSecondary,
    fontFamily: FontFamily.regular,
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 300,
    textAlign: 'center',
  },
  headingTag: {
    backgroundColor: '#E8F4EF',
    borderRadius: Radius.pill,
    marginBottom: Spacing.four,
    paddingHorizontal: Spacing.four,
    paddingVertical: 7,
  },
  headingTagText: {
    color: Palette.accent,
    fontFamily: FontFamily.bold,
    fontSize: 11,
    letterSpacing: 0.8,
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.38)',
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.five,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
  scrollContainer: {
    paddingBottom: 112,
    paddingHorizontal: Spacing.five,
    paddingTop: 72,
  },
  signInButton: {
    alignItems: 'center',
    backgroundColor: Palette.accent,
    borderRadius: Radius.pill,
    boxShadow: '0 8px 18px rgba(1, 167, 78, 0.18)',
    flex: 1,
    justifyContent: 'center',
    minHeight: 56,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
    fontSize: 16,
    lineHeight: 22,
  },
});
