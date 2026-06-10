import * as LocalAuthentication from 'expo-local-authentication';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { FontFamily, Palette, Radius, Spacing } from 'themes';
import { getBiometricButtonLabel, getBiometricSymbolName } from 'features/auth/biometric-auth';
import { biometricCredentialStore, type BiometricCredentials } from 'features/auth/biometric-credentials';
import { consumePendingBiometricCredentials } from 'features/auth/biometric-prompt';

export function BiometricOptInPrompt() {
  const [biometricIcon, setBiometricIcon] = useState('lock.shield');
  const [biometricLabel, setBiometricLabel] = useState('Biometric');
  const [isSaving, setIsSaving] = useState(false);
  const [pendingCredentials, setPendingCredentials] = useState<BiometricCredentials | null>(null);

  useEffect(() => {
    let isMounted = true;
    const credentials = consumePendingBiometricCredentials();

    if (!credentials) {
      return;
    }

    async function loadPromptState() {
      const [hasHardware, isEnrolled, authenticationTypes, canSaveProtectedCredentials, hasSavedCredentials] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
        LocalAuthentication.supportedAuthenticationTypesAsync(),
        biometricCredentialStore.canUseBiometricAuthentication(),
        biometricCredentialStore.hasCredentials(),
      ]);

      if (!isMounted) {
        return;
      }

      setBiometricLabel(getBiometricButtonLabel(authenticationTypes, Platform.OS));
      setBiometricIcon(getBiometricSymbolName(authenticationTypes));

      if (hasHardware && isEnrolled && canSaveProtectedCredentials && !hasSavedCredentials) {
        setPendingCredentials(credentials);
      }
    }

    loadPromptState().catch(() => {
      if (isMounted) {
        setPendingCredentials(null);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const closePrompt = () => {
    setPendingCredentials(null);
  };

  const enableBiometric = async () => {
    if (!pendingCredentials) {
      closePrompt();
      return;
    }

    setIsSaving(true);

    try {
      await biometricCredentialStore.saveCredentials(pendingCredentials);
      closePrompt();
    } catch {
      closePrompt();
    }

    setIsSaving(false);
  };

  return (
    <Modal animationType='fade' onRequestClose={closePrompt} transparent visible={Boolean(pendingCredentials)}>
      <View style={styles.modalOverlay}>
        <View style={styles.card}>
          <View style={styles.icon}>
            <SymbolView name={biometricIcon as never} resizeMode='scaleAspectFit' size={28} tintColor={Palette.accent} />
          </View>
          <Text style={styles.title}>Enable {biometricLabel} sign in?</Text>
          <Text style={styles.text}>Use your saved CMS account to sign in faster next time after biometric verification.</Text>
          <View style={styles.switchRow}>
            <View style={styles.switchCopy}>
              <Text style={styles.switchTitle}>Fast sign in</Text>
              <Text style={styles.switchText}>You can turn this off later in Settings.</Text>
            </View>
            <Switch
              disabled={isSaving}
              onValueChange={value => {
                if (value) {
                  void enableBiometric();
                }
              }}
              trackColor={{ false: Palette.border, true: '#9EE6BD' }}
              thumbColor={Palette.surfaceRaised}
              value={isSaving}
            />
          </View>
          <Pressable
            accessibilityRole='button'
            disabled={isSaving}
            onPress={closePrompt}
            style={({ pressed }) => [styles.skipButton, pressed && styles.pressed, isSaving && styles.disabled]}>
            <Text style={styles.skipText}>{isSaving ? 'Saving...' : 'Not now'}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.surfaceRaised,
    borderRadius: Radius.large,
    gap: Spacing.four,
    maxWidth: 420,
    padding: Spacing.five,
    width: '88%',
  },
  disabled: {
    opacity: 0.72,
  },
  icon: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#E8F4EF',
    borderRadius: Radius.pill,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(16,24,40,0.42)',
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.five,
  },
  pressed: {
    opacity: 0.72,
  },
  skipButton: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    justifyContent: 'center',
    minHeight: 44,
  },
  skipText: {
    color: Palette.textSecondary,
    fontFamily: FontFamily.semibold,
    fontSize: 15,
    lineHeight: 20,
  },
  switchCopy: {
    flex: 1,
    gap: Spacing.half,
  },
  switchRow: {
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
  switchText: {
    color: Palette.textTertiary,
    fontFamily: FontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  switchTitle: {
    color: Palette.textPrimary,
    fontFamily: FontFamily.semibold,
    fontSize: 15,
    lineHeight: 20,
  },
  text: {
    color: Palette.textSecondary,
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  title: {
    color: Palette.textPrimary,
    fontFamily: FontFamily.bold,
    fontSize: 20,
    lineHeight: 26,
  },
});
