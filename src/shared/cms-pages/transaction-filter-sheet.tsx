import dayjs from 'dayjs';
import { CalendarDays, Check } from 'lucide-react-native';
import { useRef } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, TextInput, useWindowDimensions } from 'react-native';
import Modal from 'react-native-modal';

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
  const rangePickerRef = useRef<RangePickerMethods>(null);
  const { height } = useWindowDimensions();

  function updateValue<Key extends keyof TransactionFilterValues>(key: Key, value: TransactionFilterValues[Key]) {
    onChange({ ...values, [key]: value });
  }

  function handleApply() {
    onApply(fixedUserId ? { ...values, source: 'eboost', userId: fixedUserId } : values);
    onClose();
  }

  function handleReset() {
    onApply(createDefaultTransactionFilters(fixedUserId));
    onClose();
  }

  const dateLabel = `${dayjs.unix(values.startDate).format('YYYY-MM-DD')}  →  ${dayjs.unix(values.endDate).format('YYYY-MM-DD')}`;

  return (
    <>
      <Modal avoidKeyboard isVisible={visible} onBackButtonPress={onClose} onBackdropPress={onClose} style={{ justifyContent: 'flex-end', margin: 0 }}>
        <KeyboardAvoidingView behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined} style={{ justifyContent: 'flex-end' }}>
          <ThemedView
            backgroundColor={Palette.surfaceBase}
            borderTopLeftRadius={'large'}
            borderTopRightRadius={'large'}
            maxHeight={height * 0.92}
            overflow='hidden'>
            <ThemedView
              alignItems='center'
              borderBottomColor={Palette.borderSubtle}
              borderBottomWidth={1}
              flexDirection='row'
              justifyContent='space-between'
              padding={'three'}>
              <ThemedView backgroundColor='transparent' flex={1}>
                <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={18}>
                  Filter transactions
                </ThemedText>
                <ThemedText color={Palette.textTertiary} fontSize={12} lineHeight={17}>
                  {vehicle === 'car' ? 'Car' : 'Bike'} transaction records
                </ThemedText>
              </ThemedView>
              <Pressable accessibilityLabel='Close filters' accessibilityRole='button' onPress={onClose}>
                <ThemedText color={Palette.accent} fontFamily={FontFamily.semibold} fontSize={13}>
                  Close
                </ThemedText>
              </Pressable>
            </ThemedView>

            <ScrollView
              contentContainerStyle={{ gap: 20, padding: 12, paddingBottom: 28 }}
              contentInsetAdjustmentBehavior='automatic'
              keyboardShouldPersistTaps='handled'
              showsVerticalScrollIndicator={false}
              style={{ flexShrink: 1 }}>
              <FilterSection description='Choose the period and charging result.' label='Overview'>
                <ThemedView backgroundColor='transparent' gap={'two'}>
                  <FieldLabel label='Date range' />
                  <Pressable accessibilityLabel={`Date range ${dateLabel}`} accessibilityRole='button' onPress={() => rangePickerRef.current?.open()}>
                    <ThemedView
                      alignItems='center'
                      backgroundColor={Palette.surfaceMuted}
                      borderColor={Palette.borderSubtle}
                      borderRadius={14}
                      borderWidth={1}
                      flexDirection='row'
                      gap={'three'}
                      minHeight={48}
                      paddingHorizontal={'three'}>
                      <CalendarDays color={Palette.accent} size={18} />
                      <ThemedText color={Palette.textPrimary} flex={1} fontSize={14} lineHeight={20}>
                        {dateLabel}
                      </ThemedText>
                    </ThemedView>
                  </Pressable>
                </ThemedView>
                <ThemedView backgroundColor='transparent' gap={'two'} paddingTop={'three'}>
                  <FieldLabel label='Status' />
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
                </ThemedView>
              </FilterSection>

              {fixedUserId ? (
                <FilterSection description='This filter is locked to the profile you are viewing.' label='Profile scope'>
                  <ThemedView backgroundColor={Palette.surfaceMuted} borderColor={Palette.borderSubtle} borderRadius={14} borderWidth={1} padding={'three'}>
                    <ThemedText color={Palette.accent} fontFamily={FontFamily.semibold} fontSize={14} selectable>
                      User #{fixedUserId}
                    </ThemedText>
                  </ThemedView>
                </FilterSection>
              ) : (
                <FilterSection description='Optionally limit results to an integration source.' label='Source'>
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

              <FilterSection description='Search by transaction and customer identifiers.' label='Transaction'>
                <ThemedView backgroundColor='transparent' gap={'three'}>
                  <FilterInput label='Record ID' onChangeText={value => updateValue('id', value)} value={values.id} />
                  <FilterInput label='Transaction ID' onChangeText={value => updateValue('transactionId', value)} value={values.transactionId} />
                  <FilterInput label='Invoice ID' onChangeText={value => updateValue('invoiceId', value)} value={values.invoiceId} />
                  <FilterInput label='External ID' onChangeText={value => updateValue('clientId', value)} value={values.clientId} />
                  {!fixedUserId ? <FilterInput label='User ID' onChangeText={value => updateValue('userId', value)} value={values.userId} /> : null}
                  <FilterInput label='Promo code' onChangeText={value => updateValue('promoCode', value)} value={values.promoCode} />
                </ThemedView>
              </FilterSection>

              <FilterSection description='Search by charging hardware and station.' label='Charger'>
                <ThemedView backgroundColor='transparent' gap={'three'}>
                  <FilterInput label='Vendor ID' onChangeText={value => updateValue('vendorId', value)} value={values.vendorId} />
                  <FilterInput label='Unique ID' onChangeText={value => updateValue('uniqueId', value)} value={values.uniqueId} />
                  <FilterInput label='Station name' onChangeText={value => updateValue('stationName', value)} value={values.stationName} />
                  {vehicle === 'car' ? (
                    <ThemedView backgroundColor='transparent' gap={'two'}>
                      <FieldLabel label='Current direction' />
                      <ThemedView backgroundColor='transparent' flexDirection='row' gap={'two'}>
                        {(['AC', 'DC', 'ALL'] as const).map(direction => (
                          <DirectionChoice
                            key={direction}
                            label={direction}
                            onPress={() => updateValue('direction', direction)}
                            selected={values.direction === direction}
                          />
                        ))}
                      </ThemedView>
                    </ThemedView>
                  ) : null}
                </ThemedView>
              </FilterSection>
            </ScrollView>

            <ThemedView
              backgroundColor={Palette.surfaceBase}
              borderTopColor={Palette.borderSubtle}
              borderTopWidth={1}
              flexDirection='row'
              gap={'three'}
              paddingHorizontal={'three'}
              paddingTop={'three'}
              safePaddingBottom={'three'}>
              <SheetButton label='Reset all' onPress={handleReset} />
              <SheetButton filled label='Apply filters' onPress={handleApply} />
            </ThemedView>
          </ThemedView>
        </KeyboardAvoidingView>
      </Modal>

      <RangePicker
        onChange={range => onChange({ ...values, endDate: range[1], startDate: range[0] })}
        ref={rangePickerRef}
        value={[values.startDate, values.endDate]}
      />
    </>
  );
}

