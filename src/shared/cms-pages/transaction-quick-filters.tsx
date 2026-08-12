import dayjs from 'dayjs';
import { CalendarDays, ChevronDown } from 'lucide-react-native';
import { useRef } from 'react';
import { Pressable, ScrollView } from 'react-native';

import { ThemedText, ThemedView } from 'components/base';
import { RangePicker, type RangePickerMethods } from 'components/base/RangePicker';
import { VehicleSegment } from 'components/technical/vehicle-segment';
import { FontFamily, Palette } from 'themes';

import { transactionStatusOptions, type TransactionFilterValues, type TransactionStatusFilter, type TransactionVehicle } from './transaction-filter-sheet';

type TransactionQuickFiltersProps = {
  filters: TransactionFilterValues;
  onChangeFilters: (values: Partial<TransactionFilterValues>) => void;
  onChangeVehicle: (vehicle: TransactionVehicle) => void;
  vehicle: TransactionVehicle;
};

type StatusVisual = {
  border: string;
  dot: string;
  tint: string;
  text: string;
};

const filterAccent = '#0B9B55';

export function TransactionQuickFilters({ filters, onChangeFilters, onChangeVehicle, vehicle }: TransactionQuickFiltersProps) {
  const rangePickerRef = useRef<RangePickerMethods>(null);
  const startDate = dayjs.unix(filters.startDate);
  const endDate = dayjs.unix(filters.endDate);
  const dateLabel = startDate.isSame(endDate, 'year')
    ? `${startDate.format('DD MMM')} – ${endDate.format('DD MMM')}`
    : `${startDate.format('DD MMM YY')} – ${endDate.format('DD MMM YY')}`;
  const fullDateLabel = `${startDate.format('DD MMMM YYYY')} to ${endDate.format('DD MMMM YYYY')}`;

  function handleDateRangeChange(range: number[]) {
    const [nextStartDate, nextEndDate] = range;
    if (nextStartDate === undefined || nextEndDate === undefined) return;
    onChangeFilters({ endDate: nextEndDate, startDate: nextStartDate });
  }

  return (
    <ThemedView backgroundColor='transparent' gap={'three'} paddingBottom={16}>
      <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={'two'}>
        <Pressable
          accessibilityLabel={`Filter by date, ${fullDateLabel}`}
          accessibilityRole='button'
          onPress={() => rangePickerRef.current?.open()}
          style={{ flex: 1 }}>
          {({ pressed }) => (
            <ThemedView
              alignItems='center'
              backgroundColor={Palette.surfaceMuted}
              borderColor={Palette.borderSubtle}
              borderRadius={'pill'}
              borderWidth={1}
              flexDirection='row'
              gap={'two'}
              height={40}
              opacity={pressed ? 0.68 : 1}
              paddingHorizontal={'three'}>
              <CalendarDays color={filterAccent} size={17} strokeWidth={2.2} />
              <ThemedText color={Palette.textPrimary} flex={1} fontFamily={FontFamily.semibold} fontSize={12} lineHeight={17} numberOfLines={1}>
                {dateLabel}
              </ThemedText>
              <ChevronDown color={Palette.textTertiary} size={14} strokeWidth={2.2} />
            </ThemedView>
          )}
        </Pressable>

        <VehicleSegment onChange={onChangeVehicle} value={vehicle} />
      </ThemedView>

      <ScrollView contentContainerStyle={{ gap: 8, paddingRight: 4 }} horizontal showsHorizontalScrollIndicator={false}>
        {transactionStatusOptions.map(option => (
          <StatusChip
            key={String(option.value)}
            label={option.label}
            onPress={() => onChangeFilters({ status: option.value })}
            selected={filters.status === option.value}
            value={option.value}
          />
        ))}
      </ScrollView>

      <RangePicker onChange={handleDateRangeChange} ref={rangePickerRef} value={[filters.startDate, filters.endDate]} />
    </ThemedView>
  );
}

function StatusChip({ label, onPress, selected, value }: { label: string; onPress: () => void; selected: boolean; value: TransactionStatusFilter }) {
  const visual = getStatusVisual(value);

  return (
    <Pressable
      accessibilityLabel={`Filter status ${label}`}
      accessibilityRole='button'
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.68 : 1 })}>
      <ThemedView
        alignItems='center'
        backgroundColor={selected ? visual.tint : Palette.surfaceBase}
        borderColor={selected ? visual.border : Palette.borderSubtle}
        borderRadius={'pill'}
        borderWidth={1}
        flexDirection='row'
        gap={'two'}
        height={34}
        paddingHorizontal={'three'}>
        <ThemedView backgroundColor={visual.dot} borderRadius={'pill'} height={7} width={7} />
        <ThemedText color={selected ? visual.text : Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={12} lineHeight={17}>
          {label}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

function getStatusVisual(value: TransactionStatusFilter): StatusVisual {
  if (value === 0) return { border: '#BAE6FD', dot: '#0284C7', text: '#0369A1', tint: '#F0F9FF' };
  if (value === 1) return { border: '#BBF7D0', dot: '#16A34A', text: '#15803D', tint: '#F0FDF4' };
  if (value === 'crash') return { border: '#FECACA', dot: '#DC2626', text: '#B91C1C', tint: '#FEF2F2' };
  return { border: '#CBD5E1', dot: '#64748B', text: '#334155', tint: '#F8FAFC' };
}
