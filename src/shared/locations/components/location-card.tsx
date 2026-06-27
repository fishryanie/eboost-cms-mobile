import { mhs } from 'themes/scaling';
import { Image } from 'expo-image';
import { Bike, Car, Fuel, Upload, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { ThemedText, ThemedView } from 'components/base';

import { FontFamily, Palette } from 'themes';
import { ImagePreviewModal } from 'components/media/image-preview-modal';
import { getDisplayImageUrl } from 'utils/media/image-url';

const AnimatedThemedView = Animated.createAnimatedComponent(ThemedView);
const AnimatedThemedText = Animated.createAnimatedComponent(ThemedText);

const ACTION_WIDTH = 144;
const ACTION_TRIGGER = ACTION_WIDTH * 0.4;
const THUMB_SIZE = 50;

function getLocationImage(location: LocationRecord) {
  return getDisplayImageUrl(
    location.images?.[0]?.url || location.image_url || location.imageUrl || location.thumbnailUrl || location.photoUrl || location.image,
  );
}

function getLocationAddress(location: LocationRecord) {
  return location.displayAddress || location.address || `Location #${location.id}`;
}

function getStatusState(status: string, visible?: boolean) {
  const normalized = status.toLowerCase();

  if (visible === false || normalized.includes('terminated') || normalized.includes('deleted')) {
    return { color: '#DD3B4A', label: status };
  }

  return { color: '#079A13', label: status || 'Operating' };
}

function getCount(location: LocationRecord, key: 'bikeCount' | 'carCount' | 'stationCount') {
  if (key === 'bikeCount') return location.bikeCount ?? location.numberOfBikeBoxes ?? 0;
  if (key === 'carCount') return location.carCount ?? location.numberOfCarBoxes ?? 0;
  return location.stationCount ?? location.numberOfStations ?? 0;
}

export function LocationCard({
  location,
  onEdit,
  onPress,
  onRelocate,
  onUploadImage,
}: {
  location: LocationRecord;
  onEdit: () => void;
  onPress: () => void;
  onRelocate: () => void;
  onUploadImage: () => void;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const status = location.operationStatus?.label || 'Unknown';
  const statusState = getStatusState(status, location.visible);
  const imageUrl = getLocationImage(location);
  const address = getLocationAddress(location);
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);

  const closeActions = () => {
    translateX.set(withTiming(0, { duration: 180 }));
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-8, 8])
    .onBegin(() => {
      startX.set(translateX.get());
    })
    .onUpdate(event => {
      const next = startX.get() + event.translationX;
      translateX.set(Math.min(0, Math.max(-ACTION_WIDTH, next)));
    })
    .onEnd(event => {
      const shouldOpen = translateX.get() < -ACTION_TRIGGER || event.velocityX < -420;
      translateX.set(
        withSpring(shouldOpen ? -ACTION_WIDTH : 0, {
          damping: 18,
          stiffness: 220,
        }),
      );
    });

  const foregroundStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.get() }],
  }));

  const actionStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.abs(translateX.get()) / ACTION_WIDTH + 0.15),
  }));

  return (
    <ThemedView backgroundColor={Palette.surfaceBase} overflow='hidden'>
      <AnimatedThemedView style={[styles.actionsRail, actionStyle]}>
        <Pressable
          onPress={() => {
            closeActions();
            onRelocate();
          }}
          style={({ pressed }) => [styles.actionButton, styles.relocateAction, pressed && styles.actionPressed]}>
          <ThemedText color='#071C12' fontFamily={FontFamily.medium} fontSize={14} lineHeight={18}>
            Relocate
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={() => {
            closeActions();
            onEdit();
          }}
          style={({ pressed }) => [styles.actionButton, styles.editAction, pressed && styles.actionPressed]}>
          <ThemedText style={[styles.actionText, styles.editActionText]}>Edit</ThemedText>
        </Pressable>
      </AnimatedThemedView>

      <GestureDetector gesture={pan}>
        <AnimatedThemedView style={[styles.foreground, foregroundStyle]}>
          <Pressable
            onPress={() => {
              closeActions();
              onPress();
            }}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
            <ThemedView height={THUMB_SIZE} width={THUMB_SIZE}>
              {imageUrl ? (
                <Pressable
                  accessibilityLabel={`Open image for ${location.name}`}
                  onPress={event => {
                    event.stopPropagation();
                    closeActions();
                    setPreviewOpen(true);
                  }}>
                  <Image contentFit='cover' source={{ uri: imageUrl }} style={styles.thumbnailImage} />
                </Pressable>
              ) : (
                <Pressable
                  accessibilityLabel={`Upload image for ${location.name}`}
                  disabled={false}
                  onPress={event => {
                    event.stopPropagation();
                    closeActions();
                    onUploadImage();
                  }}
                  style={({ pressed }) => [styles.uploadPlaceholder, pressed && styles.uploadPlaceholderPressed]}>
                  <Upload color='#A6B5C8' size={18} />
                  <ThemedText
                    numberOfLines={1}
                    color={Palette.textSecondary}
                    fontFamily={FontFamily.semibold}
                    fontSize={9}
                    lineHeight={11}
                    marginTop={2}
                    maxWidth={THUMB_SIZE - 6}>
                    Upload
                  </ThemedText>
                </Pressable>
              )}
            </ThemedView>

            <ThemedView flex={1} gap={1} justifyContent='center' minWidth={0}>
              <ThemedView alignItems='center' flexDirection='row' gap={'two'}>
                <CountPill icon={Bike} label={`${getCount(location, 'bikeCount')} bikes`} />
                <CountPill icon={Car} label={`${getCount(location, 'carCount')} cars`} />
                <CountPill icon={Fuel} label={`${getCount(location, 'stationCount')} stations`} />
              </ThemedView>
              <ThemedText numberOfLines={1} color='#202124' fontFamily={FontFamily.semibold} fontSize={15} lineHeight={20}>
                {location.name}
              </ThemedText>
              <ThemedText numberOfLines={1} color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={12} lineHeight={16}>
                {address}
              </ThemedText>
            </ThemedView>

            <ThemedView alignItems='flex-end' alignSelf='stretch' justifyContent='space-between' paddingVertical={3} width={76}>
              <ThemedView style={[styles.statusBubble, { backgroundColor: statusState.color }]}>
                <ThemedText numberOfLines={1} color='#FFFFFF' fontFamily={FontFamily.medium} fontSize={10} lineHeight={13}>
                  {statusState.label}
                </ThemedText>
              </ThemedView>
              <ThemedView style={[styles.toggle, location.visible === false && styles.toggleOff]}>
                <ThemedView style={[styles.toggleKnob, location.visible === false && styles.toggleKnobOff]} />
              </ThemedView>
            </ThemedView>
            <ImagePreviewModal imageUrl={imageUrl} onClose={() => setPreviewOpen(false)} title={location.name} visible={previewOpen} />
          </Pressable>
        </AnimatedThemedView>
      </GestureDetector>
    </ThemedView>
  );
}

