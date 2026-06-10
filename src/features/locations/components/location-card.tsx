import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { FontFamily, Palette, Radius, Spacing } from 'themes';
import { ImagePreviewModal } from 'shared/media/image-preview-modal';
import { getDisplayImageUrl } from 'shared/media/image-url';

import type { LocationRecord } from '../types';

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
    <View style={styles.swipeContainer}>
      <Animated.View style={[styles.actionsRail, actionStyle]}>
        <Pressable
          onPress={() => {
            closeActions();
            onRelocate();
          }}
          style={({ pressed }) => [styles.actionButton, styles.relocateAction, pressed && styles.actionPressed]}>
          <Text style={styles.actionText}>Relocate</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            closeActions();
            onEdit();
          }}
          style={({ pressed }) => [styles.actionButton, styles.editAction, pressed && styles.actionPressed]}>
          <Text style={[styles.actionText, styles.editActionText]}>Edit</Text>
        </Pressable>
      </Animated.View>

      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.foreground, foregroundStyle]}>
          <Pressable
            onPress={() => {
              closeActions();
              onPress();
            }}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
            <View style={styles.thumbnail}>
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
                  <SymbolView name='square.and.arrow.up' resizeMode='scaleAspectFit' size={18} tintColor='#A6B5C8' />
                  <Text numberOfLines={1} style={styles.uploadText}>
                    Upload
                  </Text>
                </Pressable>
              )}
            </View>

            <View style={styles.main}>
              <View style={styles.statsRow}>
                <CountPill icon='bicycle' label={`${getCount(location, 'bikeCount')} bikes`} />
                <CountPill icon='car.fill' label={`${getCount(location, 'carCount')} cars`} />
                <CountPill icon='fuelpump.fill' label={`${getCount(location, 'stationCount')} stations`} />
              </View>
              <Text numberOfLines={1} style={styles.title}>
                {location.name}
              </Text>
              <Text numberOfLines={1} style={styles.address}>
                {address}
              </Text>
            </View>

            <View style={styles.trailing}>
              <View style={[styles.statusBubble, { backgroundColor: statusState.color }]}>
                <Text numberOfLines={1} style={styles.statusText}>
                  {statusState.label}
                </Text>
              </View>
              <View style={[styles.toggle, location.visible === false && styles.toggleOff]}>
                <View style={[styles.toggleKnob, location.visible === false && styles.toggleKnobOff]} />
              </View>
            </View>
            <ImagePreviewModal imageUrl={imageUrl} onClose={() => setPreviewOpen(false)} title={location.name} visible={previewOpen} />
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

function CountPill({ icon, label }: { icon: 'bicycle' | 'car.fill' | 'fuelpump.fill'; label: string }) {
  return (
    <View style={styles.countPill}>
      <SymbolView name={icon} resizeMode='scaleAspectFit' size={11} tintColor='#8E8E93' />
      <Text numberOfLines={1} style={styles.countText}>
        {label}
      </Text>
    </View>
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
  address: {
    color: Palette.textSecondary,
    fontFamily: FontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  countPill: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
    maxWidth: 76,
  },
  countText: {
    color: Palette.textSecondary,
    fontFamily: FontFamily.medium,
    fontSize: 11,
    lineHeight: 14,
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
  main: {
    flex: 1,
    gap: 1,
    justifyContent: 'center',
    minWidth: 0,
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
    gap: Spacing.two,
    minHeight: 82,
    paddingLeft: Spacing.three,
    paddingRight: Spacing.three,
    paddingVertical: Spacing.two,
  },
  statsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
  },
  statusBubble: {
    alignItems: 'center',
    borderRadius: Radius.small,
    maxWidth: 82,
    minWidth: 62,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusText: {
    color: '#FFFFFF',
    fontFamily: FontFamily.medium,
    fontSize: 10,
    lineHeight: 13,
  },
  swipeContainer: {
    backgroundColor: Palette.surfaceBase,
    overflow: 'hidden',
  },
  thumbnail: {
    height: THUMB_SIZE,
    width: THUMB_SIZE,
  },
  thumbnailImage: {
    borderRadius: Radius.medium,
    height: THUMB_SIZE,
    width: THUMB_SIZE,
  },
  title: {
    color: '#202124',
    fontFamily: FontFamily.semibold,
    fontSize: 15,
    lineHeight: 20,
  },
  toggle: {
    alignItems: 'flex-end',
    backgroundColor: '#04B05A',
    borderRadius: Radius.pill,
    height: 20,
    justifyContent: 'center',
    paddingHorizontal: 2,
    width: 38,
  },
  toggleKnob: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.pill,
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
  trailing: {
    alignItems: 'flex-end',
    alignSelf: 'stretch',
    justifyContent: 'space-between',
    paddingVertical: 3,
    width: 76,
  },
  uploadPlaceholder: {
    alignItems: 'center',
    borderColor: '#D4DFEC',
    borderRadius: Radius.medium,
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
  uploadText: {
    color: Palette.textSecondary,
    fontFamily: FontFamily.semibold,
    fontSize: 9,
    lineHeight: 11,
    marginTop: 2,
    maxWidth: THUMB_SIZE - 6,
  },
});
