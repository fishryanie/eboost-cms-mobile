import { mhs } from 'themes/scaling';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as LocalAuthentication from 'expo-local-authentication';
import { ShieldCheck, type LucideIcon } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Switch, TextInput } from 'react-native';
import { ThemedText, ThemedView } from 'components/base';

import { FontFamily, Palette } from 'themes';
import { loginAdmin } from 'utils/auth/auth-service';
import { biometricCredentialStore } from 'utils/auth/biometric-credentials';
import { getBiometricButtonLabel, getBiometricSymbolName } from 'utils/auth/biometric-auth';
import { sessionStore } from 'utils/session/session-store';
import { sessionKeys } from 'utils/session/use-session-token';

export default function DrawerSettingsScreen() {
  const queryClient = useQueryClient();
  const [BiometricIcon, setBiometricIcon] = useState<LucideIcon>(() => ShieldCheck);
  const [biometricLabel, setBiometricLabel] = useState('Biometric');
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [canUseBiometric, setCanUseBiometric] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [lastUsername, setLastUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadBiometricSettings() {
      const [hasHardware, isEnrolled, authenticationTypes, canSaveProtectedCredentials, hasSavedCredentials, savedUsername] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
        LocalAuthentication.supportedAuthenticationTypesAsync(),
        biometricCredentialStore.canUseBiometricAuthentication(),
        biometricCredentialStore.hasCredentials(),
        biometricCredentialStore.getLastUsername(),
      ]);

      if (!isMounted) {
        return;
      }

      setBiometricIcon(getBiometricSymbolName(authenticationTypes));
      setBiometricLabel(getBiometricButtonLabel(authenticationTypes, Platform.OS));
      setBiometricEnabled(hasSavedCredentials);
      setCanUseBiometric(hasHardware && isEnrolled && canSaveProtectedCredentials);
      setLastUsername(savedUsername ?? '');
      setUsernameInput(savedUsername ?? '');
    }

    loadBiometricSettings().catch(() => {
      if (isMounted) {
        setCanUseBiometric(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const enableBiometricMutation = useMutation({
    mutationFn: async () => {
      const username = (lastUsername || usernameInput).trim();

      if (!username || !password) {
        throw new Error('Enter your CMS email and password to enable biometric sign in.');
      }

      const response = await loginAdmin({ password, username });

      if (!response.token) {
        throw new Error(response.message || 'Your password could not be verified.');
      }

      await Promise.all([
        biometricCredentialStore.setLastUsername(username),
        biometricCredentialStore.saveCredentials({ password, username }),
        sessionStore.setToken(response.token),
      ]);
      queryClient.setQueryData(sessionKeys.token, response.token);
      await queryClient.invalidateQueries({ queryKey: ['locations'] });
      return username;
    },
    onError: error => {
      setErrorMessage(error instanceof Error ? error.message : 'Your password could not be verified.');
    },
    onSuccess: username => {
      setBiometricEnabled(true);
      setErrorMessage('');
      setLastUsername(username);
      setPassword('');
      setShowPasswordForm(false);
    },
  });

  const handleSwitchChange = (enabled: boolean) => {
    setErrorMessage('');

    if (!enabled) {
      void biometricCredentialStore.clearCredentials().then(() => {
        setBiometricEnabled(false);
        setPassword('');
        setShowPasswordForm(false);
      });
      return;
    }

    if (!canUseBiometric) {
      setErrorMessage('Set up biometrics on this device before enabling fast sign in.');
      return;
    }

    setShowPasswordForm(true);
  };

  const isSaving = enableBiometricMutation.isPending;
  const displayUsername = lastUsername || usernameInput;

  return (
    <ThemedView safePaddingTop safePaddingBottom flex={1} backgroundColor={Palette.surfaceBase}>
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior='automatic' keyboardShouldPersistTaps='handled'>
        <ThemedView gap={'one'} paddingTop={'two'}>
          <ThemedText color={Palette.accent} fontFamily={FontFamily.bold} fontSize={12} lineHeight={18} textTransform='uppercase'>
            Settings
          </ThemedText>
          <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={32} lineHeight={38}>
            Security
          </ThemedText>
        </ThemedView>

        <ThemedView
          backgroundColor={Palette.surfaceRaised}
          borderColor={Palette.borderSubtle}
          borderRadius={'large'}
          borderWidth={1}
          boxShadow='0 12px 30px rgba(22, 72, 52, 0.08)'
          gap={'four'}
          padding={'four'}>
          <ThemedView alignItems='center' flexDirection='row' gap={'three'}>
            <ThemedView alignItems='center' backgroundColor='#E8F4EF' borderRadius={'pill'} height={48} justifyContent='center' width={48}>
              <BiometricIcon color={Palette.accent} size={24} />
            </ThemedView>
            <ThemedView flex={1} gap={'half'}>
              <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={16} lineHeight={22}>
                {biometricLabel} sign in
              </ThemedText>
              <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={13} lineHeight={18}>
                {biometricEnabled ? `Enabled for ${displayUsername}.` : 'Unlock your saved CMS account for faster sign in.'}
              </ThemedText>
            </ThemedView>
            <Switch
              disabled={isSaving}
              onValueChange={handleSwitchChange}
              trackColor={{ false: Palette.border, true: '#9EE6BD' }}
              thumbColor={Palette.surfaceRaised}
              value={biometricEnabled || showPasswordForm}
            />
          </ThemedView>

          {showPasswordForm ? (
            <ThemedView gap={'three'}>
              {!lastUsername ? (
                <TextInput
                  autoCapitalize='none'
                  autoComplete='email'
                  editable={!isSaving}
                  keyboardType='email-address'
                  onChangeText={setUsernameInput}
                  placeholder='Email'
                  placeholderTextColor={Palette.textTertiary}
                  style={styles.input}
                  textContentType='emailAddress'
                  value={usernameInput}
                />
              ) : null}
              <TextInput
                autoCapitalize='none'
                autoComplete='password'
                editable={!isSaving}
                onChangeText={setPassword}
                onSubmitEditing={() => enableBiometricMutation.mutate()}
                placeholder='Confirm your password'
                placeholderTextColor={Palette.textTertiary}
                returnKeyType='done'
                secureTextEntry
                style={styles.input}
                textContentType='password'
                value={password}
              />
              {errorMessage ? (
                <ThemedView backgroundColor={Palette.dangerSurface} borderColor='#FDA29B' borderRadius={'medium'} borderWidth={1} padding={'three'}>
                  <ThemedText color='#B42318' fontFamily={FontFamily.semibold} fontSize={14} lineHeight={20}>
                    {errorMessage}
                  </ThemedText>
                </ThemedView>
              ) : null}
              <ThemedView flexDirection='row' gap={'two'}>
                <Pressable
                  accessibilityRole='button'
                  disabled={isSaving}
                  onPress={() => {
                    setShowPasswordForm(false);
                    setPassword('');
                    setErrorMessage('');
                  }}
                  style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
                  <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={15} lineHeight={20}>
                    Cancel
                  </ThemedText>
                </Pressable>
                <Pressable
                  accessibilityRole='button'
                  disabled={isSaving}
                  onPress={() => enableBiometricMutation.mutate()}
                  style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, isSaving && styles.disabled]}>
                  <ThemedText color='#FFFFFF' fontFamily={FontFamily.bold} fontSize={15} lineHeight={20}>
                    {isSaving ? 'Verifying...' : 'Enable'}
                  </ThemedText>
                </Pressable>
              </ThemedView>
            </ThemedView>
          ) : errorMessage ? (
            <ThemedView backgroundColor={Palette.dangerSurface} borderColor='#FDA29B' borderRadius={'medium'} borderWidth={1} padding={'three'}>
              <ThemedText color='#B42318' fontFamily={FontFamily.semibold} fontSize={14} lineHeight={20}>
                {errorMessage}
              </ThemedText>
            </ThemedView>
          ) : null}
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: mhs(24),
    padding: mhs(24),
  },
  disabled: {
    opacity: 0.72,
  },
  input: {
    backgroundColor: Palette.surfaceRaised,
    borderColor: Palette.border,
    borderRadius: mhs(16),
    borderWidth: 1,
    color: Palette.textPrimary,
    fontFamily: FontFamily.medium,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: mhs(16),
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: Palette.accent,
    borderRadius: 999,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: Palette.surfaceMuted,
    borderColor: Palette.borderSubtle,
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
});
