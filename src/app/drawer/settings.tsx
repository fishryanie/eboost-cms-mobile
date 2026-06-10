import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as LocalAuthentication from 'expo-local-authentication';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FontFamily, Palette, Radius, Spacing } from 'constants/theme';
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
      const [hasHardware, isEnrolled, authenticationTypes, hasSavedCredentials, savedUsername] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
        LocalAuthentication.supportedAuthenticationTypesAsync(),
        biometricCredentialStore.hasCredentials(),
        biometricCredentialStore.getLastUsername(),
      ]);

      if (!isMounted) {
        return;
      }

      setBiometricIcon(getBiometricSymbolName(authenticationTypes));
      setBiometricLabel(getBiometricButtonLabel(authenticationTypes, Platform.OS));
      setBiometricEnabled(hasSavedCredentials);
      setCanUseBiometric(hasHardware && isEnrolled);
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

      await biometricCredentialStore.setLastUsername(username);
      await biometricCredentialStore.saveCredentials({ password, username });
      await sessionStore.setToken(response.token);
      await queryClient.invalidateQueries({ queryKey: sessionKeys.token });
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
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Settings</Text>
          <Text style={styles.title}>Security</Text>
        </View>

        <View style={styles.panel}>
          <View style={styles.settingRow}>
            <View style={styles.settingIcon}>
              <SymbolView name={biometricIcon as never} resizeMode='scaleAspectFit' size={24} tintColor={Palette.accent} />
            </View>
            <View style={styles.settingCopy}>
              <Text style={styles.settingTitle}>{biometricLabel} sign in</Text>
              <Text style={styles.settingDescription}>
                {biometricEnabled ? `Enabled for ${displayUsername}.` : 'Unlock your saved CMS account for faster sign in.'}
              </Text>
            </View>
            <Switch
              disabled={isSaving}
              onValueChange={handleSwitchChange}
              trackColor={{ false: Palette.border, true: '#9EE6BD' }}
              thumbColor={Palette.surfaceRaised}
              value={biometricEnabled || showPasswordForm}
            />
          </View>

          {showPasswordForm ? (
            <View style={styles.passwordForm}>
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
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}
              <View style={styles.formActions}>
                <Pressable
                  accessibilityRole='button'
                  disabled={isSaving}
                  onPress={() => {
                    setShowPasswordForm(false);
                    setPassword('');
                    setErrorMessage('');
                  }}
                  style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  accessibilityRole='button'
                  disabled={isSaving}
                  onPress={() => enableBiometricMutation.mutate()}
                  style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, isSaving && styles.disabled]}>
                  <Text style={styles.primaryButtonText}>{isSaving ? 'Verifying...' : 'Enable'}</Text>
                </Pressable>
              </View>
            </View>
          ) : errorMessage ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}
        </View>
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
  eyebrow: {
    color: Palette.accent,
    fontFamily: FontFamily.bold,
    fontSize: 12,
    lineHeight: 18,
    textTransform: 'uppercase',
  },
  formActions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  header: {
    gap: Spacing.one,
    paddingTop: Spacing.two,
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
  panel: {
    backgroundColor: Palette.surfaceRaised,
    borderColor: Palette.borderSubtle,
    borderRadius: Radius.large,
    borderWidth: 1,
    boxShadow: '0 12px 30px rgba(22, 72, 52, 0.08)',
    gap: Spacing.four,
    padding: Spacing.four,
  },
  passwordForm: {
    gap: Spacing.three,
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
  primaryButtonText: {
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
    fontSize: 15,
    lineHeight: 20,
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
  secondaryButtonText: {
    color: Palette.textSecondary,
    fontFamily: FontFamily.semibold,
    fontSize: 15,
    lineHeight: 20,
  },
  settingCopy: {
    flex: 1,
    gap: Spacing.half,
  },
  settingDescription: {
    color: Palette.textSecondary,
    fontFamily: FontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  settingIcon: {
    alignItems: 'center',
    backgroundColor: '#E8F4EF',
    borderRadius: Radius.pill,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  settingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.three,
  },
  settingTitle: {
    color: Palette.textPrimary,
    fontFamily: FontFamily.bold,
    fontSize: 16,
    lineHeight: 22,
  },
  title: {
    color: Palette.textPrimary,
    fontFamily: FontFamily.bold,
    fontSize: 32,
    lineHeight: 38,
  },
});
