import { mhs } from 'themes/scaling';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { BottomButton, ThemedText, ThemedView } from 'components/base';
import { useLocationDetail } from 'shared/locations/hooks';
import { AppScreen } from 'components/ui';
import FloatingTextInput from 'components/ui/FloatingTextInput';
import { FontFamily, Palette } from 'themes';

export default function SetupLocationScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const locationId = params.id ? parseInt(params.id, 10) : 0;

  const { data: location, isLoading, isError } = useLocationDetail(locationId);

  const [nameEn, setNameEn] = useState('EBOOST');
  const [nameVn, setNameVn] = useState('EBOOST');
  const [addressEn, setAddressEn] = useState('');
  const [addressVn, setAddressVn] = useState('');
  const [province, setProvince] = useState('');
  const [ward, setWard] = useState('');
  const [latitude, setLatitude] = useState('0');
  const [longitude, setLongitude] = useState('0');
  const [operationStatus, setOperationStatus] = useState('Terminated');
  const [typeOfLocation, setTypeOfLocation] = useState('Office Building');
  const [descEn, setDescEn] = useState('');
  const [descVn, setDescVn] = useState('');
  const [visibleOnMap, setVisibleOnMap] = useState(false);

  useEffect(() => {
    if (location) {
      setNameEn(location.name || 'EBOOST');
      setNameVn(location.name || 'EBOOST');
      setAddressEn(location.displayAddress || location.address || '');
    }
  }, [location]);

  return (
    <ThemedView flex={1}>
      <AppScreen canGoBack onBack={() => router.back()} title='Setup Location' contentContainerStyle={styles.content}>
        {isLoading ? (
          <ThemedView flex={1} alignItems='center' justifyContent='center' style={{ marginTop: 100 }}>
            <ActivityIndicator color={Palette.accent} size='large' />
          </ThemedView>
        ) : isError ? (
          <ThemedView flex={1} alignItems='center' justifyContent='center' gap={'three'} style={{ marginTop: 100 }}>
            <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={16}>
              Failed to load location details.
            </ThemedText>
          </ThemedView>
        ) : location ? (
          <ThemedView gap={'four'}>
            <ThemedView gap={'two'}>
              <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={14}>
                Images
              </ThemedText>
              <Pressable style={styles.uploadBox}>
                <ThemedText color={Palette.textSecondary} fontSize={20} lineHeight={20}>
                  +
                </ThemedText>
                <ThemedText color={Palette.textSecondary} fontSize={12}>
                  Upload
                </ThemedText>
              </Pressable>
            </ThemedView>

            <FloatingTextInput label='* Name (English)' value={nameEn} onChangeText={setNameEn} />
            <FloatingTextInput label='* Name (Vietnamese)' value={nameVn} onChangeText={setNameVn} />

            <FloatingTextInput label='* Address (English)' value={addressEn} onChangeText={setAddressEn} placeholder='Please enter' />
            <FloatingTextInput label='* Address (Vietnamese)' value={addressVn} onChangeText={setAddressVn} placeholder='Please enter' />

            <ThemedView flexDirection='row' gap={'three'}>
              <ThemedView flex={1}>
                <FloatingTextInput label='Provinces' value={province} onChangeText={setProvince} placeholder='Please select' />
              </ThemedView>
              <ThemedView flex={1}>
                <FloatingTextInput label='* Wards' value={ward} onChangeText={setWard} placeholder='Please select' />
              </ThemedView>
            </ThemedView>

            <ThemedView flexDirection='row' gap={'three'}>
              <ThemedView flex={1}>
                <FloatingTextInput label='* Latitude' value={latitude} onChangeText={setLatitude} />
              </ThemedView>
              <ThemedView flex={1}>
                <FloatingTextInput label='* Longitude' value={longitude} onChangeText={setLongitude} />
              </ThemedView>
            </ThemedView>

            <ThemedView flexDirection='row' gap={'three'}>
              <ThemedView flex={1}>
                <FloatingTextInput label='Operation Status' value={operationStatus} onChangeText={setOperationStatus} placeholder='Please select' />
              </ThemedView>
              <ThemedView flex={1}>
                <FloatingTextInput label='Type of Location' value={typeOfLocation} onChangeText={setTypeOfLocation} placeholder='Please select' />
              </ThemedView>
            </ThemedView>

            <FloatingTextInput
              label='Description (English)'
              value={descEn}
              onChangeText={setDescEn}
              placeholder='Please enter'
              multiline
              style={{ height: 100 }}
            />

            <FloatingTextInput
              label='Description (Vietnamese)'
              value={descVn}
              onChangeText={setDescVn}
              placeholder='Please enter'
              multiline
              style={{ height: 100 }}
            />

            <Pressable style={styles.checkboxContainer} onPress={() => setVisibleOnMap(!visibleOnMap)}>
              <ThemedView style={[styles.checkbox, visibleOnMap && styles.checkboxChecked]}>{visibleOnMap && <Check color='#fff' size={14} />}</ThemedView>
              <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.medium} fontSize={14}>
                Visible on map
              </ThemedText>
            </Pressable>
          </ThemedView>
        ) : null}
      </AppScreen>

      {location && !isLoading && !isError && <BottomButton onPress={() => router.back()} title='Submit' />}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: mhs(16),
    paddingBottom: 100, // Make room for the BottomButton
  },
  uploadBox: {
    width: 80,
    height: 80,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Palette.border,
    borderRadius: mhs(12),
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4 },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: mhs(8),
    marginTop: mhs(8) },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center' },
  checkboxChecked: {
    backgroundColor: Palette.accent,
    borderColor: Palette.accent } });
