import { ThemedText, ThemedView } from 'components/base';
import { AppButton } from 'components/ui/button';
import * as Updates from 'expo-updates';
import { DownloadCloud, RefreshCw } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import Modal from 'react-native-modal';
import { Colors, Palette } from 'themes/colors';

export function AutoUpdateModal() {
  const { downloadProgress, isUpdatePending } = Updates.useUpdates();
  
  // Quản lý các trạng thái của Modal: ẩn, đang hỏi, đang tải, đã sẵn sàng khởi động lại
  const [modalState, setModalState] = useState<'hidden' | 'asking' | 'downloading' | 'ready'>('hidden');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    async function checkAndUpdate() {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          // Bật popup hỏi người dùng có muốn update không
          setModalState('asking');
        }
      } catch (error) {
        console.log('Update error:', error);
      }
    }

    if (!__DEV__) {
      checkAndUpdate();
      const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
        if (nextAppState === 'active' && modalState === 'hidden') {
          checkAndUpdate();
        }
      });
      return () => subscription.remove();
    }
  }, [modalState]);

  // Lắng nghe khi tải xong thì chuyển sang trạng thái Sẵn sàng
  useEffect(() => {
    if (isUpdatePending && modalState === 'downloading') {
      setModalState('ready');
    }
  }, [isUpdatePending, modalState]);

  const handleStartDownload = async () => {
    setModalState('downloading');
    try {
      await Updates.fetchUpdateAsync();
      // Backup trigger chuyển trạng thái nếu isUpdatePending không kích hoạt nhanh
      setModalState('ready');
    } catch (e) {
      console.log('Download error:', e);
      setModalState('hidden');
    }
  };

  const handleRestart = async () => {
    setIsUpdating(true);
    try {
      await Updates.reloadAsync();
    } catch (error) {
      console.log('Reload error:', error);
      setIsUpdating(false);
      setModalState('hidden'); // Fallback: close modal if reload fails
    }
  };

  const handleCancel = () => {
    setModalState('hidden');
  };

  return (
    <Modal
      isVisible={modalState !== 'hidden'}
      backdropOpacity={0.4}
      animationIn='zoomIn'
      animationOut='zoomOut'
      style={{ margin: 24, justifyContent: 'center' }} // Nằm giữa màn hình, cách viền 24px
      useNativeDriver
      hideModalContentWhileAnimating>
      <ThemedView
        backgroundColor='#FFFFFF'
        radius={24} // Bo tròn các góc
        padding={24}
        contentCenter>
        <ThemedView round={64} backgroundColor={Colors.light.backgroundSelected} contentCenter marginBottom={20}>
          <DownloadCloud color={Palette.accent} size={32} strokeWidth={2.5} />
        </ThemedView>

        <ThemedText type='title' fontSize={22} fontWeight='bold' textAlign='center' marginBottom={8} color={Palette.textPrimary}>
          {modalState === 'asking' 
            ? 'Đã có bản cập nhật mới!' 
            : modalState === 'downloading' 
            ? 'Đang tải bản cập nhật...' 
            : 'Sẵn sàng khởi động!'}
        </ThemedText>

        <ThemedText type='default' color={Palette.textSecondary} textAlign='center' marginBottom={24} fontSize={15} lineHeight={22}>
          {modalState === 'asking'
            ? 'Chúng tôi vừa ra mắt phiên bản mới nhất với nhiều tính năng và cải tiến. Bạn có muốn tải về ngay không?'
            : modalState === 'downloading'
            ? 'Vui lòng không tắt ứng dụng trong quá trình này nhé.'
            : 'Đã tải xong! Bạn hãy khởi động lại ứng dụng để trải nghiệm ngay nhé!'}
        </ThemedText>

        {modalState === 'downloading' && (
          <ThemedView width="100%" marginBottom={8}>
            <ThemedView rowCenter justifyContent="space-between" marginBottom={8}>
              <ThemedText color={Palette.textPrimary} fontWeight="600">Tiến trình</ThemedText>
              <ThemedText color={Palette.accent} fontWeight="bold">{Math.round((downloadProgress ?? 0) * 100)}%</ThemedText>
            </ThemedView>
            <ThemedView width="100%" height={8} backgroundColor={Colors.light.backgroundSelected} radius={4} style={{ overflow: 'hidden' }}>
              <ThemedView height="100%" backgroundColor={Palette.accent} style={{ width: `${Math.round((downloadProgress ?? 0) * 100)}%` }} />
            </ThemedView>
          </ThemedView>
        )}

        {modalState === 'asking' && (
          <ThemedView width="100%" row columnGap={12}>
            <ThemedView flex={1}>
              <AppButton label='Để sau' onPress={handleCancel} variant='ghost' block />
            </ThemedView>
            <ThemedView flex={1}>
              <AppButton label='Cập nhật' onPress={handleStartDownload} variant='primary' block />
            </ThemedView>
          </ThemedView>
        )}

        {modalState === 'ready' && (
          <AppButton
            label='Khởi động lại ngay'
            loading={isUpdating}
            onPress={handleRestart}
            variant='primary'
            block
            icon={<RefreshCw color='#FFFFFF' size={20} />}
          />
        )}
      </ThemedView>
    </Modal>
  );
}
