import { CalendarDays, ChevronDown } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Pressable } from 'react-native';

import { StatusFilterSheet } from 'app/technical/status-logs/components/status-filter-sheet';
import { formatDateParam, formatDateRangeLabel, getStatusOptions } from 'app/technical/status-logs/status-options';
import { ThemedText, ThemedView } from 'components/base';
import { RangePicker, type RangePickerMethods } from 'components/base/RangePicker';
import { FontFamily, Palette } from 'themes';

export type StatusLogDateRange = {
  endDate: string;
  startDate: string;
};

type StatusLogFiltersProps = {
  dateRange?: StatusLogDateRange;
  onChangeDateRange: (dateRange?: StatusLogDateRange) => void;
  onChangeStatus: (status: string) => void;
  status: string;
  vehicle: TechnicalVehicle;
};

export function StatusLogFilters({ dateRange, onChangeDateRange, onChangeStatus, status, vehicle }: StatusLogFiltersProps) {
  const rangePickerRef = useRef<RangePickerMethods>(null);
  const [statusSheetVisible, setStatusSheetVisible] = useState(false);
  const statusOptions = getStatusOptions(vehicle);
  const statusLabel = statusOptions.find(option => option.value === status)?.label || 'All statuses';
  const rangeLabel = formatDateRangeLabel(dateRange?.startDate, dateRange?.endDate);

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
      <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={'two'}>
        <DateFilterChip label={rangeLabel} onPress={() => rangePickerRef.current?.open()} />
        <FilterChip
          active={Boolean(status)}
          icon={<ChevronDown color={status ? Palette.accent : Palette.textTertiary} size={16} />}
          label={statusLabel}
          onPress={() => setStatusSheetVisible(true)}
        />
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

function DateFilterChip({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityLabel={`Filter by date, ${label}`} accessibilityRole='button' onPress={onPress} style={{ flex: 1 }}>
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
          <CalendarDays color={Palette.accent} size={17} strokeWidth={2.2} />
          <ThemedText color={Palette.textPrimary} flex={1} fontFamily={FontFamily.semibold} fontSize={12} lineHeight={17} numberOfLines={1}>
            {label}
          </ThemedText>
          <ChevronDown color={Palette.textTertiary} size={14} strokeWidth={2.2} />
        </ThemedView>
      )}
    </Pressable>
  );
}

function FilterChip({ active, icon, label, onPress }: { active: boolean; icon: React.ReactNode; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityLabel={label} accessibilityRole='button' hitSlop={6} onPress={onPress} style={{ flex: 1 }}>
      {({ pressed }) => (
        <ThemedView
          alignItems='center'
          backgroundColor={active ? '#E8F4EF' : Palette.surfaceMuted}
          borderColor={active ? '#B7DEC9' : Palette.borderSubtle}
          borderRadius={'pill'}
          borderWidth={1}
          flexDirection='row'
          gap={'two'}
          height={40}
          opacity={pressed ? 0.72 : 1}
          paddingHorizontal={'three'}>
          {icon}
          <ThemedText
            color={active ? Palette.accentPressed : Palette.textSecondary}
            flex={1}
            fontFamily={FontFamily.semibold}
            fontSize={12}
            lineHeight={17}
            numberOfLines={1}>
            {label}
          </ThemedText>
        </ThemedView>
      )}
    </Pressable>
  );
}
