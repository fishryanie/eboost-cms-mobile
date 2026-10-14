import dayjs from 'dayjs';
import { X } from 'lucide-react-native';
import { forwardRef, useImperativeHandle, useState } from 'react';
import { Pressable, ScrollView, useWindowDimensions } from 'react-native';
import Modal from 'react-native-modal';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamily, Palette } from 'themes';
import { rmhs, rmvs } from 'themes/scaling';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { getPresetRange, getRangeFromValue, selectRangeDay, type DateRange, type RangePreset } from './date-range';
import { RangeCalendar } from './range-calendar';

interface RangePickerProps {
  onChange: (value: number[]) => void;
  onClear?: () => void;
  value?: number[];
}

export interface RangePickerMethods {
  open: () => void;
}

const presets: { label: string; value: RangePreset }[] = [
  { label: 'Today', value: 'today' },
  { label: 'Last 7 days', value: 'week' },
  { label: 'This month', value: 'month' },
  { label: 'This year', value: 'year' },
];

export const RangePicker = forwardRef<RangePickerMethods, RangePickerProps>(function RangePicker({ onChange, onClear, value }, ref) {
  const [isShow, setShow] = useState(false);
  const [range, setRange] = useState<DateRange>({});
  const [month, setMonth] = useState(() => dayjs().startOf('month').toDate());
  const [allTime, setAllTime] = useState(false);
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const canApply = Boolean(range.start || (allTime && onClear));
  const rangeLabel = allTime
    ? 'All time'
    : range.start
      ? `${dayjs(range.start).format('DD MMM YYYY')} – ${range.end ? dayjs(range.end).format('DD MMM YYYY') : 'End date'}`
      : 'Choose a date range';

  useImperativeHandle(
    ref,
    () => ({
      open: () => {
        const selected = getRangeFromValue(value);
        setRange(selected);
        setMonth(dayjs(selected.start).startOf('month').toDate());
        setAllTime(Boolean(onClear && !selected.start));
        setShow(true);
      },
    }),
    [onClear, value],
  );

  function selectPreset(preset: RangePreset) {
    const selected = getPresetRange(preset);
    setRange(selected);
    setMonth(dayjs(selected.start).startOf('month').toDate());
    setAllTime(false);
  }

  function handleReset() {
    setRange({});
    setMonth(dayjs().startOf('month').toDate());
    setAllTime(false);
  }

  function handleAccept() {
    if (allTime && onClear) {
      onClear();
    } else if (range.start) {
      onChange([dayjs(range.start).unix(), dayjs(range.end ?? range.start).unix()]);
    } else {
      return;
    }
    setShow(false);
  }

  return (
    <Modal
      isVisible={isShow}
      // coverScreen
      animationInTiming={300}
      animationOutTiming={300}
      animationIn={reducedMotion ? 'fadeIn' : 'slideInUp'}
      animationOut={reducedMotion ? 'fadeOut' : 'slideOutDown'}
      useNativeDriver
      useNativeDriverForBackdrop
      hideModalContentWhileAnimating
      backdropTransitionOutTiming={500}
      onBackButtonPress={() => setShow(false)}
      onBackdropPress={() => setShow(false)}
      style={{ justifyContent: 'flex-end', margin: 0 }}>
      <ThemedView
        accessibilityViewIsModal
        alignSelf='center'
        backgroundColor={Palette.surfaceBase}
        borderCurve='continuous'
        borderTopLeftRadius={'large'}
        borderTopRightRadius={'large'}
        maxHeight={rmvs(height - insets.top - 12)}
        maxWidth={rmhs(560)}
        overflow='hidden'
        width='100%'>
        <ThemedView
          alignItems='center'
          borderBottomColor={Palette.borderSubtle}
          borderBottomWidth={1}
          flexDirection='row'
          gap={'three'}
          justifyContent='space-between'
          paddingHorizontal={'five'}
          paddingVertical={'three'}>
          <ThemedText accessibilityRole='header' color={Palette.textPrimary} flex={1} fontFamily={FontFamily.semibold} fontSize={18}>
            Date range
          </ThemedText>
          <Pressable accessibilityLabel='Close date range' accessibilityRole='button' hitSlop={4} onPress={() => setShow(false)}>
            {({ pressed }) => (
              <ThemedView
                alignItems='center'
                backgroundColor={Palette.surfaceMuted}
                borderRadius={'pill'}
                justifyContent='center'
                opacity={pressed ? 0.6 : 1}
                square={40}>
                <X color={Palette.textSecondary} size={20} />
              </ThemedView>
            )}
          </Pressable>
        </ThemedView>

        <ScrollView bounces={false} showsVerticalScrollIndicator={false} style={{ flexShrink: 1 }}>
          <ThemedView gap={'three'} paddingHorizontal={'five'} paddingVertical={'four'}>
            <ThemedView flexDirection='row' flexWrap='wrap' gap={'two'}>
              {presets.map(preset => {
                const candidate = getPresetRange(preset.value);
                const selected = Boolean(
                  range.start && range.end && dayjs(range.start).isSame(candidate.start, 'day') && dayjs(range.end).isSame(candidate.end, 'day'),
                );
                return <RangeChoice key={preset.value} label={preset.label} onPress={() => selectPreset(preset.value)} selected={selected} />;
              })}
              {onClear ? (
                <RangeChoice
                  label='All time'
                  onPress={() => {
                    setRange({});
                    setAllTime(true);
                  }}
                  selected={allTime}
                />
              ) : null}
            </ThemedView>
            <RangeCalendar
              month={month}
              onChangeMonth={setMonth}
              onSelectDay={date => {
                setRange(current => selectRangeDay(current, date));
                setAllTime(false);
              }}
              range={range}
            />
          </ThemedView>
        </ScrollView>

        <ThemedView
          borderTopColor={Palette.borderSubtle}
          borderTopWidth={1}
          flexDirection='row'
          gap={'three'}
          paddingHorizontal={12}
          paddingTop={'four'}
          safePaddingBottom>
          <RangeAction label='Reset' onPress={handleReset} />
          <RangeAction disabled={!canApply} filled label='Apply' onPress={handleAccept} />
        </ThemedView>
      </ThemedView>
    </Modal>
  );
});

