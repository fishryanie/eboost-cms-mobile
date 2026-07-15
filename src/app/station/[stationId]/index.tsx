import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, MapPin, RefreshCcw, Zap } from 'lucide-react-native';
import { Pressable, RefreshControl } from 'react-native';

import { ThemedText, ThemedView } from 'components/base';
import { AnimatedScrollView } from 'components/organisms/parallax-header';
import { StationDetailsContent } from 'shared/stations/components/station-details-content';
import { AppButton, EmptyState } from 'components/ui';
import { useLocationDetail, useLocationStations } from 'shared/locations/hooks';
import { FontFamily, Palette } from 'themes';
import { getDisplayImageUrl } from 'utils/media/image-url';

const HEADER_HEIGHT = 300;

export default function StationDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ locationId?: string; stationId: string }>();
  const locationId = String(params.locationId || '');
  const stationId = String(params.stationId || '');
  const locationQuery = useLocationDetail(locationId);
  const stationsQuery = useLocationStations(locationId);
  const location = locationQuery.data;
  const station = stationsQuery.data?.find(item => String(item.id) === stationId);
  const imageUrl = getDisplayImageUrl(station?.images?.[0]?.url || location?.images?.[0]?.url || location?.image_url || location?.imageUrl || location?.image);
  const refreshing = locationQuery.isRefetching || stationsQuery.isRefetching;

  const refresh = () => {
    locationQuery.refetch();
    stationsQuery.refetch();
  };

  if (stationsQuery.isLoading || locationQuery.isLoading) {
    return (
      <ThemedView backgroundColor={Palette.surfaceBase} flex={1} gap={'four'} padding={'four'} safePaddingTop>
        <Stack.Screen options={{ headerShown: false }} />
        <ThemedView borderRadius={'large'} height={280} loading />
        <ThemedView borderRadius={'large'} height={180} loading />
      </ThemedView>
    );
  }

  if (stationsQuery.isError || !station) {
    return (
      <ThemedView alignItems='center' backgroundColor={Palette.surfaceBase} flex={1} gap={'four'} justifyContent='center' padding={'four'}>
        <Stack.Screen options={{ headerShown: false }} />
        <EmptyState message='This station could not be loaded.' title='Station unavailable' />
        <AppButton label='Retry' onPress={refresh} />
      </ThemedView>
    );
  }

  const nav = (collapsed: boolean) => (
    <ThemedView
      alignItems='center'
      backgroundColor={collapsed ? Palette.surfaceBase : 'transparent'}
      flexDirection='row'
      height={104}
      justifyContent='space-between'
      paddingHorizontal={'four'}
      paddingTop={'two'}
      safePaddingTop>
      <Pressable accessibilityLabel='Back' onPress={() => router.back()}>
        <ThemedView
          alignItems='center'
          backgroundColor={collapsed ? Palette.surfaceMuted : 'rgba(12, 20, 18, 0.55)'}
          borderRadius={'pill'}
          height={36}
          justifyContent='center'
          width={36}>
          <ChevronLeft color={collapsed ? Palette.textPrimary : '#FFFFFF'} size={20} />
        </ThemedView>
      </Pressable>
      {collapsed ? (
        <ThemedText
          color={Palette.textPrimary}
          flex={1}
          fontFamily={FontFamily.semibold}
          fontSize={15}
          marginHorizontal={'three'}
          numberOfLines={1}
          textAlign='center'>
          {station.name || `Station #${station.id}`}
        </ThemedText>
      ) : (
        <ThemedView backgroundColor='transparent' flex={1} />
      )}
      <Pressable accessibilityLabel='Refresh station' onPress={refresh}>
        <ThemedView
          alignItems='center'
          backgroundColor={collapsed ? Palette.surfaceMuted : 'rgba(12, 20, 18, 0.55)'}
          borderRadius={'pill'}
          height={36}
          justifyContent='center'
          width={36}>
          <RefreshCcw color={collapsed ? Palette.textPrimary : '#FFFFFF'} size={18} />
        </ThemedView>
      </Pressable>
    </ThemedView>
  );

  const coordinates = station.latitude != null && station.longitude != null ? `${station.latitude}, ${station.longitude}` : undefined;

  return (
    <ThemedView backgroundColor={Palette.surfaceBase} flex={1}>
      <Stack.Screen options={{ headerShown: false }} />
      <AnimatedScrollView
        contentInsetAdjustmentBehavior='never'
        headerMaxHeight={HEADER_HEIGHT}
        refreshControl={<RefreshControl onRefresh={refresh} refreshing={refreshing} tintColor='#FFFFFF' />}
        renderHeaderComponent={() => (
          <ThemedView backgroundColor='#173629' flex={1}>
            {imageUrl ? (
              <Image contentFit='cover' source={{ uri: imageUrl }} style={{ height: HEADER_HEIGHT, width: '100%' }} />
            ) : (
              <ThemedView alignItems='center' backgroundColor='#24483A' flex={1} justifyContent='center'>
                <Zap color='rgba(255,255,255,0.62)' size={72} strokeWidth={1.4} />
              </ThemedView>
            )}
            <LinearGradient
              colors={['rgba(5,15,11,0.04)', 'rgba(5,15,11,0.32)', 'rgba(5,15,11,0.88)']}
              locations={[0, 0.5, 1]}
              style={{ bottom: 0, height: HEADER_HEIGHT, left: 0, position: 'absolute', right: 0 }}
            />
          </ThemedView>
        )}
        renderHeaderNavBarComponent={() => nav(false)}
        renderOveralComponent={() => (
          <ThemedView backgroundColor='transparent' gap={'one'} padding={'four'} paddingBottom={42} width='100%'>
            <ThemedText color='rgba(255,255,255,0.72)' fontFamily={FontFamily.semibold} fontSize={11} textTransform='uppercase'>
              Station #{station.id}
            </ThemedText>
            <ThemedText color='#FFFFFF' fontFamily={FontFamily.semibold} fontSize={24} lineHeight={30} numberOfLines={2}>
              {station.name || `Station #${station.id}`}
            </ThemedText>
            <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={'one'}>
              <MapPin color='rgba(255,255,255,0.78)' size={14} />
              <ThemedText color='rgba(255,255,255,0.82)' flex={1} fontSize={13} numberOfLines={1} selectable>
                {coordinates || location?.displayAddress || location?.address || station.description || 'Location unavailable'}
              </ThemedText>
            </ThemedView>
          </ThemedView>
        )}
        renderTopNavBarComponent={() => nav(true)}
        showsVerticalScrollIndicator={false}
        topBarHeight={104}>
        <ThemedView backgroundColor={Palette.surfaceBase} borderTopLeftRadius={28} borderTopRightRadius={28} marginTop={-24} overflow='hidden' paddingTop={8}>
          <StationDetailsContent locationId={locationId} station={station} />
        </ThemedView>
      </AnimatedScrollView>
    </ThemedView>
  );
}
