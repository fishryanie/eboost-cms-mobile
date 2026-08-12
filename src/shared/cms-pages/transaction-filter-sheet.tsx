import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import dayjs from 'dayjs';
import { CalendarDays, Check, Search, X } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { RangePicker, type RangePickerMethods } from 'components/base/RangePicker';
import { ThemedText, ThemedView } from 'components/base';
import { FontFamily, Palette } from 'themes';

export type TransactionVehicle = 'bike' | 'car';
export type TransactionStatusFilter = 'all' | 'crash' | 0 | 1;
export type TransactionDirectionFilter = 'AC' | 'ALL' | 'DC';
export type TransactionSourceFilter = 'eboost' | 'grab' | 'vetc';

export type TransactionFilterValues = {
  clientId: string;
  direction: TransactionDirectionFilter;
  endDate: number;
  id: string;
  invoiceId: string;
  promoCode: string;
  source: TransactionSourceFilter;
  startDate: number;
  stationName: string;
  status: TransactionStatusFilter;
  transactionId: string;
  uniqueId: string;
  userId: string;
  vendorId: string;
};

const filterAccent = '#0B9B55';
const grabUserId = process.env.EXPO_PUBLIC_APP_ENV === 'production' ? 23340 : 22620;
const vetcUserId = process.env.EXPO_PUBLIC_APP_ENV === 'production' ? 33498 : 22644;

export const transactionStatusOptions: { label: string; value: TransactionStatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Charging', value: 0 },
  { label: 'Finished', value: 1 },
  { label: 'Crash', value: 'crash' },
];

export function createDefaultTransactionFilters(userId = ''): TransactionFilterValues {
  return {
    clientId: '',
    direction: 'ALL',
    endDate: dayjs().endOf('month').unix(),
    id: '',
    invoiceId: '',
    promoCode: '',
    source: 'eboost',
    startDate: dayjs().startOf('month').unix(),
    stationName: '',
    status: 'all',
    transactionId: '',
    uniqueId: '',
    userId,
    vendorId: '',
  };
}

function addTrimmedFilter(target: Record<string, number | string>, key: string, value: string) {
  const trimmed = value.trim();
  if (trimmed) target[key] = trimmed;
}

export function buildTransactionApiFilters(values: TransactionFilterValues, vehicle: TransactionVehicle) {
  const filters: Record<string, number | string> = {
    'createdAt[after]': dayjs.unix(values.startDate).startOf('day').format('YYYY-MM-DD HH:mm:ss'),
    'createdAt[before]': dayjs.unix(values.endDate).endOf('day').format('YYYY-MM-DD HH:mm:ss'),
  };

  if (values.status === 'crash') {
    filters.status = 0;
    filters['endTime[lt]'] = dayjs().subtract(5, 'minute').unix();
  } else if (values.status !== 'all') {
    filters.status = values.status;
  }

  addTrimmedFilter(filters, 'id', values.id);
  addTrimmedFilter(filters, 'transactionId', values.transactionId);
  addTrimmedFilter(filters, 'invoiceId', values.invoiceId);
  addTrimmedFilter(filters, 'promoCode', values.promoCode);
  addTrimmedFilter(filters, 'clientId', values.clientId);
  addTrimmedFilter(filters, 'user.id', values.source === 'grab' ? String(grabUserId) : values.source === 'vetc' ? String(vetcUserId) : values.userId);

  const boxKey = vehicle === 'car' ? 'carBox' : 'bikeBox';
  addTrimmedFilter(filters, `${boxKey}.vendorId`, values.vendorId);
  addTrimmedFilter(filters, `${boxKey}.uniqueId`, values.uniqueId);
  addTrimmedFilter(filters, `${boxKey}.station.name`, values.stationName);

  if (vehicle === 'car' && values.direction !== 'ALL') {
    filters['carConnector.portType.currentDirection.type'] = values.direction;
  }

  return filters;
}

export function getTransactionActiveFilterCount(values: TransactionFilterValues, vehicle: TransactionVehicle, fixedUserId?: string) {
  const defaults = createDefaultTransactionFilters();
  const textValues = [
    values.id,
    values.transactionId,
    values.invoiceId,
    values.promoCode,
    values.clientId,
    values.vendorId,
    values.uniqueId,
    values.stationName,
  ];
  const dateChanged =
    !dayjs.unix(values.startDate).isSame(dayjs.unix(defaults.startDate), 'day') || !dayjs.unix(values.endDate).isSame(dayjs.unix(defaults.endDate), 'day');

  return (
    textValues.filter(value => value.trim()).length +
    (values.status === 'all' ? 0 : 1) +
    (fixedUserId ? 0 : values.source === 'eboost' ? (values.userId.trim() ? 1 : 0) : 1) +
    (vehicle === 'car' && values.direction !== 'ALL' ? 1 : 0) +
    (dateChanged ? 1 : 0)
  );
}

