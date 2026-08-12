import { CameraView, scanFromURLAsync, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import { useIsFocused, useRouter } from 'expo-router';
import { Camera, CameraOff, ChevronLeft, Copy, ExternalLink, Flashlight, FlashlightOff, QrCode, RotateCcw } from 'lucide-react-native';
import LottieView from 'lottie-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { ThemedText, ThemedView } from 'components/base';
import { FontFamily, Palette } from 'themes';
import { mhs, mvs, width } from 'themes/scaling';

import qrScannerAnimation from 'assets/lotties/scan-qr-code.json';

const SCANNER_ANIMATION_SIZE = Math.min(width - mhs(32), mhs(340));
const SHOULD_CHECK_CAMERA_AVAILABILITY = Platform.OS === 'web';

const getScannedLink = (value: string) => {
  const trimmedValue = value.trim();
  if (/^https?:\/\//i.test(trimmedValue)) return trimmedValue;
  if (/^www\./i.test(trimmedValue)) return `https://${trimmedValue}`;
  return null;
};

export default function ScanQrCodeScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const lastScannedCode = useRef<string | null>(null);
  const scanLockedRef = useRef(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [isCameraAvailable, setIsCameraAvailable] = useState(!SHOULD_CHECK_CAMERA_AVAILABILITY);
  const [scannedValue, setScannedValue] = useState<string | null>(null);

  const cameraIsActive = isFocused && Boolean(permission?.granted) && isCameraAvailable;
  const effectiveTorchEnabled = cameraIsActive && torchEnabled;

  useEffect(() => {
    if (!SHOULD_CHECK_CAMERA_AVAILABILITY) return;

    let isMounted = true;

    CameraView.isAvailableAsync()
      .then(isAvailable => {
        if (isMounted) setIsCameraAvailable(isAvailable);
      })
      .catch(() => {
        if (isMounted) setIsCameraAvailable(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const handleBarcodeScanned = useCallback((result: BarcodeScanningResult) => {
    if (!result.data || scanLockedRef.current || lastScannedCode.current === result.data) return;

    scanLockedRef.current = true;
    lastScannedCode.current = result.data;
    setScannedValue(result.data);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    Toast.show({
      type: 'success',
      text1: 'QR code scanned',
      text2: result.data,
    });
  }, []);

  const handlePickQrImage = useCallback(async () => {
    try {
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        mediaTypes: ['images'],
        quality: 1,
      });
      const selectedImage = pickerResult.assets?.[0];
      if (pickerResult.canceled || !selectedImage) return;

      const [qrResult] = await scanFromURLAsync(selectedImage.uri, ['qr']);
      if (!qrResult?.data) {
        Toast.show({
          type: 'info',
          text1: 'No QR code found',
          text2: 'Please choose a clearer QR code image.',
        });
        return;
      }

      scanLockedRef.current = false;
      lastScannedCode.current = null;
      handleBarcodeScanned(qrResult);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Cannot scan this image',
        text2: error instanceof Error ? error.message : 'Please try again.',
      });
    }
  }, [handleBarcodeScanned]);

  const handleResetScan = useCallback(() => {
    scanLockedRef.current = false;
    lastScannedCode.current = null;
    setScannedValue(null);
    void Haptics.selectionAsync().catch(() => undefined);
  }, []);

  const handleCopyScannedValue = useCallback(async () => {
    if (!scannedValue) return;
    await Clipboard.setStringAsync(scannedValue);
    void Haptics.selectionAsync().catch(() => undefined);
    Toast.show({
      type: 'success',
      text1: 'Copied QR code',
      text2: scannedValue,
    });
  }, [scannedValue]);

  const handleOpenScannedLink = useCallback(async () => {
    if (!scannedValue) return;

    const link = getScannedLink(scannedValue);
    if (!link) {
      Toast.show({
        type: 'info',
        text1: 'Not a link',
        text2: 'This QR code does not contain a web URL.',
      });
      return;
    }

    const canOpen = await Linking.canOpenURL(link);
    if (!canOpen) {
      Toast.show({
        type: 'error',
        text1: 'Cannot open link',
        text2: link,
      });
      return;
    }

    await Linking.openURL(link);
  }, [scannedValue]);

  const handleToggleTorch = useCallback(() => {
    setTorchEnabled(current => !current);
  }, []);

  if (!isCameraAvailable) {
    return (
      <ThemedView flex={1} contentCenter backgroundColor='#05070B' paddingHorizontal={24}>
        <CameraOff color='#FFFFFF' size={34} />
        <ThemedText color='#FFFFFF' fontFamily={FontFamily.semibold} fontSize={18} lineHeight={24} marginTop={16} textAlign='center'>
          No camera device
        </ThemedText>
      </ThemedView>
    );
  }

  if (!permission?.granted) {
    const isBlocked = permission && !permission.canAskAgain;
    return (
      <ThemedView flex={1} contentCenter backgroundColor='#05070B' paddingHorizontal={24}>
        <Camera color='#FFFFFF' size={34} />
        <ThemedText color='#FFFFFF' fontFamily={FontFamily.semibold} fontSize={18} lineHeight={24} marginTop={16} textAlign='center'>
          Camera permission is required
        </ThemedText>
        <Pressable accessibilityRole='button' onPress={isBlocked ? Linking.openSettings : requestPermission} style={styles.permissionButton}>
          <ThemedText color={Palette.surfaceBase} fontFamily={FontFamily.semibold} fontSize={14} lineHeight={20}>
            {isBlocked ? 'Open Settings' : 'Allow Camera'}
          </ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView flex={1} backgroundColor='#05070B'>
      <CameraView
        active={cameraIsActive}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        enableTorch={effectiveTorchEnabled}
        onBarcodeScanned={scannedValue ? undefined : handleBarcodeScanned}
        onMountError={event => {
          Toast.show({
            type: 'error',
            text1: 'Camera error',
            text2: event.message,
          });
        }}
        responsiveOrientationWhenOrientationLocked
        style={StyleSheet.absoluteFill}
      />

      <ThemedView absoluteFillObject contentCenter pointerEvents='none'>
        <LottieView autoPlay loop source={qrScannerAnimation} style={styles.scannerAnimation} />
      </ThemedView>

      <ThemedView absoluteFillObject pointerEvents='box-none'>
        <TopControls top={insets.top} onBack={router.back} />
        <BottomControls bottom={insets.bottom} torchEnabled={torchEnabled} onPickQrImage={handlePickQrImage} onToggleTorch={handleToggleTorch} />
        {scannedValue ? (
          <ScannedValuePanel
            bottom={insets.bottom}
            value={scannedValue}
            onCopy={handleCopyScannedValue}
            onOpen={handleOpenScannedLink}
            onReset={handleResetScan}
          />
        ) : null}
      </ThemedView>
    </ThemedView>
  );
}

function ScannedValuePanel({
  bottom,
  onCopy,
  onOpen,
  onReset,
  value,
}: {
  bottom: number;
  onCopy: () => void;
  onOpen: () => void;
  onReset: () => void;
  value: string;
}) {
  const scannedLink = getScannedLink(value);

  return (
    <ThemedView
      backgroundColor='rgba(5,7,11,0.78)'
      borderColor='rgba(255,255,255,0.14)'
      borderRadius={18}
      borderWidth={1}
      bottom={bottom + mvs(88)}
      gap={12}
      left={16}
      padding={14}
      position='absolute'
      right={16}>
      <ThemedView alignItems='center' flexDirection='row' gap={8}>
        <QrCode color={Palette.accent} size={18} />
        <ThemedText color='#FFFFFF' flex fontFamily={FontFamily.semibold} fontSize={14} lineHeight={20} numberOfLines={1}>
          QR code scanned
        </ThemedText>
      </ThemedView>
      <ThemedText color='rgba(255,255,255,0.82)' fontFamily={FontFamily.medium} fontSize={13} lineHeight={18} numberOfLines={2}>
        {value}
      </ThemedText>
      <ThemedView flexDirection='row' gap={8}>
        <PanelActionButton icon={<Copy color='#FFFFFF' size={16} />} label='Copy' onPress={onCopy} />
        <PanelActionButton disabled={!scannedLink} icon={<ExternalLink color='#FFFFFF' size={16} />} label='Open' onPress={onOpen} />
        <PanelActionButton icon={<RotateCcw color='#FFFFFF' size={16} />} label='Scan' onPress={onReset} />
      </ThemedView>
    </ThemedView>
  );
}

function PanelActionButton({ disabled, icon, label, onPress }: { disabled?: boolean; icon: React.ReactNode; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole='button'
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.panelActionButton, disabled && styles.panelActionButtonDisabled, pressed && styles.pressed]}>
      {icon}
      <ThemedText color='#FFFFFF' fontFamily={FontFamily.semibold} fontSize={12} lineHeight={16}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function TopControls({ onBack, top }: { onBack: () => void; top: number }) {
  return (
    <ThemedView left={15} position='absolute' top={top + 15}>
      <RoundIconButton accessibilityLabel='Back' onPress={onBack}>
        <ChevronLeft color='#FFFFFF' size={26} />
      </RoundIconButton>
    </ThemedView>
  );
}

function BottomControls({
  bottom,
  onPickQrImage,
  onToggleTorch,
  torchEnabled,
}: {
  bottom: number;
  onPickQrImage: () => void;
  onToggleTorch: () => void;
  torchEnabled: boolean;
}) {
  return (
    <ThemedView
      backgroundColor='transparent'
      bottom={bottom + mvs(24)}
      flexDirection='row'
      justifyContent='space-between'
      left={mhs(16)}
      pointerEvents='box-none'
      position='absolute'
      right={mhs(16)}>
      <RoundIconButton accessibilityLabel='Upload QR code image' onPress={onPickQrImage}>
        <QrCode color='#FFFFFF' size={23} />
      </RoundIconButton>
      <RoundIconButton accessibilityLabel='Toggle torch' onPress={onToggleTorch}>
        {torchEnabled ? <Flashlight color='#FFFFFF' size={23} /> : <FlashlightOff color='#FFFFFF' size={23} />}
      </RoundIconButton>
    </ThemedView>
  );
}

function RoundIconButton({ accessibilityLabel, children, onPress }: { accessibilityLabel: string; children: React.ReactNode; onPress?: () => void }) {
  return (
    <Pressable accessibilityLabel={accessibilityLabel} accessibilityRole='button' onPress={onPress} style={styles.roundButton}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  permissionButton: {
    alignItems: 'center',
    backgroundColor: Palette.accent,
    borderRadius: mhs(18),
    justifyContent: 'center',
    marginTop: mvs(20),
    minHeight: mvs(44),
    paddingHorizontal: mhs(18),
  },
  panelActionButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: mhs(14),
    flex: 1,
    flexDirection: 'row',
    gap: mhs(6),
    justifyContent: 'center',
    minHeight: mvs(36),
  },
  panelActionButtonDisabled: {
    opacity: 0.42,
  },
  pressed: {
    opacity: 0.72,
  },
  roundButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: mhs(24),
    height: mhs(48),
    justifyContent: 'center',
    width: mhs(48),
  },
  scannerAnimation: {
    height: SCANNER_ANIMATION_SIZE,
    top: '-5%',
    width: SCANNER_ANIMATION_SIZE,
  },
});
