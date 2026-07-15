import * as Location from 'expo-location';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LocateFixed, MapPin } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet } from 'react-native';
import MapView, { type Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomButton, ThemedText, ThemedView } from 'components/base';
import { FontFamily, Palette } from 'themes';

import { useRelocateLocationDraftStore } from '../relocate-location-draft-store';

const DEFAULT_COORDINATES = { latitude: 10.7769, longitude: 106.7009 };
const INITIAL_DELTA = 0.008;

type MapCoordinates = {
  latitude: number;
  longitude: number;
};

function parseCoordinate(value: string | string[] | undefined, fallback: number) {
  const parsed = Number(Array.isArray(value) ? value[0] : value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatAddress(address?: Location.LocationGeocodedAddress) {
  if (!address) return 'Address unavailable for this point';
  if (address.formattedAddress) return address.formattedAddress;

  const street = [address.streetNumber, address.street].filter(Boolean).join(' ');
  return (
    [...new Set([address.name, street, address.district, address.city, address.region].filter((part): part is string => Boolean(part?.trim())))]
      .join(', ')
      .trim() || 'Address unavailable for this point'
  );
}

export function LocationMapPickerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ latitude?: string; locationId?: string; longitude?: string }>();
  const { bottom } = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const geocodeRequestRef = useRef(0);
  const setDraftCoordinates = useRelocateLocationDraftStore(state => state.setCoordinates);
  const [initialCoordinates] = useState<MapCoordinates>(() => ({
    latitude: parseCoordinate(params.latitude, DEFAULT_COORDINATES.latitude),
    longitude: parseCoordinate(params.longitude, DEFAULT_COORDINATES.longitude),
  }));
  const [coordinates, setCoordinates] = useState(initialCoordinates);
  const [address, setAddress] = useState('Move the map to choose a precise point');
  const [locating, setLocating] = useState(false);
  const [resolvingAddress, setResolvingAddress] = useState(false);

  async function resolveAddress(nextCoordinates: MapCoordinates) {
    const requestId = ++geocodeRequestRef.current;
    setResolvingAddress(true);

    try {
      if (process.env.EXPO_OS === 'android') {
        const permission = await Location.getForegroundPermissionsAsync();
        if (!permission.granted) {
          if (requestId === geocodeRequestRef.current) setAddress('Coordinates selected — confirm or use GPS for an address preview');
          return;
        }
      }

      const [result] = await Location.reverseGeocodeAsync(nextCoordinates);
      if (requestId === geocodeRequestRef.current) setAddress(formatAddress(result));
    } catch {
      if (requestId === geocodeRequestRef.current) setAddress('Address unavailable for this point');
    } finally {
      if (requestId === geocodeRequestRef.current) setResolvingAddress(false);
    }
  }

  function handleRegionChangeComplete(region: Region) {
    const nextCoordinates = { latitude: region.latitude, longitude: region.longitude };
    setCoordinates(nextCoordinates);
    void resolveAddress(nextCoordinates);
  }

  async function handleUseCurrentLocation() {
    if (locating) return;

    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Location access needed', 'Allow location access to center the map on your current position.');
        return;
      }

      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        Alert.alert('Location services are off', 'Turn on Location Services, then try again.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const nextCoordinates = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      setCoordinates(nextCoordinates);
      mapRef.current?.animateToRegion({ ...nextCoordinates, latitudeDelta: INITIAL_DELTA, longitudeDelta: INITIAL_DELTA }, 450);
      void resolveAddress(nextCoordinates);
    } catch (error) {
      Alert.alert('Could not get current location', error instanceof Error ? error.message : 'Please try again in an open area.');
    } finally {
      setLocating(false);
    }
  }

  function handleConfirm() {
    const locationId = Number(params.locationId);
    if (!Number.isFinite(locationId)) {
      Alert.alert('Location unavailable', 'Close the map and open Relocate again.');
      return;
    }

    setDraftCoordinates(locationId, {
      latitude: coordinates.latitude.toFixed(6),
      longitude: coordinates.longitude.toFixed(6),
    });
    router.back();
  }

  return (
    <ThemedView flex={1} backgroundColor={Palette.surfaceMuted}>
      <MapView
        initialRegion={{ ...initialCoordinates, latitudeDelta: INITIAL_DELTA, longitudeDelta: INITIAL_DELTA }}
        mapPadding={{ bottom: 214 + bottom, left: 0, right: 0, top: 84 }}
        onMapReady={() => void resolveAddress(initialCoordinates)}
        onRegionChangeComplete={handleRegionChangeComplete}
        ref={mapRef}
        rotateEnabled={false}
        showsCompass={false}
        showsMyLocationButton={false}
        style={StyleSheet.absoluteFill}
        toolbarEnabled={false}
      />

      <ThemedView
        alignItems='center'
        backgroundColor='transparent'
        left='50%'
        marginLeft={-21}
        marginTop={-56}
        pointerEvents='none'
        position='absolute'
        top='50%'
        width={42}>
        <Image contentFit='contain' source={require('assets/images/icon-location-green.png')} style={{ height: 56, width: 42 }} />
      </ThemedView>

      <Pressable
        accessibilityLabel='Center map on current location'
        accessibilityRole='button'
        disabled={locating}
        onPress={handleUseCurrentLocation}
        style={({ pressed }) => ({ bottom: bottom + 224, opacity: pressed ? 0.72 : 1, position: 'absolute', right: 18 })}>
        <ThemedView
          alignItems='center'
          backgroundColor={Palette.surfaceBase}
          borderColor={Palette.borderSubtle}
          borderCurve='continuous'
          borderRadius={'pill'}
          borderWidth={1}
          boxShadow='0 4px 12px rgba(15, 23, 42, 0.16)'
          height={48}
          justifyContent='center'
          width={48}>
          {locating ? <ActivityIndicator color={Palette.accent} size='small' /> : <LocateFixed color={Palette.accent} size={21} strokeWidth={2.3} />}
        </ThemedView>
      </Pressable>

      <BottomButton
        borderTopRadius={24}
        onPress={handleConfirm}
        title='Confirm location'
        TopComponent={
          <ThemedView backgroundColor='transparent' gap={5} marginBottom={'three'}>
            <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={10} letterSpacing={0.9} lineHeight={14}>
              SELECTED LOCATION
            </ThemedText>
            <ThemedView alignItems='flex-start' flexDirection='row' gap={'two'} minHeight={42}>
              <MapPin color={Palette.accent} size={18} strokeWidth={2.2} />
              <ThemedView flex={1} gap={3}>
                <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={14} lineHeight={19} numberOfLines={2}>
                  {address}
                </ThemedText>
                <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={11} lineHeight={16} selectable>
                  {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}
                </ThemedText>
              </ThemedView>
              {resolvingAddress ? <ActivityIndicator color={Palette.accent} size='small' /> : null}
            </ThemedView>
          </ThemedView>
        }
      />
    </ThemedView>
  );
}