type TransactionFilterSheetProps = {
  fixedUserId?: string;
  onApply: (values: TransactionFilterValues) => void;
  onChange: (values: TransactionFilterValues) => void;
  onClose: () => void;
  values: TransactionFilterValues;
  vehicle: TransactionVehicle;
  visible: boolean;
};

export function TransactionFilterSheet({ fixedUserId, onApply, onChange, onClose, values, vehicle, visible }: TransactionFilterSheetProps) {
  const ref = useRef<BottomSheetModal>(null);
  const rangePickerRef = useRef<RangePickerMethods>(null);
  const isPresentedRef = useRef(false);

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
    onClose();
  }

  function updateValue<Key extends keyof TransactionFilterValues>(key: Key, value: TransactionFilterValues[Key]) {
    onChange({ ...values, [key]: value });
  }

  function handleApply() {
    onApply(fixedUserId ? { ...values, source: 'eboost', userId: fixedUserId } : values);
    ref.current?.dismiss();
  }

  function handleReset() {
    onApply(createDefaultTransactionFilters(fixedUserId));
    ref.current?.dismiss();
  }

  const dateLabel = `${dayjs.unix(values.startDate).format('YYYY-MM-DD')}  →  ${dayjs.unix(values.endDate).format('YYYY-MM-DD')}`;

  return (
    <>
      <BottomSheetModal
        backdropComponent={props => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />}
        enableDynamicSizing={false}
        keyboardBehavior='interactive'
        keyboardBlurBehavior='restore'
        onDismiss={handleDismiss}
        ref={ref}
        snapPoints={['92%']}>
        <ThemedView backgroundColor={Palette.surfaceRaised} flex={1}>
          <ThemedView
            alignItems='center'
            borderBottomColor={Palette.borderSubtle}
            borderBottomWidth={StyleSheet.hairlineWidth}
            flexDirection='row'
            justifyContent='space-between'
            paddingBottom={'three'}
            paddingLeft={'four'}
            paddingRight={72}>
            <ThemedView backgroundColor='transparent'>
              <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={22} lineHeight={28}>
                Filter transactions
              </ThemedText>
              <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={12} lineHeight={18}>
                {vehicle === 'car' ? 'Car' : 'Bike'} records
              </ThemedText>
            </ThemedView>
            <Pressable accessibilityLabel='Close filters' accessibilityRole='button' hitSlop={8} onPress={() => ref.current?.dismiss()}>
              <ThemedView alignItems='center' backgroundColor={Palette.surfaceMuted} borderRadius={'pill'} height={36} justifyContent='center' width={36}>
                <X color={Palette.textSecondary} size={20} />
              </ThemedView>
            </Pressable>
          </ThemedView>

          <BottomSheetScrollView
            contentContainerStyle={{ gap: 22, paddingBottom: 28, paddingHorizontal: 16, paddingTop: 18 }}
            keyboardShouldPersistTaps='handled'
            style={styles.scroll}>
            <FilterSection label='Date range'>
              <Pressable accessibilityLabel={`Date range ${dateLabel}`} accessibilityRole='button' onPress={() => rangePickerRef.current?.open()}>
                <ThemedView
                  alignItems='center'
                  backgroundColor={Palette.surfaceBase}
                  borderColor={Palette.borderSubtle}
                  borderRadius={'large'}
                  borderWidth={1}
                  flexDirection='row'
                  gap={'three'}
                  minHeight={48}
                  paddingHorizontal={'three'}>
                  <CalendarDays color={filterAccent} size={19} />
                  <ThemedText color={Palette.textPrimary} flex={1} fontFamily={FontFamily.semibold} fontSize={14} lineHeight={20}>
                    {dateLabel}
                  </ThemedText>
                </ThemedView>
              </Pressable>
            </FilterSection>

            <FilterSection label='Status'>
              <ThemedView backgroundColor='transparent' flexDirection='row' flexWrap='wrap' gap={'two'}>
                {transactionStatusOptions.map(option => (
                  <FilterChoice
                    key={String(option.value)}
                    label={option.label}
                    onPress={() => updateValue('status', option.value)}
                    selected={values.status === option.value}
                  />
                ))}
              </ThemedView>
            </FilterSection>

            {fixedUserId ? (
              <FilterSection label='Profile scope'>
                <ThemedView backgroundColor='#F0FBF5' borderColor='#B7E8CC' borderRadius={'large'} borderWidth={1} gap={2} padding={'three'}>
                  <ThemedText color={filterAccent} fontFamily={FontFamily.bold} fontSize={13} selectable>
                    User #{fixedUserId}
                  </ThemedText>
                  <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={11} lineHeight={16}>
                    This filter is locked to the profile you are viewing.
                  </ThemedText>
                </ThemedView>
              </FilterSection>
            ) : (
              <FilterSection label='Source'>
                <ThemedView backgroundColor='transparent' flexDirection='row' gap={'three'}>
                  <SourceChoice
                    label='Only Grab'
                    onPress={() => updateValue('source', values.source === 'grab' ? 'eboost' : 'grab')}
                    selected={values.source === 'grab'}
                  />
                  <SourceChoice
                    label='Only VETC'
                    onPress={() => updateValue('source', values.source === 'vetc' ? 'eboost' : 'vetc')}
                    selected={values.source === 'vetc'}
                  />
                </ThemedView>
              </FilterSection>
            )}

            <FilterSection label='Transaction'>
              <ThemedView backgroundColor='transparent' flexDirection='row' flexWrap='wrap' gap={'two'}>
                <FilterInput onChangeText={value => updateValue('id', value)} placeholder='Record ID' value={values.id} />
                <FilterInput onChangeText={value => updateValue('transactionId', value)} placeholder='Transaction ID' value={values.transactionId} />
                <FilterInput onChangeText={value => updateValue('invoiceId', value)} placeholder='Invoice ID' value={values.invoiceId} />
                <FilterInput onChangeText={value => updateValue('clientId', value)} placeholder='External ID' value={values.clientId} />
                {!fixedUserId ? <FilterInput onChangeText={value => updateValue('userId', value)} placeholder='User ID' value={values.userId} /> : null}
                <FilterInput onChangeText={value => updateValue('promoCode', value)} placeholder='Promo Code' value={values.promoCode} />
              </ThemedView>
            </FilterSection>

            <FilterSection label='Charger'>
              <ThemedView backgroundColor='transparent' flexDirection='row' flexWrap='wrap' gap={'two'}>
                <FilterInput onChangeText={value => updateValue('vendorId', value)} placeholder='Vendor' value={values.vendorId} />
                <FilterInput onChangeText={value => updateValue('uniqueId', value)} placeholder='Unique' value={values.uniqueId} />
                <FilterInput fullWidth onChangeText={value => updateValue('stationName', value)} placeholder='Station Name' value={values.stationName} />
              </ThemedView>
              {vehicle === 'car' ? (
                <ThemedView backgroundColor='transparent' flexDirection='row' gap={'two'} paddingTop={'three'}>
                  {(['AC', 'DC', 'ALL'] as const).map(direction => (
                    <DirectionChoice
                      key={direction}
                      label={direction}
                      onPress={() => updateValue('direction', direction)}
                      selected={values.direction === direction}
                    />
                  ))}
                </ThemedView>
              ) : null}
            </FilterSection>
          </BottomSheetScrollView>

          <ThemedView
            backgroundColor={Palette.surfaceBase}
            borderTopColor={Palette.borderSubtle}
            borderTopWidth={StyleSheet.hairlineWidth}
            flexDirection='row'
            gap={'three'}
            paddingHorizontal={'four'}
            paddingTop={'three'}
            safePaddingBottom={'three'}>
            <SheetButton label='Reset All' onPress={handleReset} />
            <SheetButton filled label='Apply' onPress={handleApply} />
          </ThemedView>
        </ThemedView>
      </BottomSheetModal>

      <RangePicker
        onChange={range => onChange({ ...values, endDate: range[1], startDate: range[0] })}
        ref={rangePickerRef}
        value={[values.startDate, values.endDate]}
      />
    </>
  );
}

