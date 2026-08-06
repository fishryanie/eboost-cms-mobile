import { BottomSheetBackdrop, BottomSheetFlatList, BottomSheetModal, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { ActivityIndicator, Alert, Pressable } from 'react-native';
import { Bike, Car, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';

import { ThemedText, ThemedView } from 'components/base';
import { AppButton, EmptyState } from 'components/ui';
import { getWorkflowChargerIdentifier } from 'app/location/[id]/features/charger-workflows';
import { useAssignableChargers, useLocationResourceMutations } from 'shared/locations/hooks';
import { FontFamily, Palette } from 'themes';
import { mhs } from 'themes/scaling';

type AssignChargerSheetProps = {
  locationId: string;
  onClose: () => void;
  station: StationRecord;
  visible: boolean;
};

type ChargerTypeOption = {
  kind: 'type';
  label: string;
  subtitle: string;
  type: ChargerVehicle;
};

type ChargerOption = {
  charger: WorkflowChargerRecord;
  kind: 'charger';
};

type AssignmentSheetItem = ChargerTypeOption | ChargerOption;

const chargerTypeOptions: ChargerTypeOption[] = [
  {
    kind: 'type',
    label: 'Bike charger',
    subtitle: 'Show available bike boxes',
    type: 'bike',
  },
  {
    kind: 'type',
    label: 'Car charger',
    subtitle: 'Show available car boxes',
    type: 'car',
  },
];

const snapPoints = ['42%', '88%'];

export function AssignChargerSheet({ locationId, onClose, station, visible }: AssignChargerSheetProps) {
  const ref = useRef<BottomSheetModal>(null);
  const isPresentedRef = useRef(false);
  const [selectedType, setSelectedType] = useState<ChargerVehicle>();
  const [query, setQuery] = useState('');
  const [assigningId, setAssigningId] = useState<number>();
  const chargersQuery = useAssignableChargers(selectedType, visible && Boolean(selectedType));
  const mutations = useLocationResourceMutations(locationId, station.id);
  const filteredChargers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const chargers = chargersQuery.data || [];
    if (!normalizedQuery) return chargers;

    return chargers.filter(charger => {
      const identifier = getWorkflowChargerIdentifier(charger);
      return `${charger.name || ''} ${identifier || ''}`.toLowerCase().includes(normalizedQuery);
    });
  }, [chargersQuery.data, query]);
  const listItems: AssignmentSheetItem[] = selectedType ? filteredChargers.map(charger => ({ charger, kind: 'charger' })) : chargerTypeOptions;

  useEffect(() => {
    if (visible) {
      isPresentedRef.current = true;
      const frame = requestAnimationFrame(() => ref.current?.present());
      return () => cancelAnimationFrame(frame);
    }

    if (isPresentedRef.current) ref.current?.dismiss();
    return undefined;
  }, [visible]);

  function handleDismiss() {
    if (!isPresentedRef.current) return;
    isPresentedRef.current = false;
    setSelectedType(undefined);
    setQuery('');
    setAssigningId(undefined);
    onClose();
  }

  function selectType(type: ChargerVehicle) {
    setSelectedType(type);
    setQuery('');
    ref.current?.snapToIndex(1);
  }

  function showTypeOptions() {
    setSelectedType(undefined);
    setQuery('');
    ref.current?.snapToIndex(0);
  }

  function assignCharger(charger: WorkflowChargerRecord) {
    if (!selectedType || mutations.patch.isPending) return;

    setAssigningId(charger.id);
    mutations.patch.mutate(
      {
        data: { station: station.iriId || `/api/stations/${station.id}` },
        id: charger.id,
        path: selectedType === 'car' ? 'api/car_boxes' : 'api/bike_boxes',
      },
      {
        onError: error => {
          setAssigningId(undefined);
          Alert.alert('Assignment failed', error instanceof Error ? error.message : 'Please try again.');
        },
        onSuccess: () => ref.current?.dismiss(),
      },
    );
  }

  function renderEmptyState() {
    if (!selectedType) return null;
    if (chargersQuery.isLoading) {
      return (
        <ThemedView backgroundColor='transparent' gap={'three'} padding={'four'}>
          <ThemedView borderRadius={16} height={72} loading />
          <ThemedView borderRadius={16} height={72} loading />
          <ThemedView borderRadius={16} height={72} loading />
        </ThemedView>
      );
    }

    if (chargersQuery.isError) {
      return (
        <ThemedView backgroundColor='transparent' gap={'three'} padding={'four'}>
          <EmptyState message='The available charger list could not be loaded.' title='Chargers unavailable' />
          <AppButton block label='Retry' onPress={() => chargersQuery.refetch()} />
        </ThemedView>
      );
    }

    return (
      <ThemedView backgroundColor='transparent' padding={'four'}>
        <EmptyState
          message={query ? 'No chargers match your search.' : `There are no unassigned ${selectedType} chargers.`}
          title={query ? 'No chargers found' : 'No chargers available'}
        />
      </ThemedView>
    );
  }

  return (
    <BottomSheetModal
      backdropComponent={props => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />}
      enableDynamicSizing={false}
      onDismiss={handleDismiss}
      ref={ref}
      snapPoints={snapPoints}>
      <BottomSheetFlatList
        contentContainerStyle={{ paddingBottom: mhs(36) }}
        data={listItems}
        ItemSeparatorComponent={() => <ThemedView backgroundColor={Palette.borderSubtle} height={1} marginLeft={'four'} />}
        keyExtractor={item => (item.kind === 'type' ? item.type : `${selectedType}-${item.charger.id}`)}
        keyboardShouldPersistTaps='handled'
        ListEmptyComponent={renderEmptyState}
        ListHeaderComponent={
          <ThemedView backgroundColor={Palette.surfaceRaised} gap={'three'} paddingBottom={'three'} paddingHorizontal={'four'} paddingTop={'two'}>
            <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={'two'}>
              {selectedType ? (
                <Pressable accessibilityLabel='Back to charger types' accessibilityRole='button' hitSlop={8} onPress={showTypeOptions}>
                  {({ pressed }) => (
                    <ThemedView
                      alignItems='center'
                      backgroundColor={Palette.surfaceMuted}
                      borderRadius={'pill'}
                      height={34}
                      justifyContent='center'
                      opacity={pressed ? 0.65 : 1}
                      width={34}>
                      <ChevronLeft color={Palette.textPrimary} size={19} />
                    </ThemedView>
                  )}
                </Pressable>
              ) : null}
              <ThemedView backgroundColor='transparent' flex={1} gap={2} minWidth={0}>
                <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={20} lineHeight={26}>
                  {selectedType ? `Select ${selectedType} charger` : 'Assign charger'}
                </ThemedText>
                <ThemedText color={Palette.textSecondary} fontSize={13} lineHeight={18}>
                  {selectedType ? 'Choose an unassigned charger for this station.' : 'Choose the charger type to continue.'}
                </ThemedText>
              </ThemedView>
            </ThemedView>
            {selectedType ? (
              <BottomSheetTextInput
                autoCapitalize='none'
                autoCorrect={false}
                onChangeText={setQuery}
                placeholder='Search name or ID...'
                placeholderTextColor={Palette.textTertiary}
                returnKeyType='search'
                style={{
                  backgroundColor: Palette.surfaceMuted,
                  borderColor: Palette.border,
                  borderRadius: mhs(14),
                  borderWidth: 1,
                  color: Palette.textPrimary,
                  fontFamily: FontFamily.semibold,
                  fontSize: 13,
                  minHeight: 44,
                  paddingHorizontal: mhs(12),
                }}
                value={query}
              />
            ) : null}
          </ThemedView>
        }
        renderItem={({ item }) => {
          if (item.kind === 'type') {
            const Icon = item.type === 'car' ? Car : Bike;
            const accent = item.type === 'car' ? '#B86A13' : '#17834A';
            const tone = item.type === 'car' ? '#FFF5E8' : '#EEF7F1';

            return (
              <Pressable accessibilityLabel={`Select ${item.label}`} accessibilityRole='button' onPress={() => selectType(item.type)}>
                {({ pressed }) => (
                  <ThemedView
                    alignItems='center'
                    backgroundColor='transparent'
                    flexDirection='row'
                    gap={'three'}
                    minHeight={76}
                    opacity={pressed ? 0.68 : 1}
                    paddingHorizontal={'four'}
                    paddingVertical={'three'}>
                    <ThemedView alignItems='center' backgroundColor={tone} borderRadius={14} height={44} justifyContent='center' width={44}>
                      <Icon color={accent} size={21} />
                    </ThemedView>
                    <ThemedView backgroundColor='transparent' flex={1} gap={2} minWidth={0}>
                      <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={15} lineHeight={20}>
                        {item.label}
                      </ThemedText>
                      <ThemedText color={Palette.textSecondary} fontSize={12} lineHeight={17}>
                        {item.subtitle}
                      </ThemedText>
                    </ThemedView>
                    <ChevronRight color={Palette.textTertiary} size={18} />
                  </ThemedView>
                )}
              </Pressable>
            );
          }

          const charger = item.charger;
          const identifier = getWorkflowChargerIdentifier(charger);
          const portCount = selectedType === 'car' ? charger.carConnectors?.length || 0 : charger.outlets?.length || 0;
          const isAssigning = assigningId === charger.id;
          const accent = selectedType === 'car' ? '#B86A13' : '#17834A';
          const Icon = selectedType === 'car' ? Car : Bike;

          return (
            <Pressable
              accessibilityLabel={`Assign ${charger.name || identifier || `charger ${charger.id}`}`}
              accessibilityRole='button'
              disabled={mutations.patch.isPending}
              onPress={() => assignCharger(charger)}>
              {({ pressed }) => (
                <ThemedView
                  alignItems='center'
                  backgroundColor='transparent'
                  flexDirection='row'
                  gap={'three'}
                  minHeight={72}
                  opacity={mutations.patch.isPending && !isAssigning ? 0.45 : pressed ? 0.68 : 1}
                  paddingHorizontal={'four'}
                  paddingVertical={'three'}>
                  <ThemedView alignItems='center' backgroundColor={Palette.surfaceMuted} borderRadius={13} height={40} justifyContent='center' width={40}>
                    <Icon color={accent} size={19} />
                  </ThemedView>
                  <ThemedView backgroundColor='transparent' flex={1} gap={2} minWidth={0}>
                    <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={14} lineHeight={19} numberOfLines={1} selectable>
                      {charger.name || identifier || `Charger #${charger.id}`}
                    </ThemedText>
                    <ThemedText color={Palette.textSecondary} fontSize={11} lineHeight={16} numberOfLines={1} selectable>
                      {[charger.name && identifier ? identifier : undefined, `${portCount} ${selectedType === 'car' ? 'connectors' : 'outlets'}`]
                        .filter(Boolean)
                        .join(' · ')}
                    </ThemedText>
                  </ThemedView>
                  {isAssigning ? <ActivityIndicator color={accent} size='small' /> : <ChevronRight color={Palette.textTertiary} size={18} />}
                </ThemedView>
              )}
            </Pressable>
          );
        }}
        stickyHeaderIndices={[0]}
      />
    </BottomSheetModal>
  );
}
