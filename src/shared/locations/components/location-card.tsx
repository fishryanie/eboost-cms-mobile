import { Image } from 'expo-image';
import { Bike, Building2, Car, MapPin, Pencil, RadioTower, Upload } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Pressable as NativePressable, StyleSheet } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import ReanimatedSwipeable, { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { ThemedText, ThemedView } from 'components/base';

import { ImagePreviewModal } from 'components/media/image-preview-modal';
import { FontFamily, Palette } from 'themes';
import { mhs } from 'themes/scaling';
import { getDisplayImageUrl } from 'utils/media/image-url';

import { getLocationStatusTheme } from '../location-status';

const ACTION_WIDTH = 84;
const ACTIONS_WIDTH = ACTION_WIDTH * 2;
const ACTION_TRIGGER = ACTION_WIDTH * 0.6;
const THUMB_SIZE = 64;

function getLocationImage(location: LocationRecord) {
  return getDisplayImageUrl(
    location.images?.[0]?.url || location.image_url || location.imageUrl || location.thumbnailUrl || location.photoUrl || location.image,
  );
}

function getLocationAddress(location: LocationRecord) {
  const baseAddress = location.displayAddress || location.address || location.addressVn || '';
  const parts = baseAddress
    .split(',')
    .map(part => part.trim())
    .filter(Boolean);
  const administrativeParts = [location.ward?.name || location.ward?.nameVn, location.ward?.province?.name || location.ward?.province?.nameVn].filter(
    (part): part is string => Boolean(part?.trim()),
  );

  administrativeParts.forEach(part => {
    const candidate = part.trim();
    const candidateKey = candidate.toLocaleLowerCase().replace(/[^a-z0-9à-ỹđ]/g, '');
    const duplicateIndex = parts.findIndex(current => current.toLocaleLowerCase().replace(/[^a-z0-9à-ỹđ]/g, '') === candidateKey);

    if (duplicateIndex === -1) {
      parts.push(candidate);
    } else if (candidate.length > parts[duplicateIndex].length) {
      parts[duplicateIndex] = candidate;
    }
  });

  return parts.join(', ') || `Location #${location.id}`;
}

function getLocationCode(location: LocationRecord) {
  return location.locationCode?.trim() || location.location_code?.trim() || `EVM-${String(location.id).padStart(4, '0')}`;
}

function formatLocationName(name: string) {
  const lettersOnly = name.replace(/[^A-Za-zÀ-ỹĐđ]/g, '');
  if (!lettersOnly || lettersOnly !== lettersOnly.toUpperCase()) return name;

  return name
    .split(/(\s+|-|\/)/)
    .map(part => {
      if (!part.trim() || part === '-' || part === '/') return part;
      if (/\d/.test(part) || part.length <= 2) return part.toUpperCase();
      return `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`;
    })
    .join('');
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
  const statusTheme = getLocationStatusTheme(location);
  const imageUrl = getLocationImage(location);
  const address = getLocationAddress(location);
  const locationCode = getLocationCode(location);
  const stationCount = location.stationCount ?? location.numberOfStations ?? 0;
  const carCount = location.carCount ?? location.numberOfCarBoxes ?? 0;
  const bikeCount = location.bikeCount ?? location.numberOfBikeBoxes ?? 0;
  const displayName = formatLocationName(location.name);
  const swipeableRef = useRef<SwipeableMethods>(null);

  const closeActions = () => {
    swipeableRef.current?.close();
  };

  return (
    <ThemedView backgroundColor={Palette.surfaceBase} overflow='hidden'>
      <ReanimatedSwipeable
        friction={2}
        overshootRight={false}
        ref={swipeableRef}
        renderRightActions={() => (
          <ThemedView alignSelf='stretch' flexDirection='row' height='100%' width={ACTIONS_WIDTH}>
            <Pressable
              accessibilityLabel={`Relocate ${location.name}`}
              accessibilityRole='button'
              onPress={() => {
                closeActions();
                onRelocate();
              }}
              style={({ pressed }) => [styles.actionButton, styles.relocateAction, pressed && styles.actionPressed]}>
              <ThemedView alignItems='center' backgroundColor='transparent' gap={7} justifyContent='center'>
                <MapPin color='#FFFFFF' size={20} strokeWidth={2.1} />
                <ThemedText color='#FFFFFF' fontFamily={FontFamily.semibold} fontSize={12} lineHeight={16}>
                  Relocate
                </ThemedText>
              </ThemedView>
            </Pressable>
            <Pressable
              accessibilityLabel={`Edit ${location.name}`}
              accessibilityRole='button'
              onPress={() => {
                closeActions();
                onEdit();
              }}
              style={({ pressed }) => [styles.actionButton, styles.editAction, pressed && styles.actionPressed]}>
              <ThemedView alignItems='center' backgroundColor='transparent' gap={7} justifyContent='center'>
                <Pencil color='#FFFFFF' size={20} strokeWidth={2.1} />
                <ThemedText color='#FFFFFF' fontFamily={FontFamily.semibold} fontSize={12} lineHeight={16}>
                  Edit
                </ThemedText>
              </ThemedView>
            </Pressable>
          </ThemedView>
        )}
        rightThreshold={ACTION_TRIGGER}>
        <NativePressable
          accessibilityLabel={`${location.name}, ${statusTheme.label}, ${stationCount} stations, ${carCount} cars, ${bikeCount} bikes, ${address}`}
          accessibilityRole='button'
          onPress={() => {
            closeActions();
            onPress();
          }}
          style={({ pressed }) => [styles.foreground, pressed && styles.pressed]}>
          <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={12} minHeight={104} paddingLeft={12}>
            <ThemedView backgroundColor='transparent' height={THUMB_SIZE} width={THUMB_SIZE}>
              {imageUrl ? (
                <NativePressable
                  accessibilityLabel={`Open image for ${location.name}`}
                  accessibilityRole='imagebutton'
                  onPress={event => {
                    event.stopPropagation();
                    closeActions();
                    setPreviewOpen(true);
                  }}>
                  <Image accessibilityLabel={location.name} contentFit='cover' source={{ uri: imageUrl }} style={styles.thumbnailImage} transition={150} />
                </NativePressable>
              ) : (
                <ThemedView
                  alignItems='center'
                  backgroundColor={statusTheme.tone}
                  borderColor={statusTheme.border}
                  borderCurve='continuous'
                  borderRadius={16}
                  borderWidth={1}
                  height={THUMB_SIZE}
                  justifyContent='center'
                  overflow='hidden'
                  width={THUMB_SIZE}>
                  <NativePressable
                    accessibilityLabel={`Upload image for ${location.name}`}
                    accessibilityRole='button'
                    onPress={event => {
                      event.stopPropagation();
                      closeActions();
                      onUploadImage();
                    }}
                    style={({ pressed }) => [styles.uploadButton, pressed && styles.uploadButtonPressed]}>
                    <Building2 color={statusTheme.accent} size={25} strokeWidth={1.8} />
                    <ThemedView
                      alignItems='center'
                      backgroundColor={statusTheme.accent}
                      borderColor='#FFFFFF'
                      borderRadius={'pill'}
                      borderWidth={2}
                      bottom={4}
                      height={20}
                      justifyContent='center'
                      position='absolute'
                      right={4}
                      width={20}>
                      <Upload color='#FFFFFF' size={10} strokeWidth={2.6} />
                    </ThemedView>
                  </NativePressable>
                </ThemedView>
              )}
            </ThemedView>

            <ThemedView
              backgroundColor='transparent'
              borderBottomColor='#E6EAE8'
              borderBottomWidth={StyleSheet.hairlineWidth}
              flex={1}
              gap={6}
              justifyContent='center'
              minHeight={104}
              minWidth={0}
              paddingRight={12}
              paddingVertical={10}>
              <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={8} justifyContent='space-between'>
                <ThemedView alignItems='center' backgroundColor='transparent' flex={1} flexDirection='row' gap={8} minWidth={0}>
                  <ThemedText color='#365C91' fontFamily={FontFamily.semibold} fontSize={9} letterSpacing={0.7} lineHeight={12} numberOfLines={1}>
                    {locationCode}
                  </ThemedText>
                  <InlineMetric icon={RadioTower} value={stationCount} />
                  <InlineMetric icon={Car} value={carCount} />
                  <InlineMetric icon={Bike} value={bikeCount} />
                </ThemedView>
                <ThemedView
                  alignItems='center'
                  backgroundColor={statusTheme.accent}
                  borderRadius={'pill'}
                  justifyContent='center'
                  minHeight={22}
                  paddingHorizontal={8}>
                  <ThemedText color='#FFFFFF' fontFamily={FontFamily.semibold} fontSize={9} lineHeight={12} numberOfLines={1}>
                    {statusTheme.label}
                  </ThemedText>
                </ThemedView>
              </ThemedView>

              <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={15} lineHeight={20} numberOfLines={2}>
                {displayName}
              </ThemedText>

              <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row'>
                <ThemedText color={Palette.textSecondary} flex={1} fontFamily={FontFamily.regular} fontSize={11} lineHeight={15}>
                  {address}
                </ThemedText>
              </ThemedView>
            </ThemedView>
          </ThemedView>
        </NativePressable>
      </ReanimatedSwipeable>
      <ImagePreviewModal imageUrl={imageUrl} onClose={() => setPreviewOpen(false)} title={location.name} visible={previewOpen} />
    </ThemedView>
  );
}

function InlineMetric({ icon: Icon, value }: { icon: typeof Bike; value: number }) {
  return (
    <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={3}>
      <Icon color={Palette.textTertiary} size={11} strokeWidth={1.9} />
      <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={9} lineHeight={12}>
        {value}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    alignSelf: 'stretch',
    height: '100%',
    justifyContent: 'center',
    width: ACTION_WIDTH,
  },
  actionPressed: {
    opacity: 0.75,
  },
  foreground: {
    backgroundColor: Palette.surfaceBase,
  },
  editAction: {
    backgroundColor: '#1677E8',
  },
  pressed: {
    backgroundColor: '#F7F8FA',
  },
  relocateAction: {
    backgroundColor: '#05AE51',
  },
  thumbnailImage: {
    borderRadius: mhs(16),
    height: THUMB_SIZE,
    width: THUMB_SIZE,
  },
  uploadButton: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  uploadButtonPressed: {
    opacity: 0.7,
  },
});
