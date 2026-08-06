import { CalendarDays, ChevronDown, RotateCcw } from 'lucide-react-native';
import { useMemo, useRef, useState } from 'react';
import { Pressable } from 'react-native';

import { StatusFilterSheet } from 'app/technical/status-logs/components/status-filter-sheet';
import { formatDateParam, formatDateRangeLabel, getStatusOptions } from 'app/technical/status-logs/status-options';
import { ThemedText, ThemedView } from 'components/base';
import { RangePicker, type RangePickerMethods } from 'components/base/RangePicker';
import { VehicleSwitch } from 'components/technical/vehicle-switch';
import { FontFamily, Palette } from 'themes';

export type StatusLogDateRange = {
  endDate: string;
  startDate: string;
};

type StatusLogFiltersProps = {
  dateRange?: StatusLogDateRange;
  onChangeDateRange: (dateRange?: StatusLogDateRange) => void;
  onChangeStatus: (status: string) => void;
  onChangeVehicle: (vehicle: TechnicalVehicle) => void;
  status: string;
  vehicle: TechnicalVehicle;
};

export function StatusLogFilters({ dateRange, onChangeDateRange, onChangeStatus, onChangeVehicle, status, vehicle }: StatusLogFiltersProps) {
  const rangePickerRef = useRef<RangePickerMethods>(null);
  const [statusSheetVisible, setStatusSheetVisible] = useState(false);
  const statusOptions = useMemo(() => getStatusOptions(vehicle), [vehicle]);
  const statusLabel = statusOptions.find(option => option.value === status)?.label || 'All statuses';
  const rangeLabel = formatDateRangeLabel(dateRange?.startDate, dateRange?.endDate);
  const hasActiveFilters = Boolean(status || dateRange);

  function handleRangeChange(value: number[]) {
    const [startTime, endTime] = value;
    if (startTime === undefined || endTime === undefined) return;

    onChangeDateRange({
      endDate: formatDateParam(endTime),
      startDate: formatDateParam(startTime),
    });
  }

  return (
    <>
      <ThemedView gap={'three'}>
        <ThemedView alignItems='center' flexDirection='row' justifyContent='space-between'>
          <VehicleSwitch onChange={onChangeVehicle} vehicle={vehicle} />
          {hasActiveFilters ? (
            <Pressable
              accessibilityLabel='Reset status and time filters'
              accessibilityRole='button'
              onPress={() => {
                onChangeStatus('');
                onChangeDateRange(undefined);
              }}>
              {({ pressed }) => (
                <ThemedView alignItems='center' flexDirection='row' gap={'one'} opacity={pressed ? 0.62 : 1} paddingHorizontal={'two'} paddingVertical={'one'}>
                  <RotateCcw color={Palette.textSecondary} size={14} />
                  <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={12}>
                    Reset
                  </ThemedText>
                </ThemedView>
              )}
            </Pressable>
          ) : null}
        </ThemedView>

        <ThemedView flexDirection='row' gap={'two'}>
          <FilterButton
            icon={<ChevronDown color={status ? Palette.accent : Palette.textTertiary} size={17} />}
            label='Status'
            onPress={() => setStatusSheetVisible(true)}
            value={statusLabel}
          />
          <FilterButton
            icon={<CalendarDays color={dateRange ? Palette.accent : Palette.textTertiary} size={17} />}
            label='Range time'
            onPress={() => rangePickerRef.current?.open()}
            value={rangeLabel}
          />
        </ThemedView>
      </ThemedView>

      <RangePicker onChange={handleRangeChange} ref={rangePickerRef} />
      <StatusFilterSheet
        onClose={() => setStatusSheetVisible(false)}
        onSelect={onChangeStatus}
        options={statusOptions}
        selectedStatus={status}
        visible={statusSheetVisible}
      />
    </>
  );
}

function FilterButton({ icon, label, onPress, value }: { icon: React.ReactNode; label: string; onPress: () => void; value: string }) {
  return (
    <Pressable accessibilityLabel={`${label}: ${value}`} accessibilityRole='button' onPress={onPress} style={{ flex: 1 }}>
      {({ pressed }) => (
        <ThemedView
          alignItems='center'
          backgroundColor={Palette.surfaceRaised}
          borderColor={Palette.borderSubtle}
          borderRadius={'medium'}
          borderWidth={1}
          flexDirection='row'
          gap={'two'}
          minHeight={56}
          opacity={pressed ? 0.72 : 1}
          paddingHorizontal={'three'}>
          {icon}
          <ThemedView flex={1} gap={2} minWidth={0}>
            <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={10} lineHeight={13}>
              {label}
            </ThemedText>
            <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={12} lineHeight={17} numberOfLines={1}>
              {value}
            </ThemedText>
          </ThemedView>
        </ThemedView>
      )}
    </Pressable>
  );
}