function FilterSection({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <ThemedView backgroundColor='transparent'>
      <ThemedText
        color={Palette.textTertiary}
        fontFamily={FontFamily.semibold}
        fontSize={11}
        letterSpacing={1.5}
        lineHeight={16}
        marginBottom={'two'}
        textTransform='uppercase'>
        {label}
      </ThemedText>
      {children}
    </ThemedView>
  );
}

function FilterChoice({ label, onPress, selected }: { label: string; onPress: () => void; selected: boolean }) {
  return (
    <Pressable
      accessibilityRole='button'
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({ flexBasis: '48%', flexGrow: 1, opacity: pressed ? 0.72 : 1 })}>
      <ThemedView
        alignItems='center'
        backgroundColor={selected ? '#F0FBF5' : Palette.surfaceBase}
        borderColor={selected ? filterAccent : Palette.borderSubtle}
        borderRadius={'large'}
        borderWidth={1.25}
        flexDirection='row'
        justifyContent='space-between'
        minHeight={48}
        paddingHorizontal={'three'}>
        <ThemedText color={Palette.textPrimary} fontFamily={selected ? FontFamily.bold : FontFamily.medium} fontSize={14} lineHeight={20}>
          {label}
        </ThemedText>
        {selected ? (
          <ThemedView alignItems='center' backgroundColor='#DCF7E8' borderRadius={'pill'} height={26} justifyContent='center' paddingHorizontal={'two'}>
            <ThemedText color={filterAccent} fontFamily={FontFamily.bold} fontSize={11}>
              On
            </ThemedText>
          </ThemedView>
        ) : null}
      </ThemedView>
    </Pressable>
  );
}

