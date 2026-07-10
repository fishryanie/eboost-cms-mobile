import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ShieldAlert } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import Modal from 'react-native-modal';

import { ThemedText, ThemedView } from 'components/base';
import { AppButton } from 'components/ui/button';
import { setApiSessionExpiredHandler } from 'utils/api/client';
import { FontFamily, Palette } from 'themes';

import { sessionStore } from '../session-store';
import { sessionKeys } from '../use-session-token';

export function SessionExpiredModal() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const handlingRef = useRef(false);

  useEffect(() => {
    setApiSessionExpiredHandler(() => {
      setVisible(true);
    });

    return () => {
      setApiSessionExpiredHandler(() => undefined);
    };
  }, []);

  const handleConfirm = useCallback(async () => {
    if (handlingRef.current) return;

    handlingRef.current = true;
    try {
      await sessionStore.clearTokens();
      queryClient.clear();
      queryClient.setQueryData(sessionKeys.token, null);
      setVisible(false);
      router.replace('/login');
    } finally {
      handlingRef.current = false;
    }
  }, [queryClient, router]);

  return (
    <Modal
      isVisible={visible}
      animationIn='zoomIn'
      animationOut='zoomOut'
      backdropOpacity={0.45}
      hideModalContentWhileAnimating
      style={{ justifyContent: 'center', margin: 24 }}
      useNativeDriver>
      <ThemedView alignItems='center' backgroundColor='#FFFFFF' borderRadius={24} padding={24}>
        <ThemedView alignItems='center' backgroundColor='#FEF3F2' justifyContent='center' marginBottom={20} round={64}>
          <ShieldAlert color={Palette.danger} size={32} strokeWidth={2.5} />
        </ThemedView>

        <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={22} lineHeight={28} marginBottom={8} textAlign='center'>
          Phiên đăng nhập đã hết hạn
        </ThemedText>

        <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={15} lineHeight={22} marginBottom={24} textAlign='center'>
          Vui lòng đăng nhập lại để tiếp tục sử dụng CMS.
        </ThemedText>

        <AppButton block label='OK' onPress={handleConfirm} variant='primary' />
      </ThemedView>
    </Modal>
  );
}
