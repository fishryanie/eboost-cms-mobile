import { AppButton } from 'components/ui';
import { forwardRef, useImperativeHandle, useState } from 'react';
import CalendarPicker, { DateChangedCallback } from 'react-native-calendar-picker';
import Modal from 'react-native-modal';
import { Palette } from 'themes';
import { width } from 'themes/scaling';
import { ViewTheme } from '../ThemedView';

interface RangePickerProps {
  onChange: (value: number[]) => void;
  value?: number[];
}
export interface RangePickerMethods {
  open: () => void;
}

export const RangePicker = forwardRef<RangePickerMethods, RangePickerProps>(({ onChange, value }, ref) => {
  const [isShow, setShow] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const handleDateChange: DateChangedCallback = (date, type) => {
    if (type === 'END_DATE') {
      setEndDate(date);
    } else {
      if (startDate === date) {
        setStartDate(undefined);
        setEndDate(undefined);
      } else {
        setStartDate(date);
        setEndDate(undefined);
      }
    }
  };

  const handleAccept = () => {
    if (startDate && endDate) {
      const startTime = new Date(startDate).getTime();
      const endTime = new Date(endDate).getTime();
      onChange([startTime / 1000, endTime / 1000]);
      setShow(false);
    }
  };

  useImperativeHandle(
    ref,
    () => ({
      open: () => {
        setStartDate(value?.[0] ? new Date(value[0] * 1000) : undefined);
        setEndDate(value?.[1] ? new Date(value[1] * 1000) : undefined);
        setShow(true);
      },
    }),
    [value],
  );

  return (
    <Modal
      isVisible={isShow}
      coverScreen={true}
      animationInTiming={500}
      animationOutTiming={500}
      animationIn='fadeInUp'
      animationOut='fadeOutDown'
      backdropTransitionInTiming={500}
      backdropTransitionOutTiming={500}
      onBackdropPress={() => setShow(false)}>
      <ViewTheme radius={24} padding={12} backgroundColor={Palette.surfaceBase}>
        <CalendarPicker
          allowRangeSelection={true}
          startFromMonday={true}
          todayBackgroundColor={Palette.borderSubtle}
          selectedDayColor={Palette.accent}
          selectedDayTextColor={Palette.surfaceBase}
          selectedStartDate={startDate}
          selectedEndDate={endDate}
          width={width - 64}
          onDateChange={handleDateChange}
        />
        <AppButton disabled={!startDate || !endDate} label='Confirm' onPress={handleAccept} style={{ marginTop: 16 }} />
      </ViewTheme>
    </Modal>
  );
});

RangePicker.displayName = 'RangePicker';