function FilterSection({ children, description, label }: { children: React.ReactNode; description: string; label: string }) {
  return (
    <ThemedView backgroundColor='transparent' gap={'three'}>
      <ThemedView backgroundColor='transparent' gap={'one'} paddingHorizontal={'one'}>
        <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={16}>
          {label}
        </ThemedText>
        <ThemedText color={Palette.textTertiary} fontSize={12} lineHeight={17}>
          {description}
        </ThemedText>
      </ThemedView>
      {children}
    </ThemedView>
  );
}

function FieldLabel({ label }: { label: string }) {
  return (
    <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={13}>
      {label}
    </ThemedText>
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
        backgroundColor={Palette.surfaceMuted}
        borderColor={selected ? Palette.accent : Palette.borderSubtle}
        borderRadius={14}
        borderWidth={1}
        flexDirection='row'
        justifyContent='space-between'
        minHeight={48}
        paddingHorizontal={'three'}>
        <ThemedText color={Palette.textPrimary} fontFamily={selected ? FontFamily.bold : FontFamily.medium} fontSize={14} lineHeight={20}>
          {label}
        </ThemedText>
        {selected ? <Check color={Palette.accent} size={18} strokeWidth={2.5} /> : null}
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
      <ThemedView
        alignItems='center'
        backgroundColor={Palette.surfaceMuted}
        borderColor={selected ? Palette.accent : Palette.borderSubtle}
        borderRadius={14}
        borderWidth={1}
        flexDirection='row'
        gap={'two'}
        minHeight={48}
        paddingHorizontal={'three'}>
        <ThemedView
          alignItems='center'
          backgroundColor={selected ? Palette.accent : Palette.surfaceBase}
          borderColor={selected ? Palette.accent : Palette.border}
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

function FilterInput({ label, onChangeText, value }: { label: string; onChangeText: (value: string) => void; value: string }) {
  return (
    <ThemedView backgroundColor='transparent' gap={'two'}>
      <FieldLabel label={label} />
      <TextInput
        autoCapitalize='none'
        autoCorrect={false}
        onChangeText={onChangeText}
        placeholder={label}
        placeholderTextColor={Palette.textTertiary}
        style={{
          backgroundColor: Palette.surfaceMuted,
          borderColor: Palette.borderSubtle,
          borderRadius: 14,
          borderWidth: 1,
          color: Palette.textPrimary,
          fontFamily: FontFamily.medium,
          fontSize: 14,
          minHeight: 46,
          paddingHorizontal: 12,
          paddingVertical: 10,
        }}
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
        backgroundColor={selected ? Palette.accent : Palette.surfaceMuted}
        borderColor={selected ? Palette.accent : Palette.borderSubtle}
        borderRadius={14}
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
        backgroundColor={filled ? Palette.accent : Palette.surfaceBase}
        borderColor={filled ? Palette.accent : Palette.border}
        borderRadius={14}
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
