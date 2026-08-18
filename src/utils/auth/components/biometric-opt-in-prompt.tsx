import * as LocalAuthentication from 'expo-local-authentication';

import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';
import Modal from 'react-native-modal';
import { Switch, ThemedText, ThemedView } from 'components/base';

import { FontFamily, Palette } from 'themes';
import { getBiometricButtonLabel, getBiometricSymbolName } from 'utils/auth/biometric-auth';
import { biometricCredentialStore, type BiometricCredentials } from 'utils/auth/biometric-credentials';
import { consumePendingBiometricCredentials } from 'utils/auth/biometric-prompt';
import { ShieldCheck, type LucideIcon } from 'lucide-react-native';

export function BiometricOptInPrompt() {
  const [biometricIcon, setBiometricIcon] = useState<LucideIcon>(ShieldCheck);
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
    <Modal
      animationIn='zoomIn'
      animationInTiming={300}
      animationOut='zoomOut'
      animationOutTiming={220}
      backdropColor='#101828'
      backdropOpacity={0.42}
      backdropTransitionInTiming={300}
      backdropTransitionOutTiming={220}
      hideModalContentWhileAnimating
      isVisible={Boolean(pendingCredentials)}
      onBackButtonPress={closePrompt}
      onBackdropPress={closePrompt}
      style={styles.centerModal}>
      <ThemedView alignItems='center' flex={1} justifyContent='center' padding={'five'}>
        <ThemedView backgroundColor={Palette.surfaceRaised} borderRadius={'large'} gap={'four'} maxWidth={420} padding={'five'} width='88%'>
          <ThemedView alignItems='center' alignSelf='flex-start' backgroundColor='#E8F4EF' borderRadius={'pill'} height={52} justifyContent='center' width={52}>
            {(() => {
              const BiometricIcon = biometricIcon;
              return <BiometricIcon color={Palette.accent} size={28} />;
            })()}
          </ThemedView>
          <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={20} lineHeight={26}>
            Enable {biometricLabel} sign in?
          </ThemedText>
          <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={14} lineHeight={20}>
            Use your saved CMS account to sign in faster next time after biometric verification.
          </ThemedText>
          <ThemedView
            alignItems='center'
            backgroundColor={Palette.surfaceMuted}
            borderColor={Palette.borderSubtle}
            borderRadius={'medium'}
            borderWidth={1}
            flexDirection='row'
            gap={'three'}
            justifyContent='space-between'
            padding={'three'}>
            <ThemedView flex={1} gap={'half'}>
              <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={15} lineHeight={20}>
                Fast sign in
              </ThemedText>
              <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.regular} fontSize={12} lineHeight={16}>
                You can turn this off later in Settings.
              </ThemedText>
            </ThemedView>
            <Switch
              accessibilityLabel='Enable fast biometric sign in'
              disabled={isSaving}
              onValueChange={value => {
                if (value) {
                  void enableBiometric();
                }
              }}
              value={isSaving}
            />
          </ThemedView>
          <Pressable
            accessibilityRole='button'
            disabled={isSaving}
            onPress={closePrompt}
            style={({ pressed }) => [styles.skipButton, pressed && styles.pressed, isSaving && styles.disabled]}>
            <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={15} lineHeight={20}>
              {isSaving ? 'Saving...' : 'Not now'}
            </ThemedText>
          </Pressable>
        </ThemedView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centerModal: {
    margin: 0,
  },
  disabled: {
    opacity: 0.72,
  },
  pressed: {
    opacity: 0.72,
  },
  skipButton: {
    alignItems: 'center',
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 44,
  },
});
