import { CameraView, useCameraPermissions, type BarcodeScanningResult, type CameraCapturedPicture, type CameraType } from 'expo-camera';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { useIsFocused, useRouter } from 'expo-router';
import { Camera, CameraOff, ChevronLeft, Copy, ExternalLink, Flashlight, FlashlightOff, QrCode, RotateCcw, Settings, SwitchCamera } from 'lucide-react-native';
import LottieView from 'lottie-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { ThemedText, ThemedView } from 'components/base';
import { FontFamily, Palette } from 'themes';
import { mhs, mvs, width } from 'themes/scaling';

import qrScannerAnimation from 'assets/lotties/scan-qr-code.json';

const MAX_ZOOM = 1;
const MIN_ZOOM = 0;
const ZOOM_STEP = 0.04;
const CAPTURE_BUTTON_SIZE = 78;
const SCANNER_ANIMATION_SIZE = Math.min(width - mhs(32), mhs(340));
const SHOULD_CHECK_CAMERA_AVAILABILITY = Platform.OS === 'web';

const clampZoom = (value: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
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
  const cameraRef = useRef<CameraView>(null);
  const lastScannedCode = useRef<string | null>(null);
  const scanLockedRef = useRef(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [zoom, setZoom] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [isCameraAvailable, setIsCameraAvailable] = useState(!SHOULD_CHECK_CAMERA_AVAILABILITY);
  const [scannedValue, setScannedValue] = useState<string | null>(null);

  const pinchStartZoom = useSharedValue(0);
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

  const updateZoom = useCallback((nextZoom: number) => {
    setZoom(clampZoom(nextZoom));
  }, []);

  const pinchGesture = Gesture.Pinch()
    .runOnJS(true)
    .onBegin(() => {
      pinchStartZoom.value = zoom;
    })
    .onUpdate(event => {
      updateZoom(pinchStartZoom.value + (event.scale - 1) * 0.35);
    });

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

  const handleTakePhoto = useCallback(async () => {
    if (!cameraReady || !cameraRef.current) return;

    try {
      const photo: CameraCapturedPicture = await cameraRef.current.takePictureAsync({
        quality: 1,
        shutterSound: false,
      });

      Toast.show({
        type: 'success',
        text1: 'Photo captured',
        text2: photo.uri,
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Cannot take photo',
        text2: error instanceof Error ? error.message : 'Please try again.',
      });
    }
  }, [cameraReady]);

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

  const handleFlipCamera = useCallback(() => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
    setTorchEnabled(false);
  }, []);

  const handleToggleTorch = useCallback(() => {
    setTorchEnabled(current => !current);
  }, []);

  const nudgeZoomIn = useCallback(() => {
    updateZoom(zoom + ZOOM_STEP);
  }, [updateZoom, zoom]);

  const nudgeZoomOut = useCallback(() => {
    updateZoom(zoom - ZOOM_STEP);
  }, [updateZoom, zoom]);

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
      <GestureDetector gesture={pinchGesture}>
        <ThemedView flex={1}>
          <CameraView
            ref={cameraRef}
            active={cameraIsActive}
            animateShutter={false}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            enableTorch={effectiveTorchEnabled}
            facing={facing}
            flash={effectiveTorchEnabled ? 'on' : 'off'}
            mode='picture'
            onBarcodeScanned={scannedValue ? undefined : handleBarcodeScanned}
            onCameraReady={() => setCameraReady(true)}
            onMountError={event => {
              Toast.show({
                type: 'error',
                text1: 'Camera error',
                text2: event.message,
              });
            }}
            responsiveOrientationWhenOrientationLocked
            style={StyleSheet.absoluteFill}
            zoom={zoom}
          />

          <ThemedView absoluteFillObject contentCenter pointerEvents='none'>
            <LottieView autoPlay loop source={qrScannerAnimation} style={styles.scannerAnimation} />
          </ThemedView>

          <ThemedView absoluteFillObject pointerEvents='box-none'>
            <TopControls top={insets.top} onBack={router.back} />
            <SideControls
              top={insets.top}
              torchEnabled={torchEnabled}
              zoom={zoom}
              onFlipCamera={handleFlipCamera}
              onToggleTorch={handleToggleTorch}
              onZoomIn={nudgeZoomIn}
              onZoomOut={nudgeZoomOut}
            />
            {scannedValue ? (
              <ScannedValuePanel
                bottom={insets.bottom}
                value={scannedValue}
                onCopy={handleCopyScannedValue}
                onOpen={handleOpenScannedLink}
                onReset={handleResetScan}
              />
            ) : null}
            <CaptureButton
              bottom={insets.bottom}
              disabled={!cameraReady || !cameraIsActive}
              zoom={zoom}
              onCapture={handleTakePhoto}
              onZoomChange={updateZoom}
            />
          </ThemedView>
        </ThemedView>
      </GestureDetector>
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
      bottom={bottom + 124}
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

function SideControls({
  onFlipCamera,
  onToggleTorch,
  onZoomIn,
  onZoomOut,
  torchEnabled,
  top,
  zoom,
}: {
  onFlipCamera: () => void;
  onToggleTorch: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  torchEnabled: boolean;
  top: number;
  zoom: number;
}) {
  return (
    <ThemedView gap={12} position='absolute' right={15} top={top + 15}>
      <RoundIconButton accessibilityLabel='Flip camera' onPress={onFlipCamera}>
        <SwitchCamera color='#FFFFFF' size={24} />
      </RoundIconButton>
      <RoundIconButton accessibilityLabel='Toggle torch' onPress={onToggleTorch}>
        {torchEnabled ? <Flashlight color='#FFFFFF' size={23} /> : <FlashlightOff color='#FFFFFF' size={23} />}
      </RoundIconButton>
      <RoundIconButton accessibilityLabel='Zoom in' onPress={onZoomIn}>
        <ThemedText color='#FFFFFF' fontFamily={FontFamily.bold} fontSize={18} lineHeight={22}>
          +
        </ThemedText>
      </RoundIconButton>
      <RoundIconButton accessibilityLabel='Zoom out' onPress={onZoomOut}>
        <ThemedText color='#FFFFFF' fontFamily={FontFamily.bold} fontSize={20} lineHeight={22}>
          -
        </ThemedText>
      </RoundIconButton>
      <ThemedView backgroundColor='rgba(0,0,0,0.4)' contentCenter round={40}>
        <ThemedText color='#FFFFFF' fontFamily={FontFamily.bold} fontSize={11} lineHeight={13} textAlign='center'>
          {`${Math.round(zoom * 100)}\nZOOM`}
        </ThemedText>
      </ThemedView>
      <RoundIconButton accessibilityLabel='Camera settings'>
        <Settings color='#FFFFFF' size={23} />
      </RoundIconButton>
      <RoundIconButton accessibilityLabel='QR scanner'>
        <QrCode color='#FFFFFF' size={23} />
      </RoundIconButton>
    </ThemedView>
  );
}

function CaptureButton({
  bottom,
  disabled,
  onCapture,
  onZoomChange,
  zoom,
}: {
  bottom: number;
  disabled: boolean;
  onCapture: () => void;
  onZoomChange: (zoom: number) => void;
  zoom: number;
}) {
  const isPressing = useSharedValue(false);
  const dragStartZoom = useSharedValue(0);
  const buttonStyle = useAnimatedStyle(() => ({
    opacity: withTiming(disabled ? 0.35 : 1, { duration: 120 }),
    transform: [{ scale: withSpring(isPressing.value ? 0.94 : 1) }],
  }));

  const panGesture = Gesture.Pan()
    .runOnJS(true)
    .onBegin(() => {
      isPressing.value = true;
      dragStartZoom.value = zoom;
    })
    .onUpdate(event => {
      onZoomChange(dragStartZoom.value + Math.max(0, -event.translationY) / 280);
    })
    .onFinalize(() => {
      isPressing.value = false;
    });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.captureButtonWrap, { bottom: bottom + mvs(32) }, buttonStyle]}>
        <Pressable accessibilityLabel='Take photo' accessibilityRole='button' disabled={disabled} onPress={onCapture} style={styles.captureButton}>
          <ThemedView
            backgroundColor='transparent'
            borderColor='#FFFFFF'
            borderRadius={CAPTURE_BUTTON_SIZE / 2}
            borderWidth={8}
            height={CAPTURE_BUTTON_SIZE}
            width={CAPTURE_BUTTON_SIZE}
          />
        </Pressable>
      </Animated.View>
    </GestureDetector>
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
  captureButton: {
    alignItems: 'center',
    height: mhs(CAPTURE_BUTTON_SIZE),
    justifyContent: 'center',
    width: mhs(CAPTURE_BUTTON_SIZE),
  },
  captureButtonWrap: {
    alignSelf: 'center',
    position: 'absolute',
  },
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
    borderRadius: mhs(20),
    height: mhs(40),
    justifyContent: 'center',
    width: mhs(40),
  },
  scannerAnimation: {
    height: SCANNER_ANIMATION_SIZE,
    top: '-5%',
    width: SCANNER_ANIMATION_SIZE,
  },
});