function SourceChoice({ label, onPress, selected }: { label: string; onPress: () => void; selected: boolean }) {
  return (
    <Pressable
      accessibilityRole='checkbox'
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.72 : 1 })}>
      <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={'two'} minHeight={40}>
        <ThemedView
          alignItems='center'
          backgroundColor={selected ? filterAccent : Palette.surfaceBase}
          borderColor={selected ? filterAccent : Palette.border}
          borderRadius={6}
          borderWidth={1.5}
          height={22}
          justifyContent='center'
          width={22}>
          {selected ? <Check color='#FFFFFF' size={15} strokeWidth={3} /> : null}
        </ThemedView>
        <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.medium} fontSize={14} lineHeight={20}>
          {label}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

function FilterInput({
  fullWidth = false,
  onChangeText,
  placeholder,
  value,
}: {
  fullWidth?: boolean;
  onChangeText: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <ThemedView
      alignItems='center'
      backgroundColor={Palette.surfaceBase}
      borderColor={Palette.borderSubtle}
      borderRadius={'large'}
      borderWidth={1}
      flexBasis={fullWidth ? '100%' : '48%'}
      flexDirection='row'
      flexGrow={1}
      minHeight={46}
      paddingHorizontal={'three'}>
      <Search color={Palette.textTertiary} size={16} />
      <BottomSheetTextInput
        autoCapitalize='none'
        autoCorrect={false}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Palette.textTertiary}
        style={styles.input}
        value={value}
      />
    </ThemedView>
  );
}

function DirectionChoice({ label, onPress, selected }: { label: string; onPress: () => void; selected: boolean }) {
  return (
    <Pressable
      accessibilityRole='button'
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.72 : 1 })}>
      <ThemedView
        alignItems='center'
        backgroundColor={selected ? filterAccent : Palette.surfaceBase}
        borderColor={selected ? filterAccent : Palette.borderSubtle}
        borderRadius={'large'}
        borderWidth={1}
        justifyContent='center'
        minHeight={42}>
        <ThemedText color={selected ? '#FFFFFF' : Palette.textSecondary} fontFamily={FontFamily.bold} fontSize={13}>
          {label}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

function SheetButton({ filled = false, label, onPress }: { filled?: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole='button' onPress={onPress} style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.76 : 1 })}>
      <ThemedView
        alignItems='center'
        backgroundColor={filled ? filterAccent : Palette.surfaceBase}
        borderColor={filled ? filterAccent : Palette.border}
        borderRadius={'large'}
        borderWidth={1}
        justifyContent='center'
        minHeight={48}>
        <ThemedText color={filled ? '#FFFFFF' : Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={15}>
          {label}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  input: {
    color: Palette.textPrimary,
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: 13,
    minHeight: 44,
    paddingHorizontal: 8,
    paddingVertical: 0,
  },
  scroll: {
    flex: 1,
  },
});
