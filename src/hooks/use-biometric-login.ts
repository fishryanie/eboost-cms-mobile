import { useQueryClient } from '@tanstack/react-query';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { ShieldCheck, type LucideIcon } from 'lucide-react-native';

import { loginAdmin } from 'utils/auth/auth-service';
import { getBiometricButtonLabel, getBiometricSymbolName } from 'utils/auth/biometric-auth';
import { biometricCredentialStore, type BiometricCredentials } from 'utils/auth/biometric-credentials';
import { setPendingBiometricCredentials } from 'utils/auth/biometric-prompt';
import { sessionStore } from 'utils/session/session-store';
import { sessionKeys } from 'utils/session/use-session-token';

type UseBiometricLoginOptions = {
  setErrorMessage: (message: string) => void;
};

export function useBiometricLogin({ setErrorMessage }: UseBiometricLoginOptions) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [biometricIcon, setBiometricIcon] = useState<LucideIcon>(ShieldCheck);
  const [biometricLabel, setBiometricLabel] = useState('Biometric');
  const [canUseBiometric, setCanUseBiometric] = useState(false);
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);

  const completeAuthenticatedSession = useCallback(
    async ({ refreshToken, token }: { refreshToken?: string; token: string }) => {
      await sessionStore.setTokens({ refreshToken, token });
      queryClient.setQueryData(sessionKeys.token, token);
      await queryClient.invalidateQueries({ queryKey: ['locations'] });
      router.replace('/technical');
    },
    [queryClient, router],
  );

  const queueBiometricOptIn = useCallback(async (credentials: BiometricCredentials) => {
    const [canSaveProtectedCredentials, hasSavedBiometricCredentials] = await Promise.all([
      biometricCredentialStore.canUseBiometricAuthentication(),
      biometricCredentialStore.hasCredentials(),
    ]);

    if (canSaveProtectedCredentials && !hasSavedBiometricCredentials) {
      setPendingBiometricCredentials(credentials);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadBiometricState() {
      const [hasHardware, isEnrolled, authenticationTypes, canSaveProtectedCredentials, hasSavedBiometricCredentials] = await Promise.all([
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
      setCanUseBiometric(hasHardware && isEnrolled && canSaveProtectedCredentials && hasSavedBiometricCredentials);
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

  const handleBiometricLogin = useCallback(async () => {
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

      await completeAuthenticatedSession({
        refreshToken: response.refreshToken || response.refresh_token,
        token: response.token,
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Biometric sign in was cancelled or failed. Please try again.');
    } finally {
      setIsBiometricLoading(false);
    }
  }, [completeAuthenticatedSession, setErrorMessage]);

  return {
    biometricIcon,
    biometricLabel,
    canUseBiometric,
    completeAuthenticatedSession,
    handleBiometricLogin,
    isBiometricLoading,
    queueBiometricOptIn,
  };
}
