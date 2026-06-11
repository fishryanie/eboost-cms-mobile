import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as LocalAuthentication from 'expo-local-authentication';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Switch, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText, ThemedView } from 'components/base';

import { FontFamily, Palette, Radius, Spacing } from 'themes';
import { loginAdmin } from 'features/auth/auth-service';
import { biometricCredentialStore } from 'features/auth/biometric-credentials';
import { getBiometricButtonLabel, getBiometricSymbolName } from 'features/auth/biometric-auth';
import { sessionStore } from 'shared/session/session-store';
import { sessionKeys } from 'shared/session/use-session-token';

export default function DrawerSettingsScreen() {
  const queryClient = useQueryClient();
  const [biometricIcon, setBiometricIcon] = useState('lock.shield');
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
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior='automatic' keyboardShouldPersistTaps='handled'>
        <ThemedView gap={Spacing.one} paddingTop={Spacing.two}>
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
          borderRadius={Radius.large}
          borderWidth={1}
          boxShadow='0 12px 30px rgba(22, 72, 52, 0.08)'
          gap={Spacing.four}
          padding={Spacing.four}>
          <ThemedView alignItems='center' flexDirection='row' gap={Spacing.three}>
            <ThemedView alignItems='center' backgroundColor='#E8F4EF' borderRadius={Radius.pill} height={48} justifyContent='center' width={48}>
              <SymbolView name={biometricIcon as never} resizeMode='scaleAspectFit' size={24} tintColor={Palette.accent} />
            </ThemedView>
            <ThemedView flex={1} gap={Spacing.half}>
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
            <ThemedView gap={Spacing.three}>
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
                <ThemedView backgroundColor={Palette.dangerSurface} borderColor='#FDA29B' borderRadius={Radius.medium} borderWidth={1} padding={Spacing.three}>
                  <ThemedText color='#B42318' fontFamily={FontFamily.semibold} fontSize={14} lineHeight={20}>
                    {errorMessage}
                  </ThemedText>
                </ThemedView>
              ) : null}
              <ThemedView flexDirection='row' gap={Spacing.two}>
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
            <ThemedView backgroundColor={Palette.dangerSurface} borderColor='#FDA29B' borderRadius={Radius.medium} borderWidth={1} padding={Spacing.three}>
              <ThemedText color='#B42318' fontFamily={FontFamily.semibold} fontSize={14} lineHeight={20}>
                {errorMessage}
              </ThemedText>
            </ThemedView>
          ) : null}
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Palette.surfaceBase,
    flex: 1,
  },
  content: {
    gap: Spacing.five,
    padding: Spacing.five,
  },
  disabled: {
    opacity: 0.72,
  },
  input: {
    backgroundColor: Palette.surfaceRaised,
    borderColor: Palette.border,
    borderRadius: Radius.medium,
    borderWidth: 1,
    color: Palette.textPrimary,
    fontFamily: FontFamily.medium,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: Spacing.four,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: Palette.accent,
    borderRadius: Radius.pill,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: Palette.surfaceMuted,
    borderColor: Palette.borderSubtle,
    borderRadius: Radius.pill,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
});
