import { CameraView, scanFromURLAsync, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import { LinearGradient } from 'expo-linear-gradient';
import { useIsFocused, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Camera, CameraOff, Check, ChevronLeft, Copy, ExternalLink, Flashlight, FlashlightOff, Image, QrCode, RotateCcw } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { ThemedText, ThemedView } from 'components/base';
import { QrScannerOverlay } from 'components/media/qr-scanner-overlay';
import { decodeQrCode, fetchQrOutletDetails } from 'features/qr-code/qr-scan-service';
import { FontFamily, Palette } from 'themes';
import { mhs } from 'themes/scaling';

const SHOULD_CHECK_CAMERA_AVAILABILITY = Platform.OS === 'web';
const SCANNER_BACKGROUND = '#080E0C';
const SCANNER_SECONDARY_TEXT = '#B6C2BC';

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
  const { height, width } = useWindowDimensions();
  const lastScannedCode = useRef<string | null>(null);
  const scanLockedRef = useRef(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [isCameraAvailable, setIsCameraAvailable] = useState(!SHOULD_CHECK_CAMERA_AVAILABILITY);
  const [scannedValue, setScannedValue] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const cameraIsActive = isFocused && Boolean(permission?.granted) && isCameraAvailable;
  const effectiveTorchEnabled = cameraIsActive && torchEnabled;
  const scannerSize = Math.min(width - mhs(80), mhs(280), (height - insets.top - insets.bottom) * 0.38);

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

  const handleBarcodeScanned = useCallback(
    (result: BarcodeScanningResult) => {
      if (!result.data || scanLockedRef.current || lastScannedCode.current === result.data) return;

      scanLockedRef.current = true;
      setIsProcessing(true);
      lastScannedCode.current = result.data;
      const qrData = result.data;

      void decodeQrCode(qrData)
        .then(fetchQrOutletDetails)
        .then(details => {
          setScannedValue(qrData);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
          Toast.show({
            type: 'success',
            text1: 'QR code scanned',
            text2: `Opening ${details.station?.name || `station #${details.stationId}`}`,
          });
          router.push({
            pathname: '/station/[stationId]',
            params: {
              chargerKey: `${details.vehicleType}-${details.box.id}`,
              connectorOrder: String(details.connectorOrder),
              stationId: String(details.stationId),
            },
          });
        })
        .catch(error => {
          scanLockedRef.current = false;
          lastScannedCode.current = null;
          setScannedValue(null);
          setIsProcessing(false);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
          Toast.show({
            type: 'error',
            text1: 'QR code scan failed',
            text2: error instanceof Error ? error.message : 'Please try again.',
          });
        });
    },
    [router],
  );

  const handlePickQrImage = useCallback(async () => {
    if (scanLockedRef.current) return;
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
    setIsProcessing(false);
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

  const isBlocked = Boolean(permission && !permission.canAskAgain);

  return (
    <ThemedView flex={1} backgroundColor={SCANNER_BACKGROUND}>
      <StatusBar style='light' />
      {cameraIsActive ? (
        <CameraView
          active={cameraIsActive}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          enableTorch={effectiveTorchEnabled}
          onBarcodeScanned={isProcessing || scannedValue ? undefined : handleBarcodeScanned}
          onMountError={event => {
            Toast.show({
              type: 'error',
              text1: 'Camera error',
              text2: event.message,
            });
          }}
          responsiveOrientationWhenOrientationLocked
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
        />
      ) : null}

      <ThemedView absoluteFillObject pointerEvents='none'>
        <LinearGradient
          colors={['rgba(8,14,12,0.94)', 'rgba(8,14,12,0.36)', 'rgba(8,14,12,0.16)', 'rgba(8,14,12,0.96)']}
          locations={[0, 0.32, 0.56, 1]}
          style={{ flex: 1 }}
        />
      </ThemedView>

      <TopControls onBack={router.back} />

      <ThemedView flex={1} alignItems='center' justifyContent='center' paddingHorizontal={24} gap={28}>
        <ThemedView alignItems='center' gap={10}>
          <ThemedText accessibilityRole='header' color='#FFFFFF' fontFamily={FontFamily.semibold} fontSize={28} lineHeight={36} textAlign='center'>
            Scan charger QR
          </ThemedText>
          <ThemedText color={SCANNER_SECONDARY_TEXT} fontSize={14} lineHeight={21} textAlign='center' maxWidth={290}>
            Place the QR code inside the frame{'\n'}to open charger details.
          </ThemedText>
        </ThemedView>

        <ThemedView alignItems='center' gap={24}>
          <QrScannerOverlay active={cameraIsActive && !isProcessing && !scannedValue} size={scannerSize}>
            {!cameraIsActive ? <CameraAccessPrompt available={isCameraAvailable} blocked={isBlocked} onRequestPermission={requestPermission} /> : null}
          </QrScannerOverlay>

          <ScanStatus active={cameraIsActive} processing={isProcessing} scanned={Boolean(scannedValue)} />
        </ThemedView>
      </ThemedView>

      <ThemedView paddingHorizontal={24} paddingTop={16} safePaddingBottom={24} gap={20}>
        {scannedValue ? (
          <ScannedValuePanel value={scannedValue} onCopy={handleCopyScannedValue} onOpen={handleOpenScannedLink} onReset={handleResetScan} />
        ) : (
          <BottomControls
            disabled={isProcessing}
            torchAvailable={cameraIsActive}
            torchEnabled={effectiveTorchEnabled}
            onPickQrImage={handlePickQrImage}
            onToggleTorch={handleToggleTorch}
          />
        )}
        <ThemedText color={SCANNER_SECONDARY_TEXT} fontSize={12} lineHeight={18} textAlign='center'>
          {scannedValue ? 'Charger details are opening.' : 'Use the flashlight in low light.'}
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

function CameraAccessPrompt({ available, blocked, onRequestPermission }: { available: boolean; blocked: boolean; onRequestPermission: () => void }) {
  return (
    <ThemedView alignItems='center' gap={14} paddingHorizontal={20}>
      <ThemedView round={64} contentCenter backgroundColor='rgba(255,255,255,0.06)'>
        {available ? <Camera color={SCANNER_SECONDARY_TEXT} size={28} /> : <CameraOff color={SCANNER_SECONDARY_TEXT} size={28} />}
      </ThemedView>
      <ThemedText color={SCANNER_SECONDARY_TEXT} fontSize={13} lineHeight={19} textAlign='center'>
        {available ? 'Camera access is needed\nto scan a QR code.' : 'No camera available.\nChoose a QR image below.'}
      </ThemedText>
      {available ? (
        <ScannerButton accent label={blocked ? 'Open Settings' : 'Allow camera'} onPress={blocked ? Linking.openSettings : onRequestPermission} compact />
      ) : null}
    </ThemedView>
  );
}

function ScanStatus({ active, processing, scanned }: { active: boolean; processing: boolean; scanned: boolean }) {
  let label = active ? 'Ready to scan' : 'Scan from a saved photo';
  let icon = <ThemedView round={6} backgroundColor={active ? Palette.accent : SCANNER_SECONDARY_TEXT} />;
  if (processing) {
    label = 'Checking QR code…';
    icon = <ActivityIndicator size='small' color={Palette.accent} />;
  }
  if (scanned) {
    label = 'QR code recognised';
    icon = <Check color={Palette.accent} size={16} />;
  }
  return (
    <ThemedView
      accessibilityLiveRegion='polite'
      rowCenter
      gap={8}
      backgroundColor='rgba(8,14,12,0.72)'
      borderRadius='pill'
      paddingHorizontal={14}
      paddingVertical={9}>
      {icon}
      <ThemedText color={scanned ? Palette.accent : '#E1E8E4'} fontFamily={FontFamily.medium} fontSize={12} lineHeight={17}>
        {label}
      </ThemedText>
    </ThemedView>
  );
}

function ScannedValuePanel({ onCopy, onOpen, onReset, value }: { onCopy: () => void; onOpen: () => void; onReset: () => void; value: string }) {
  const scannedLink = getScannedLink(value);

  return (
    <ThemedView backgroundColor='rgba(255,255,255,0.06)' borderColor='rgba(255,255,255,0.14)' borderRadius={18} borderWidth={1} gap={12} padding={14}>
      <ThemedView alignItems='center' flexDirection='row' gap={8}>
        <QrCode color={Palette.accent} size={18} />
        <ThemedText color='#FFFFFF' flex fontFamily={FontFamily.semibold} fontSize={14} lineHeight={20} numberOfLines={1}>
          QR code scanned
        </ThemedText>
      </ThemedView>
      <ThemedText selectable color='rgba(255,255,255,0.82)' fontFamily={FontFamily.medium} fontSize={13} lineHeight={18} numberOfLines={2}>
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
    <ThemedView flex={1}>
      <ScannerButton disabled={disabled} icon={icon} label={label} onPress={onPress} compact />
    </ThemedView>
  );
}

function TopControls({ onBack }: { onBack: () => void }) {
  return (
    <ThemedView rowCenter justifyContent='space-between' paddingHorizontal={24} safePaddingTop={12} paddingBottom={12}>
      <Pressable accessibilityLabel='Back' accessibilityRole='button' onPress={onBack} hitSlop={8}>
        {({ pressed }) => (
          <ThemedView
            square={48}
            contentCenter
            borderRadius='pill'
            backgroundColor='rgba(255,255,255,0.08)'
            borderWidth={1}
            borderColor='rgba(255,255,255,0.1)'
            opacity={pressed ? 0.6 : 1}>
            <ChevronLeft color='#FFFFFF' size={24} />
          </ThemedView>
        )}
      </Pressable>
      <ThemedView rowCenter gap={7}>
        <QrCode color={Palette.accent} size={17} />
        <ThemedText color='#E1E8E4' fontFamily={FontFamily.semibold} fontSize={12} lineHeight={18} letterSpacing={1.8}>
          EBOOST
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

function BottomControls({
  disabled,
  onPickQrImage,
  onToggleTorch,
  torchAvailable,
  torchEnabled,
}: {
  disabled: boolean;
  onPickQrImage: () => void;
  onToggleTorch: () => void;
  torchAvailable: boolean;
  torchEnabled: boolean;
}) {
  return (
    <ThemedView row gap={12}>
      <ThemedView flex={1}>
        <ScannerButton
          accent={torchEnabled}
          disabled={disabled || !torchAvailable}
          icon={torchEnabled ? <Flashlight color={SCANNER_BACKGROUND} size={20} /> : <FlashlightOff color='#FFFFFF' size={20} />}
          label={torchEnabled ? 'Flashlight on' : 'Flashlight'}
          onPress={onToggleTorch}
          selected={torchEnabled}
        />
      </ThemedView>
      <ThemedView flex={1}>
        <ScannerButton disabled={disabled} icon={<Image color='#FFFFFF' size={20} />} label='Choose image' onPress={onPickQrImage} />
      </ThemedView>
    </ThemedView>
  );
}

function ScannerButton({
  accent = false,
  compact = false,
  disabled = false,
  icon,
  label,
  onPress,
  selected,
}: {
  accent?: boolean;
  compact?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  label: string;
  onPress: () => void;
  selected?: boolean;
}) {
  return (
    <Pressable accessibilityLabel={label} accessibilityRole='button' accessibilityState={{ disabled, selected }} disabled={disabled} onPress={onPress}>
      {({ pressed }) => (
        <ThemedView
          rowCenter
          justifyContent='center'
          gap={9}
          minHeight={compact ? 48 : 58}
          paddingHorizontal={compact ? 14 : 12}
          paddingVertical={12}
          borderRadius={18}
          borderCurve='continuous'
          borderWidth={1}
          borderColor={accent ? Palette.accent : 'rgba(255,255,255,0.14)'}
          backgroundColor={accent ? Palette.accent : 'rgba(255,255,255,0.08)'}
          opacity={disabled ? 0.4 : pressed ? 0.65 : 1}>
          {icon}
          <ThemedText
            flexShrink={1}
            color={accent ? SCANNER_BACKGROUND : '#FFFFFF'}
            fontFamily={FontFamily.semibold}
            fontSize={compact ? 12 : 13}
            lineHeight={19}
            textAlign='center'>
            {label}
          </ThemedText>
        </ThemedView>
      )}
    </Pressable>
  );
}
