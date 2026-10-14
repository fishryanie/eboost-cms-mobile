import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { ShieldCheck, type LucideIcon } from 'lucide-react-native';

import { loginAdmin } from 'utils/auth/auth-service';
import { getBiometricAvailability, getBiometricButtonLabel, getBiometricSymbolName } from 'utils/auth/biometric-auth';
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
  const [biometricIcon, setBiometricIcon] = useState<LucideIcon>(() => ShieldCheck);
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
    try {
      const [availability, hasSavedBiometricCredentials] = await Promise.all([getBiometricAvailability(), biometricCredentialStore.hasCredentials()]);

      if (availability.canUseBiometric && !hasSavedBiometricCredentials) {
        setPendingBiometricCredentials(credentials);
      }
    } catch {
      // Optional biometric setup must not prevent a successful password sign in.
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadBiometricState() {
      const [availability, hasSavedBiometricCredentials] = await Promise.all([getBiometricAvailability(), biometricCredentialStore.hasCredentials()]);

      if (!isMounted) {
        return;
      }

      setBiometricLabel(getBiometricButtonLabel(availability.authenticationTypes, Platform.OS));
      setBiometricIcon(() => getBiometricSymbolName(availability.authenticationTypes, Platform.OS));
      setCanUseBiometric(availability.canUseBiometric && hasSavedBiometricCredentials);
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
      const availability = await getBiometricAvailability();

      if (!availability.canUseBiometric) {
        setCanUseBiometric(false);
        setErrorMessage('Biometric sign in is unavailable on this device. Please use your CMS email and password.');
        return;
      }

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