function RangeChoice({ label, onPress, selected }: { label: string; onPress: () => void; selected: boolean }) {
  return (
    <Pressable accessibilityRole='button' accessibilityState={{ selected }} onPress={onPress}>
      {({ pressed }) => (
        <ThemedView
          alignItems='center'
          backgroundColor={selected ? Colors.light.backgroundSelected : Palette.surfaceMuted}
          borderColor={selected ? Palette.accent : Palette.borderSubtle}
          borderRadius={'pill'}
          borderWidth={1}
          justifyContent='center'
          minHeight={36}
          opacity={pressed ? 0.65 : 1}
          paddingHorizontal={'three'}
          paddingVertical={'two'}>
          <ThemedText color={selected ? Palette.accentPressed : Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={12} lineHeight={18}>
            {label}
          </ThemedText>
        </ThemedView>
      )}
    </Pressable>
  );
}

function RangeAction({ disabled = false, filled = false, label, onPress }: { disabled?: boolean; filled?: boolean; label: string; onPress: () => void }) {
  return (
    <ThemedView flex={1}>
      <Pressable accessibilityRole='button' accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}>
        {({ pressed }) => (
          <ThemedView
            alignItems='center'
            borderWidth={1}
            borderColor={filled ? Palette.accent : Palette.borderSubtle}
            backgroundColor={filled ? Palette.accent : Palette.surfaceMuted}
            borderRadius={'medium'}
            justifyContent='center'
            minHeight={52}
            opacity={disabled ? 0.4 : pressed ? 0.7 : 1}
            paddingHorizontal={'four'}
            paddingVertical={'three'}>
            <ThemedText color={filled ? Palette.surfaceBase : Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={15} lineHeight={22}>
              {label}
            </ThemedText>
          </ThemedView>
        )}
      </Pressable>
    </ThemedView>
  );
}
