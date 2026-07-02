import { AppButton } from 'components/ui';
import { forwardRef, useImperativeHandle, useState } from 'react';
import CalendarPicker, { DateChangedCallback } from 'react-native-calendar-picker';
import Modal from 'react-native-modal';
import { FontFamily, Palette } from 'themes';
import { width } from 'themes/scaling';
import { ThemedText } from '../ThemedText';
import { ViewTheme } from '../ThemedView';

interface DatePickerProps {
  onChange: (value: number) => void;
}

export interface DatePickerMethods {
  open: () => void;
}

export const DatePicker = forwardRef<DatePickerMethods, DatePickerProps>(function DatePicker({ onChange }, ref) {
  const [isShow, setShow] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();

  const handleDateChange: DateChangedCallback = date => {
    setSelectedDate(date);
  };

  const handleAccept = () => {
    if (!selectedDate) return;
    onChange(new Date(selectedDate).getTime() / 1000);
    setShow(false);
  };

  useImperativeHandle(ref, () => ({
    open: () => setShow(true),
  }));

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
        <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={18} marginBottom={4} textAlign='center'>
          Select date
        </ThemedText>
        <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={13} marginBottom={12} textAlign='center'>
          Choose the new end date.
        </ThemedText>
        <CalendarPicker
          startFromMonday={true}
          todayBackgroundColor={Palette.borderSubtle}
          selectedDayColor={Palette.accent}
          selectedDayTextColor={Palette.surfaceBase}
          selectedStartDate={selectedDate}
          width={width - 64}
          onDateChange={handleDateChange}
        />
        <AppButton disabled={!selectedDate} label='Confirm' onPress={handleAccept} style={{ marginTop: 16 }} />
      </ViewTheme>
    </Modal>
  );
});
