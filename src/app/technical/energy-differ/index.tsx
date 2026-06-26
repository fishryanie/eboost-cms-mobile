import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, Pressable, RefreshControl } from 'react-native';

import { ThemedText, ThemedView } from 'components/base';
import { screenHorizontalPadding } from 'components/technical/common';
import { getItemKey } from 'components/technical/list-ui';
import { styles } from 'components/technical/styles';
import { VehicleSwitch } from 'components/technical/vehicle-switch';
import { FontFamily, Palette } from 'themes';
import { apiRequest } from 'utils/api/client';
import { getCollectionResult } from 'utils/api/collection';

import { EnergyDifferCard, EnergyDifferState } from './components/energy-differ-card';

function formatDateParam(date: Date) {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export default function EnergyDifferScreen() {
  const router = useRouter();
  const [vehicle, setVehicle] = useState<TechnicalVehicle>('bike');
  const query = useQuery({
    queryFn: async () => {
      const now = new Date();
      const response = await apiRequest<ApiListResponse<EnergyDifferRecord>>('api/v1/statistics/energy', {
        params: {
          end_date: formatDateParam(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
          limit: 100,
          page: 1,
          start_date: formatDateParam(new Date(now.getFullYear(), now.getMonth(), 1)),
          type: vehicle,
        },
        service: 'hub',
      });
      return getCollectionResult(response);
    },
    queryKey: ['technical', 'energy-differ', vehicle],
  });

  return (
    <ThemedView flex={1} backgroundColor={Palette.surfaceBase} safePaddingTop>
      <FlatList
        {...{
          contentContainerStyle: styles.content,
          data: query.data?.items || [],
          keyExtractor: (item, index) => getItemKey(item, index),
          ListHeaderComponent: (
            <ThemedView gap={'three'} paddingHorizontal={screenHorizontalPadding} paddingTop={'one'}>
              <ThemedView alignItems='center' flexDirection='row' minHeight={38}>
                <Pressable
                  accessibilityLabel='Back'
                  accessibilityRole='button'
                  onPress={() => router.back()}
                  style={({ pressed }) => [styles.issueNavButton, pressed && styles.pressed]}>
                  <ChevronLeft color={Palette.textPrimary} size={20} strokeWidth={2.2} />
                </Pressable>
                <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={24} lineHeight={30}>
                  Energy Differ
                </ThemedText>
              </ThemedView>
              <VehicleSwitch vehicle={vehicle} onChange={setVehicle} />
            </ThemedView>
          ),
          ListEmptyComponent: <EnergyDifferState query={{ data: query.data, error: query.error, isLoading: query.isLoading, refetch: query.refetch }} />,
          refreshControl: <RefreshControl onRefresh={query.refetch} refreshing={query.isRefetching} tintColor={Palette.accent} />,
          renderItem: ({ item }) => <EnergyDifferCard item={item as EnergyDifferRecord} vehicle={vehicle} />,
          showsVerticalScrollIndicator: false,
        }}
      />
    </ThemedView>
  );
}