function CountPill({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <ThemedView alignItems='center' flexDirection='row' gap={3} maxWidth={76}>
      <Icon color='#8E8E93' size={11} />
      <ThemedText numberOfLines={1} color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={11} lineHeight={14}>
        {label}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    alignSelf: 'stretch',
    justifyContent: 'center',
    width: ACTION_WIDTH / 2,
  },
  actionPressed: {
    opacity: 0.75,
  },
  actionsRail: {
    bottom: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    position: 'absolute',
    right: 0,
    top: 0,
    width: ACTION_WIDTH,
  },
  actionText: {
    color: '#071C12',
    fontFamily: FontFamily.medium,
    fontSize: 14,
    lineHeight: 18,
  },
  editAction: {
    backgroundColor: '#FFAA0A',
  },
  editActionText: {
    color: '#241600',
  },
  foreground: {
    backgroundColor: Palette.surfaceBase,
  },
  pressed: {
    backgroundColor: '#F7F8FA',
  },
  relocateAction: {
    backgroundColor: '#05AE51',
  },
  row: {
    alignItems: 'center',
    backgroundColor: Palette.surfaceBase,
    borderBottomColor: '#E9ECEF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: mhs(8),
    minHeight: 82,
    paddingLeft: mhs(12),
    paddingRight: mhs(12),
    paddingVertical: mhs(8),
  },
  statusBubble: {
    alignItems: 'center',
    borderRadius: mhs(12),
    maxWidth: 82,
    minWidth: 62,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  thumbnailImage: {
    borderRadius: mhs(16),
    height: THUMB_SIZE,
    width: THUMB_SIZE,
  },
  toggle: {
    alignItems: 'flex-end',
    backgroundColor: '#04B05A',
    borderRadius: 999,
    height: 20,
    justifyContent: 'center',
    paddingHorizontal: 2,
    width: 38,
  },
  toggleKnob: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.18)',
    height: 16,
    width: 16,
  },
  toggleKnobOff: {
    alignSelf: 'flex-start',
  },
  toggleOff: {
    backgroundColor: '#C9C9CC',
  },
  uploadPlaceholder: {
    alignItems: 'center',
    borderColor: '#D4DFEC',
    borderRadius: mhs(16),
    borderStyle: 'dashed',
    borderWidth: 1.5,
    height: THUMB_SIZE,
    justifyContent: 'center',
    width: THUMB_SIZE,
  },
  uploadPlaceholderPressed: {
    backgroundColor: Palette.surfaceMuted,
    borderColor: Palette.accent,
  },
});
