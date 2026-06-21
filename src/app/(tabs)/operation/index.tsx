import { mhs } from "themes/scaling";
import { BottomSheetBackdrop, BottomSheetFlatList, BottomSheetModal, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ChevronLeft, ChevronsRight, Mail, ShieldCheck } from 'lucide-react-native';
import { type ComponentProps, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText, ThemedView } from 'components/base';

import { TabIcon, type TabIconName } from 'components/tab-icon';
import { UserCard } from 'shared/users/components/user-card';
import { biometricCredentialStore } from 'utils/auth/biometric-credentials';
import { useInfiniteUsers, userKeys } from 'shared/users/hooks';
import { AppButton, EmptyState } from 'components/ui';
import { FontFamily, Palette } from 'themes';

import {
  adjustUserBalance,
  confirmAdminPassword,
  fetchAtRiskUsers,
  fetchTopStations,
  fetchTopUsers,
  fetchUserGrowth,
  fetchUserGrowthChart,
  fetchUserLevels,
  getCollectionData,
  transferMoneyUsers,
  updateUserEmail,
  updateUserPassword,
  updateUserRanking,
  type AtRiskUserItem,
  type BalanceAdjustmentType,
  type TopStationPerformanceItem,
  type TopUserPerformanceItem,
  type UserGrowthChartItem,
  type UserGrowthSummary } from 'shared/operation/operation-user-service';

type OperationServiceKey = 'adjust-balance' | 'transfer-money' | 'modify-ranking' | 'change-email' | 'change-password';
type WizardStep = 'auth' | 'input' | 'result';
type ResultState = { message: string; status: 'error' | 'success'; title: string };
type SymbolName = ComponentProps<typeof SymbolView>['name'];

type OperationService = {
  accentColor: string;
  description: string;
  icon: TabIconName;
  key: OperationServiceKey;
  title: string;
};

const screenHorizontalPadding = 18;
const serviceTileSize = 82;
const operationAccent = '#E46B2C';
const emptyUsers: UserListItem[] = [];
const emptyTopUsers: TopUserPerformanceItem[] = [];
const emptyTopStations: TopStationPerformanceItem[] = [];
const emptyAtRiskUsers: AtRiskUserItem[] = [];
const emptyGrowth: UserGrowthChartItem[] = [];

const operationServices: OperationService[] = [
  {
    accentColor: '#0F9F6E',
    description: 'Add or deduct user wallet balance.',
    icon: 'balance',
    key: 'adjust-balance',
    title: 'Adjust Balance' },
  {
    accentColor: '#2563EB',
    description: 'Move balance from one user to another.',
    icon: 'transfer',
    key: 'transfer-money',
    title: 'Transfer Money' },
  {
    accentColor: '#B45309',
    description: 'Update membership ranking.',
    icon: 'users',
    key: 'modify-ranking',
    title: 'Modify Ranking' },
  {
    accentColor: '#C026D3',
    description: 'Replace account email.',
    icon: 'notification',
    key: 'change-email',
    title: 'Change Email' },
  {
    accentColor: '#DC2626',
    description: 'Set a new user password.',
    icon: 'technical',
    key: 'change-password',
    title: 'Change Password' },
];

const currencyFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const compactFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1, notation: 'compact' });
const decimalFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });

function formatCurrency(value?: number | string | null) {
  return `${currencyFormatter.format(Number(value) || 0)} đ`;
}

function formatNumber(value?: number | string | null) {
  return compactFormatter.format(Number(value) || 0);
}

function formatFullNumber(value?: number | string | null) {
  return currencyFormatter.format(Number(value) || 0);
}

function formatDurationMinutes(value?: number | string | null) {
  const minutes = Math.round(Number(value) || 0);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`;
}

function formatPercent(value?: number | string | null) {
  const percent = Number(value);

  if (!Number.isFinite(percent)) {
    return '--';
  }

  return `${percent > 0 ? '+' : ''}${decimalFormatter.format(percent)}%`;
}

function formatGrowthMonth(value?: string) {
  if (!value) {
    return '--';
  }

  const [year, month] = value.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

function getUserName(user?: Pick<UserListItem, 'email' | 'id' | 'name' | 'username'>) {
  if (!user) return '--';
  return user.name || user.email || user.username || `User #${user.id}`;
}

function getLastMonthsRange(months = 12) {
  const end = new Date();
  const start = new Date(end.getFullYear(), end.getMonth() - months + 1, 1);
  return {
    endDate: end.toISOString().slice(0, 10),
    startDate: start.toISOString().slice(0, 10) };
}

function chunkItems<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function getUserLevelLabel(level?: UserLevel | null) {
  return level?.nameVn || level?.name_vn || level?.name || (level?.id ? `Level #${level.id}` : '--');
}

function parseApiError(error: unknown) {
  return error instanceof Error ? error.message : 'Operation failed. Please try again.';
}

export default function OperationScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();
  const [selectedService, setSelectedService] = useState<OperationService | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const topUsersQuery = useQuery({ queryFn: () => fetchTopUsers(), queryKey: ['operation', 'top-users'] });
  const topStationsQuery = useQuery({ queryFn: () => fetchTopStations(), queryKey: ['operation', 'top-stations'] });
  const atRiskQuery = useQuery({ queryFn: () => fetchAtRiskUsers(), queryKey: ['operation', 'at-risk-users'] });
  const growthRange = useMemo(() => getLastMonthsRange(12), []);
  const growthQuery = useQuery({ queryFn: () => fetchUserGrowth(), queryKey: ['operation', 'user-growth'] });
  const growthChartQuery = useQuery({ queryFn: () => fetchUserGrowthChart(growthRange), queryKey: ['operation', 'user-growth-chart', growthRange] });
  const tileWidth = Math.min(serviceTileSize, Math.floor((width - screenHorizontalPadding * 2 - mhs(12) * 3) / 4));
  const isRefreshing =
    topUsersQuery.isRefetching || topStationsQuery.isRefetching || atRiskQuery.isRefetching || growthQuery.isRefetching || growthChartQuery.isRefetching;

  const openService = useCallback((service: OperationService) => {
    setSelectedService(service);
    setSelectedUser(null);
    setIsPickerOpen(true);
  }, []);

  const closeWizard = useCallback(() => {
    setSelectedService(null);
    setSelectedUser(null);
    setIsPickerOpen(false);
  }, []);

  const handleUserNext = useCallback((user: UserListItem) => {
    setSelectedUser(user);
    setIsPickerOpen(false);
  }, []);

  if (selectedService && selectedUser) {
    return (
      <OperationUserWizard
        service={selectedService}
        user={selectedUser}
        onBack={() => {
          setSelectedUser(null);
          setIsPickerOpen(true);
        }}
        onDone={closeWizard}
      />
    );
  }

  return (
    <>
      <ThemedView safePaddingBottom flex={1} backgroundColor={Palette.surfaceBase}>
        <FlatList
          contentContainerStyle={styles.content}
          data={[]}
          keyExtractor={(_, index) => String(index)}
          ListEmptyComponent={
            <ThemedView gap={'five'} paddingHorizontal={screenHorizontalPadding}>
              <ThemedView>
                <ThemedText fontFamily="bold" fontSize={34} lineHeight={40} letterSpacing={-0.5}>Operation</ThemedText>
                <ThemedText fontSize={16} color={Palette.textSecondary} marginTop={mhs(4)}>User service, account actions, and operational performance</ThemedText>
              </ThemedView>
              <OperationServicesSection onSelectService={openService} tileWidth={tileWidth} />
              <OperationStatsSection
                atRiskUsers={getCollectionData(atRiskQuery.data) || emptyAtRiskUsers}
                growth={getCollectionData(growthChartQuery.data) || emptyGrowth}
                growthSummary={growthQuery.data?.data}
                isLoading={
                  topUsersQuery.isLoading || topStationsQuery.isLoading || atRiskQuery.isLoading || growthQuery.isLoading || growthChartQuery.isLoading
                }
                onViewMoreTopStations={() => router.push('/operation/locations')}
                onViewMoreTopUsers={() => router.push('/operation/users')}
                topStations={getCollectionData(topStationsQuery.data) || emptyTopStations}
                topUsers={getCollectionData(topUsersQuery.data) || emptyTopUsers}
              />
            </ThemedView>
          }
          refreshControl={
            <RefreshControl
              onRefresh={() => {
                void topUsersQuery.refetch();
                void topStationsQuery.refetch();
                void atRiskQuery.refetch();
                void growthQuery.refetch();
                void growthChartQuery.refetch();
              }}
              refreshing={isRefreshing}
              tintColor={Palette.accent}
            />
          }
          renderItem={null}
          showsVerticalScrollIndicator={false}
        />
      </ThemedView>
      <UserPickerSheet
        onClose={() => setIsPickerOpen(false)}
        onNext={handleUserNext}
        service={selectedService}
        visible={isPickerOpen && Boolean(selectedService)}
      />
    </>
  );
}

function OperationServicesSection({ onSelectService, tileWidth }: { onSelectService: (service: OperationService) => void; tileWidth: number }) {
  const rows = chunkItems(operationServices, 4);

  return (
    <ThemedView gap={'three'}>
      <SectionTitle subtitle='Same user service shortcuts used by CMS.' title='User Services' />
      <ThemedView gap={'three'}>
        {rows.map((row, rowIndex) => (
          <ThemedView flexDirection='row' justifyContent='space-between' key={`operation-service-row-${rowIndex}`} style={styles.serviceRow}>
            {row.map(service => (
              <ServiceShortcut key={service.key} onPress={() => onSelectService(service)} service={service} tileWidth={tileWidth} />
            ))}
            {row.length < 4
              ? Array.from({ length: 4 - row.length }).map((_, index) => <ThemedView key={`operation-service-spacer-${rowIndex}-${index}`} width={tileWidth} />)
              : null}
          </ThemedView>
        ))}
      </ThemedView>
    </ThemedView>
  );
}

function ServiceShortcut({ onPress, service, tileWidth }: { onPress: () => void; service: OperationService; tileWidth: number }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.serviceTile, { width: tileWidth }, pressed && styles.pressed]}>
      <ThemedView style={styles.serviceIcon}>
        <TabIcon color={Palette.textTertiary} name={service.icon} size={23} />
      </ThemedView>
      <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.medium} fontSize={10} lineHeight={13} numberOfLines={2} textAlign='center'>
        {service.title}
      </ThemedText>
    </Pressable>
  );
}

function UserPickerSheet({
  onClose,
  onNext,
  service,
  visible }: {
  onClose: () => void;
  onNext: (user: UserListItem) => void;
  service: OperationService | null;
  visible: boolean;
}) {
  const ref = useRef<BottomSheetModal>(null);
  const { bottom } = useSafeAreaInsets();
  const [queryInput, setQueryInput] = useState('');
  const [query, setQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const usersQuery = useInfiniteUsers(query);
  const users = useMemo(() => usersQuery.data?.pages.flatMap(page => page.items) || emptyUsers, [usersQuery.data]);

  useEffect(() => {
    if (visible) {
      ref.current?.present();
      return;
    }
    ref.current?.dismiss();
  }, [visible]);

  useEffect(() => {
    const timeout = setTimeout(() => setQuery(queryInput.trim()), 350);
    return () => clearTimeout(timeout);
  }, [queryInput]);

  const loadMore = useCallback(() => {
    if (usersQuery.hasNextPage && !usersQuery.isFetchingNextPage) {
      void usersQuery.fetchNextPage();
    }
  }, [usersQuery]);

  return (
    <BottomSheetModal
      backdropComponent={props => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />}
      enableDynamicSizing={false}
      onDismiss={onClose}
      ref={ref}
      snapPoints={['72%', '88%']}>
      <ThemedView style={[styles.sheetHeader, { paddingBottom: mhs(12) }]}>
        <ThemedView flex={1} minWidth={0}>
          <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={18} lineHeight={24}>
            Select User
          </ThemedText>
          <ThemedText numberOfLines={1} color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={12} marginTop={2}>
            {service?.title || 'Operation service'}
          </ThemedText>
        </ThemedView>
        <AppButton disabled={!selectedUser} label='Next' onPress={() => selectedUser && onNext(selectedUser)} style={styles.sheetNextButton} />
      </ThemedView>
      <ThemedView paddingHorizontal={'four'} paddingBottom={'three'}>
        <BottomSheetTextInput
          autoCapitalize='none'
          autoCorrect={false}
          onChangeText={setQueryInput}
          placeholder='Search ID, phone, or email'
          placeholderTextColor='#98A2B3'
          returnKeyType='search'
          style={styles.search}
          value={queryInput}
        />
      </ThemedView>
      <BottomSheetFlatList
        contentContainerStyle={[styles.sheetList, { paddingBottom: bottom + 'five' }]}
        data={users}
        keyExtractor={user => String(user.id)}
        ListEmptyComponent={
          usersQuery.isLoading ? (
            <ThemedView gap={'three'} paddingTop={'six'}>
              <ActivityIndicator color={Palette.accent} />
              <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={14} textAlign='center'>
                Loading users
              </ThemedText>
            </ThemedView>
          ) : usersQuery.isError ? (
            <EmptyState message='The user list could not be loaded.' title='Users unavailable' />
          ) : (
            <EmptyState message={query ? 'Try another ID, phone number, or email.' : 'No user records were returned.'} title='No users found' />
          )
        }
        ListFooterComponent={usersQuery.isFetchingNextPage ? <ActivityIndicator color={Palette.accent} style={styles.footerLoader} /> : null}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        renderItem={({ item }) => (
          <ThemedView style={selectedUser?.id === item.id ? styles.selectedUserRow : undefined}>
            <UserCard onPress={() => setSelectedUser(item)} user={item} />
          </ThemedView>
        )}
      />
    </BottomSheetModal>
  );
}

function OperationUserWizard({
  onBack,
  onDone,
  service,
  user }: {
  onBack: () => void;
  onDone: () => void;
  service: OperationService;
  user: UserListItem;
}) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<WizardStep>('input');
  const [result, setResult] = useState<ResultState | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [authPassword, setAuthPassword] = useState('');
  const [canUseBiometric, setCanUseBiometric] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<Record<string, unknown> | null>(null);
  const levelsQuery = useQuery({ enabled: service.key === 'modify-ranking', queryFn: fetchUserLevels, queryKey: ['operation', 'user-levels'] });
  const userLevels = useMemo(() => getCollectionData(levelsQuery.data), [levelsQuery.data]);
  const mutation = useMutation({
    mutationFn: async ({ authenticatedPassword }: { authenticatedPassword?: string }) => {
      const response = await confirmAdminPassword(authenticatedPassword || '');
      if (response?.success === false) {
        throw new Error(response.message || 'Incorrect password');
      }

      if (service.key === 'adjust-balance') {
        return adjustUserBalance({
          amount: Number(pendingPayload?.amount),
          reason: String(pendingPayload?.reason || ''),
          type: pendingPayload?.type as BalanceAdjustmentType,
          userId: user.id });
      }

      if (service.key === 'transfer-money') {
        return transferMoneyUsers({
          amount: pendingPayload?.amount ? Number(pendingPayload.amount) : undefined,
          from: user.id,
          to: Number(pendingPayload?.to) });
      }

      if (service.key === 'modify-ranking') {
        return updateUserRanking({ iriId: String(pendingPayload?.iriId || ''), userId: user.id });
      }

      if (service.key === 'change-email') {
        return updateUserEmail({ email: String(pendingPayload?.email || '').trim(), userId: user.id });
      }

      return updateUserPassword({ password: String(pendingPayload?.password || ''), userId: user.id });
    },
    onError: error => {
      setResult({
        message: parseApiError(error),
        status: 'error',
        title: `${service.title} failed` });
      setStep('result');
    },
    onSuccess: response => {
      const apiResponse = response as { message?: string; statusCode?: string; success?: boolean };
      if (apiResponse?.success === false || apiResponse?.statusCode === 'EVD011' || apiResponse?.statusCode === 'EVD013') {
        setResult({
          message: apiResponse.message || 'Operation failed.',
          status: 'error',
          title: `${service.title} failed` });
        setStep('result');
        return;
      }

      void queryClient.invalidateQueries({ queryKey: userKeys.all });
      void queryClient.invalidateQueries({ queryKey: userKeys.detail(user.id) });
      setResult({
        message: service.key === 'change-password' ? `New password: ${pendingPayload?.password || '--'}` : `${service.title} completed for ${getUserName(user)}.`,
        status: 'success',
        title: 'Operation successful' });
      setStep('result');
    } });

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      biometricCredentialStore.canUseBiometricAuthentication(),
      biometricCredentialStore.hasCredentials(),
    ])
      .then(([hasHardware, isEnrolled, canSaveProtectedCredentials, hasSavedCredentials]) => {
        if (isMounted) setCanUseBiometric(hasHardware && isEnrolled && canSaveProtectedCredentials && hasSavedCredentials);
      })
      .catch(() => {
        if (isMounted) setCanUseBiometric(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const updateValue = useCallback((key: string, value: string) => {
    setFormValues(current => ({ ...current, [key]: value }));
  }, []);

  const goToAuth = useCallback(
    (payload: Record<string, unknown>) => {
      setPendingPayload(payload);
      setAuthPassword('');
      setStep('auth');
    },
    [setPendingPayload],
  );

  const submitWithPassword = useCallback(() => {
    if (!authPassword.trim()) {
      Alert.alert('Password required', 'Enter your admin password or use biometric authentication.');
      return;
    }

    mutation.mutate({ authenticatedPassword: authPassword });
  }, [authPassword, mutation, service.key]);

  const submitWithBiometric = useCallback(async () => {
    try {
      const credentials = await biometricCredentialStore.getCredentials();
      if (!credentials?.password) {
        setCanUseBiometric(false);
        Alert.alert('Biometric unavailable', 'Please sign in with your CMS account once before using biometric authentication.');
        return;
      }
      mutation.mutate({ authenticatedPassword: credentials.password });
    } catch (error) {
      Alert.alert('Authentication failed', parseApiError(error));
    }
  }, [mutation]);

  return (
    <ThemedView safePaddingTop flex={1} backgroundColor={Palette.surfaceBase}>
      <ThemedView style={styles.wizardHeader}>
        <Pressable accessibilityLabel='Back' accessibilityRole='button' onPress={step === 'input' ? onBack : () => setStep('input')} style={styles.backButton}>
          <ChevronLeft color={Palette.textPrimary} size={20} strokeWidth={2.2} />
        </Pressable>
        <ThemedView flex={1} minWidth={0}>
          <ThemedText numberOfLines={1} color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={18} lineHeight={24} textAlign='center'>
            {service.title}
          </ThemedText>
          <ThemedText numberOfLines={1} color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={12} textAlign='center'>
            {getUserName(user)}
          </ThemedText>
        </ThemedView>
        <ThemedView width={34} />
      </ThemedView>
      <ScrollView contentContainerStyle={styles.wizardContent} keyboardShouldPersistTaps='handled' showsVerticalScrollIndicator={false}>
        <StepIndicator current={step} />
        <SelectedUserSummary user={user} />
        {step === 'input' ? (
          <InputStep
            canLoadLevels={service.key === 'modify-ranking'}
            formValues={formValues}
            levels={userLevels}
            levelsLoading={levelsQuery.isLoading}
            onNext={goToAuth}
            onValueChange={updateValue}
            serviceKey={service.key}
            user={user}
          />
        ) : step === 'auth' ? (
          <AuthStep
            canUseBiometric={canUseBiometric}
            loading={mutation.isPending}
            onBack={() => setStep('input')}
            onBiometric={submitWithBiometric}
            onPasswordChange={setAuthPassword}
            onSubmit={submitWithPassword}
            password={authPassword}
          />
        ) : (
          <ResultStep loading={mutation.isPending} onDone={onDone} result={result} />
        )}
      </ScrollView>
    </ThemedView>
  );
}

function InputStep({
  formValues,
  levels,
  levelsLoading,
  onNext,
  onValueChange,
  serviceKey,
  user }: {
  canLoadLevels: boolean;
  formValues: Record<string, string>;
  levels: UserLevel[];
  levelsLoading: boolean;
  onNext: (payload: Record<string, unknown>) => void;
  onValueChange: (key: string, value: string) => void;
  serviceKey: OperationServiceKey;
  user: UserListItem;
}) {
  const [receiver, setReceiver] = useState<UserListItem | null>(null);
  const [receiverSearch, setReceiverSearch] = useState('');
  const [receiverQuery, setReceiverQuery] = useState('');
  const receiverUsersQuery = useInfiniteUsers(receiverQuery);
  const receiverUsers = useMemo(() => receiverUsersQuery.data?.pages.flatMap(page => page.items).filter(item => item.id !== user.id) || [], [
    receiverUsersQuery.data,
    user.id,
  ]);

  useEffect(() => {
    const timeout = setTimeout(() => setReceiverQuery(receiverSearch.trim()), 350);
    return () => clearTimeout(timeout);
  }, [receiverSearch]);

  const submit = useCallback(() => {
    if (serviceKey === 'adjust-balance') {
      const amount = Number(formValues.amount);
      const reason = formValues.reason?.trim();
      const type = (formValues.type || 'plus_wallet') as BalanceAdjustmentType;
      if (!Number.isFinite(amount) || amount <= 0 || !reason || reason.length < 10) {
        Alert.alert('Missing details', 'Enter an amount and a reason with at least 10 characters.');
        return;
      }
      onNext({ amount, reason, type });
      return;
    }

    if (serviceKey === 'transfer-money') {
      const amountText = formValues.amount?.trim();
      if (!receiver?.id) {
        Alert.alert('Receiver required', 'Select the receiver user.');
        return;
      }
      if (amountText && (!Number.isFinite(Number(amountText)) || Number(amountText) <= 0)) {
        Alert.alert('Invalid amount', 'Amount must be greater than zero, or leave it empty to transfer full balance.');
        return;
      }
      onNext({ amount: amountText ? Number(amountText) : undefined, to: receiver.id });
      return;
    }

    if (serviceKey === 'modify-ranking') {
      if (!formValues.iriId) {
        Alert.alert('Ranking required', 'Select a ranking level.');
        return;
      }
      onNext({ iriId: formValues.iriId });
      return;
    }

    if (serviceKey === 'change-email') {
      const email = formValues.email?.trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        Alert.alert('Invalid email', 'Enter a valid replacement email.');
        return;
      }
      if (email.toLowerCase() === user.email?.trim().toLowerCase()) {
        Alert.alert('Same email', 'New email must be different from current email.');
        return;
      }
      onNext({ email });
      return;
    }

    const password = formValues.password || '';
    const confirmPassword = formValues.confirmPassword || '';
    if (password.length < 8 || password.length > 40 || password !== confirmPassword) {
      Alert.alert('Invalid password', 'Password must be 8-40 characters and match confirmation.');
      return;
    }
    onNext({ password });
  }, [formValues, onNext, receiver, serviceKey, user.email]);

  return (
    <ThemedView gap={'four'}>
      {serviceKey === 'adjust-balance' ? (
        <>
          <SegmentedInput
            onChange={value => onValueChange('type', value)}
            options={[
              { label: 'Plus', value: 'plus_wallet' },
              { label: 'Deduct', value: 'deduct_wallet' },
            ]}
            value={formValues.type || 'plus_wallet'}
          />
          <LabeledInput keyboardType='numeric' label='Transfer amount' onChangeText={value => onValueChange('amount', value)} placeholder='Enter amount' value={formValues.amount || ''} />
          <LabeledInput
            label='Reason'
            multiline
            onChangeText={value => onValueChange('reason', value)}
            placeholder='Enter reason for this transaction'
            style={styles.textArea}
            value={formValues.reason || ''}
          />
        </>
      ) : null}

      {serviceKey === 'transfer-money' ? (
        <>
          <ThemedView style={styles.infoCard}>
            <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={11}>
              SENDER
            </ThemedText>
            <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={16} marginTop={4}>
              {getUserName(user)}
            </ThemedText>
            <ThemedText color={Palette.accent} fontFamily={FontFamily.bold} fontSize={14} marginTop={2}>
              {formatCurrency(user.balance)}
            </ThemedText>
          </ThemedView>
          <LabeledInput
            label='Receiver'
            onChangeText={text => {
              setReceiverSearch(text);
              setReceiver(null);
            }}
            placeholder='Search receiver ID, phone, or email'
            value={receiver ? getUserName(receiver) : receiverSearch}
          />
          {receiverSearch || receiverUsersQuery.isLoading ? (
            <ThemedView style={styles.inlineList}>
              {receiverUsersQuery.isLoading ? (
                <ActivityIndicator color={Palette.accent} />
              ) : (
                receiverUsers.slice(0, 5).map(item => (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      setReceiver(item);
                      setReceiverSearch('');
                    }}
                    style={({ pressed }) => [styles.inlineUserRow, pressed && styles.pressed]}>
                    <ThemedText numberOfLines={1} color={Palette.textPrimary} flex={1} fontFamily={FontFamily.bold} fontSize={13}>
                      {getUserName(item)}
                    </ThemedText>
                    <ThemedText color={Palette.accent} fontFamily={FontFamily.semibold} fontSize={12}>
                      #{item.id}
                    </ThemedText>
                  </Pressable>
                ))
              )}
            </ThemedView>
          ) : null}
          <LabeledInput
            keyboardType='numeric'
            label='Amount'
            onChangeText={value => onValueChange('amount', value)}
            placeholder='Empty means transfer full balance'
            value={formValues.amount || ''}
          />
        </>
      ) : null}

      {serviceKey === 'modify-ranking' ? (
        <ThemedView gap={'three'}>
          {levelsLoading ? <ActivityIndicator color={Palette.accent} /> : null}
          {levels.map(level => {
            const selected = formValues.iriId === level.iriId;
            return (
              <Pressable
                key={level.iriId || level.id}
                onPress={() => onValueChange('iriId', level.iriId || `api/user_levels/${level.id}`)}
                style={({ pressed }) => [styles.levelOption, selected && styles.levelOptionSelected, pressed && styles.pressed]}>
                <ThemedView style={[styles.levelDot, { backgroundColor: level.backgroundColor || operationAccent }]} />
                <ThemedView flex={1} minWidth={0}>
                  <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={14}>
                    {level.name}
                  </ThemedText>
                  <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={12} marginTop={2}>
                    {getUserLevelLabel(level)}
                  </ThemedText>
                </ThemedView>
                {selected ? <SymbolView name='checkmark.circle.fill' resizeMode='scaleAspectFit' size={22} tintColor={Palette.accent} /> : null}
              </Pressable>
            );
          })}
        </ThemedView>
      ) : null}

      {serviceKey === 'change-email' ? (
        <>
          <ThemedView style={styles.infoCard}>
            <Mail color={Palette.textSecondary} size={18} />
            <ThemedView flex={1} minWidth={0}>
              <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={11}>
                CURRENT EMAIL
              </ThemedText>
              <ThemedText numberOfLines={1} color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={15} marginTop={3}>
                {user.email || '--'}
              </ThemedText>
            </ThemedView>
          </ThemedView>
          <LabeledInput
            autoCapitalize='none'
            keyboardType='email-address'
            label='New email'
            onChangeText={value => onValueChange('email', value)}
            placeholder='Enter new email'
            value={formValues.email || ''}
          />
        </>
      ) : null}

      {serviceKey === 'change-password' ? (
        <>
          <LabeledInput
            label='New password'
            onChangeText={value => onValueChange('password', value)}
            placeholder='Enter new password'
            secureTextEntry
            value={formValues.password || ''}
          />
          <LabeledInput
            label='Confirm new password'
            onChangeText={value => onValueChange('confirmPassword', value)}
            placeholder='Confirm new password'
            secureTextEntry
            value={formValues.confirmPassword || ''}
          />
        </>
      ) : null}

      <AppButton block label='Next' onPress={submit} />
    </ThemedView>
  );
}

function AuthStep({
  canUseBiometric,
  loading,
  onBack,
  onBiometric,
  onPasswordChange,
  onSubmit,
  password }: {
  canUseBiometric: boolean;
  loading: boolean;
  onBack: () => void;
  onBiometric: () => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
  password: string;
}) {
  return (
    <ThemedView gap={'four'}>
      <ThemedView style={styles.warningCard}>
        <ShieldCheck color={operationAccent} size={20} />
        <ThemedText color={Palette.textPrimary} flex={1} fontFamily={FontFamily.semibold} fontSize={13} lineHeight={19}>
          Review the details carefully. The operation will be submitted immediately after this step.
        </ThemedText>
      </ThemedView>
      <LabeledInput
        label='Admin password'
        onChangeText={onPasswordChange}
        placeholder='Enter password to confirm'
        secureTextEntry
        value={password}
      />
      <ThemedView flexDirection='row' gap={'three'}>
        <AppButton block label='Back' onPress={onBack} variant='ghost' />
        <AppButton block label='Submit' loading={loading} onPress={onSubmit} />
      </ThemedView>
      {canUseBiometric ? <AppButton block label='Use Biometric' loading={loading} onPress={onBiometric} variant='secondary' /> : null}
    </ThemedView>
  );
}

function ResultStep({ loading, onDone, result }: { loading: boolean; onDone: () => void; result: ResultState | null }) {
  const success = result?.status === 'success';

  return (
    <ThemedView gap={'four'} style={styles.resultCard}>
      {loading ? (
        <ActivityIndicator color={Palette.accent} size='large' />
      ) : (
        <SymbolView name={success ? 'checkmark.circle.fill' : 'xmark.circle.fill'} resizeMode='scaleAspectFit' size={58} tintColor={success ? Palette.accent : Palette.danger} />
      )}
      <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={21} lineHeight={27} textAlign='center'>
        {loading ? 'Processing...' : result?.title || 'Operation result'}
      </ThemedText>
      <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={14} lineHeight={21} textAlign='center'>
        {loading ? 'Please wait a moment.' : result?.message || '--'}
      </ThemedText>
      <AppButton block label='Back to Operation' onPress={onDone} />
    </ThemedView>
  );
}

function SelectedUserSummary({ user }: { user: UserListItem }) {
  return (
    <ThemedView style={styles.selectedSummary}>
      <ThemedView style={styles.selectedAvatar}>
        <SymbolView name='person.fill' resizeMode='scaleAspectFit' size={24} tintColor='#FFFFFF' />
      </ThemedView>
      <ThemedView flex={1} minWidth={0}>
        <ThemedText numberOfLines={1} color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={15}>
          {getUserName(user)}
        </ThemedText>
        <ThemedText numberOfLines={1} color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={12} marginTop={2}>
          #{user.id} • {user.email || user.phoneNumber || 'No contact'}
        </ThemedText>
      </ThemedView>
      <ThemedText color={Palette.accent} fontFamily={FontFamily.bold} fontSize={13}>
        {formatCurrency(user.balance)}
      </ThemedText>
    </ThemedView>
  );
}

function StepIndicator({ current }: { current: WizardStep }) {
  const steps: { key: WizardStep; label: string }[] = [
    { key: 'input', label: 'Input' },
    { key: 'auth', label: 'Verify' },
    { key: 'result', label: 'Result' },
  ];

  return (
    <ThemedView flexDirection='row' gap={'two'}>
      {steps.map((item, index) => {
        const active = item.key === current;
        return (
          <ThemedView flex={1} key={item.key} style={[styles.stepPill, active && styles.stepPillActive]}>
            <ThemedText color={active ? '#FFFFFF' : Palette.textSecondary} fontFamily={FontFamily.bold} fontSize={11} textAlign='center'>
              {index + 1}. {item.label}
            </ThemedText>
          </ThemedView>
        );
      })}
    </ThemedView>
  );
}

function LabeledInput({
  label,
  style,
  ...props
}: {
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address' | 'numeric';
  label: string;
  multiline?: boolean;
  onChangeText: (value: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  style?: object;
  value: string;
}) {
  return (
    <ThemedView gap={'two'}>
      <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={13}>
        {label}
      </ThemedText>
      <TextInput placeholderTextColor='#98A2B3' style={[styles.input, style]} {...props} />
    </ThemedView>
  );
}

function SegmentedInput({
  onChange,
  options,
  value }: {
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  value: string;
}) {
  return (
    <ThemedView flexDirection='row' gap={'two'} style={styles.segmented}>
      {options.map(option => {
        const selected = option.value === value;
        return (
          <Pressable key={option.value} onPress={() => onChange(option.value)} style={[styles.segmentButton, selected && styles.segmentButtonSelected]}>
            <ThemedText color={selected ? '#FFFFFF' : Palette.textSecondary} fontFamily={FontFamily.bold} fontSize={13} textAlign='center'>
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </ThemedView>
  );
}

function OperationStatsSection({
  atRiskUsers,
  growth,
  growthSummary,
  isLoading,
  onViewMoreTopStations,
  onViewMoreTopUsers,
  topStations,
  topUsers }: {
  atRiskUsers: AtRiskUserItem[];
  growth: UserGrowthChartItem[];
  growthSummary?: UserGrowthSummary;
  isLoading: boolean;
  onViewMoreTopStations: () => void;
  onViewMoreTopUsers: () => void;
  topStations: TopStationPerformanceItem[];
  topUsers: TopUserPerformanceItem[];
}) {
  const { width } = useWindowDimensions();
  const [showAtRiskUsers, setShowAtRiskUsers] = useState(false);

  if (isLoading) {
    return (
      <ThemedView gap={'three'}>
        <SectionTitle subtitle='Loading dashboard metrics' title='Operation Analytics' />
        <ThemedView style={styles.loadingCard}>
          <ActivityIndicator color={Palette.accent} />
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ThemedView gap={'three'}>
      <PerformanceHorizontalSection
        accentColor='#0F9F6E'
        description='Current month leaders by sessions, energy, and paid amount.'
        items={topUsers.slice(0, 10).map((item, index) => ({
          label: item.user_name || item.user_email || `User #${item.user_id}`,
          meta: `${formatNumber(item.total_orders)} sessions • ${decimalFormatter.format(Number(item.total_energy) || 0)} kWh`,
          rank: index + 1,
          value: formatCurrency(item.total_paid) }))}
        screenWidth={width}
        title='Top User Performance'
        onViewMore={onViewMoreTopUsers}
      />
      <PerformanceHorizontalSection
        accentColor='#2563EB'
        description='Current month station leaders by sessions, energy, and paid amount.'
        items={topStations.slice(0, 10).map((item, index) => ({
          label: item.station_name || `Station #${item.station_id}`,
          meta: `${formatNumber(item.total_orders)} sessions • ${formatCurrency(item.total_paid)}`,
          rank: index + 1,
          value: `${decimalFormatter.format(Number(item.total_energy ?? item.total_energy_kwh) || 0)} kWh` }))}
        screenWidth={width}
        title='Top Performing Stations'
        onViewMore={onViewMoreTopStations}
      />
      <AtRiskSubscriptionSection
        accentColor='#D92D20'
        items={atRiskUsers}
        showList={showAtRiskUsers}
        onToggleList={() => setShowAtRiskUsers(value => !value)}
      />
      <UserGrowthSection growth={growth} summary={growthSummary} />
    </ThemedView>
  );
}

function PerformanceHorizontalSection({
  accentColor,
  description,
  items,
  onViewMore,
  screenWidth,
  title }: {
  accentColor: string;
  description: string;
  items: { label: string; meta: string; rank: number; value: string }[];
  onViewMore: () => void;
  screenWidth: number;
  title: string;
}) {
  const cardWidth = Math.max(206, Math.round(screenWidth * 0.6));

  return (
    <ThemedView style={styles.analyticsSection}>
      <ThemedView alignItems='flex-start' flexDirection='row' gap={'three'}>
        <ThemedView style={[styles.analyticsMark, styles.topUsersAnalyticsMark, { backgroundColor: accentColor }]} />
        <ThemedView flex={1} minWidth={0}>
          <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={16}>
            {title}
          </ThemedText>
          <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={11} marginTop={2}>
            {description}
          </ThemedText>
        </ThemedView>
        <Pressable onPress={onViewMore} style={styles.viewMoreButton}>
          <ThemedText color={accentColor} fontFamily={FontFamily.bold} fontSize={12}>
            View more
          </ThemedText>
          <ChevronsRight color={accentColor} size={14} strokeWidth={2.4} />
        </Pressable>
      </ThemedView>
      {items.length ? (
        <ScrollView
          contentContainerStyle={styles.topUsersScrollerContent}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.topUsersScroller}>
          {items.map((item, index) => (
            <TopUserPerformanceCard accentColor={accentColor} index={index} item={item} key={`${title}-${item.label}-${item.rank}`} width={cardWidth} />
          ))}
        </ScrollView>
      ) : (
        <EmptyState message='No dashboard data returned.' title='No data' />
      )}
    </ThemedView>
  );
}

function TopUserPerformanceCard({
  accentColor,
  index,
  item,
  width }: {
  accentColor: string;
  index: number;
  item: { label: string; meta: string; rank: number; value: string };
  width: number;
}) {
  const rankTone = getTopUserRankTone(index);

  return (
    <ThemedView style={[styles.topUserCard, { width }]}>
      <ThemedView alignItems='center' flexDirection='row' justifyContent='space-between'>
        <ThemedView style={[styles.topUserRankBadge, { backgroundColor: rankTone.badgeBackground }]}>
          <ThemedText color={rankTone.badgeText} fontFamily={FontFamily.bold} fontSize={11} style={styles.topUserRankText}>
            {rankTone.label}
          </ThemedText>
        </ThemedView>
        <ThemedText numberOfLines={1} color={rankTone.badgeText} fontFamily={FontFamily.bold} fontSize={12} style={styles.topUserValue}>
          {item.value}
        </ThemedText>
      </ThemedView>
      <ThemedView gap={'one'}>
        <ThemedText numberOfLines={2} color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={13} style={styles.topUserName}>
          {item.label}
        </ThemedText>
        <ThemedText numberOfLines={2} color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={10} style={styles.topUserMeta}>
          {item.meta}
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

function getTopUserRankTone(index: number) {
  if (index === 0) {
    return {
      badgeBackground: '#F1F5F9',
      badgeText: '#A16207',
      label: '1st' };
  }

  if (index === 1) {
    return {
      badgeBackground: '#F1F5F9',
      badgeText: '#4B5563',
      label: '2nd' };
  }

  if (index === 2) {
    return {
      badgeBackground: '#F1F5F9',
      badgeText: '#C2410C',
      label: '3rd' };
  }

  return {
    badgeBackground: '#F1F5F9',
    badgeText: '#0F9F6E',
    label: `${index + 1}th` };
}

function AtRiskSubscriptionSection({
  accentColor,
  items,
  onToggleList,
  showList }: {
  accentColor: string;
  items: AtRiskUserItem[];
  onToggleList: () => void;
  showList: boolean;
}) {
  const closestDays = items.reduce<number | undefined>((current, item) => {
    if (typeof item.days_left !== 'number') {
      return current;
    }

    return current === undefined ? item.days_left : Math.min(current, item.days_left);
  }, undefined);
  const manualRenewals = items.filter(item => !item.auto_renew).length;

  return (
    <ThemedView style={styles.analyticsSection}>
      <ThemedView alignItems='flex-start' flexDirection='row' gap={'three'}>
        <ThemedView style={[styles.analyticsMark, styles.topUsersAnalyticsMark, { backgroundColor: accentColor }]} />
        <ThemedView flex={1} minWidth={0}>
          <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={16}>
            Subscription Expiry Risk
          </ThemedText>
          <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={11} marginTop={2}>
            Users with subscriptions approaching expiration.
          </ThemedText>
        </ThemedView>
        <Pressable onPress={onToggleList} style={styles.viewMoreButton}>
          <ThemedText color={accentColor} fontFamily={FontFamily.bold} fontSize={12}>
            {showList ? 'Hide' : 'View more'}
          </ThemedText>
          <ChevronsRight color={accentColor} size={14} strokeWidth={2.4} style={showList ? styles.viewMoreIconOpen : undefined} />
        </Pressable>
      </ThemedView>
      <ThemedView flexDirection='row' gap={'three'} style={styles.atRiskMetrics}>
        <InlineMetric accentColor={accentColor} label='Expiring users' value={formatNumber(items.length)} />
        <InlineMetric accentColor={accentColor} label='Closest expiry' value={closestDays === undefined ? '--' : `${closestDays}d`} />
        <InlineMetric accentColor={accentColor} label='Manual renew' value={formatNumber(manualRenewals)} />
      </ThemedView>
      {showList ? (
        items.length ? (
          <ThemedView style={styles.analyticsRows}>
            {items.map((item, index) => (
              <TopRankRow
                accentColor={accentColor}
                index={index}
                item={{
                  label: item.user?.name || item.user?.email || `User #${item.user?.id || '--'}`,
                  meta: `${item.days_left ?? '--'} days left • ${(item.risk_types || []).join(', ') || 'subscription expiry'}`,
                  rank: item.subscription_id,
                  value: item.auto_renew ? 'Auto' : 'Manual' }}
                key={`at-risk-${item.subscription_id}`}
              />
            ))}
          </ThemedView>
        ) : (
          <EmptyState message='No expiring subscriptions returned.' title='No data' />
        )
      ) : null}
    </ThemedView>
  );
}

function InlineMetric({ accentColor, label, value }: { accentColor: string; label: string; value: string }) {
  return (
    <ThemedView flex={1} minWidth={0} style={styles.inlineMetric}>
      <ThemedText numberOfLines={1} color={accentColor} fontFamily={FontFamily.bold} fontSize={16} style={styles.inlineMetricValue}>
        {value}
      </ThemedText>
      <ThemedText numberOfLines={2} color={Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={10} lineHeight={13}>
        {label}
      </ThemedText>
    </ThemedView>
  );
}

function StatsListSection({
  accentColor,
  items,
  symbol,
  title }: {
  accentColor: string;
  items: { label: string; meta: string; rank: number; value: string }[];
  symbol: SymbolName;
  title: string;
}) {
  return (
    <ThemedView style={styles.analyticsSection}>
      <ThemedView alignItems='center' flexDirection='row' gap={'three'}>
        <ThemedView style={[styles.analyticsMark, { backgroundColor: accentColor }]} />
        <ThemedView flex={1} minWidth={0}>
          <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={16}>
            {title}
          </ThemedText>
          <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={11} marginTop={2}>
            Ranked snapshot from CMS dashboard
          </ThemedText>
        </ThemedView>
        <SymbolView name={symbol} resizeMode='scaleAspectFit' size={18} tintColor={accentColor} />
      </ThemedView>
      {items.length ? (
        <ThemedView style={styles.analyticsRows}>
          {items.map((item, index) => (
            <TopRankRow accentColor={accentColor} index={index} item={item} key={`${title}-${item.label}-${item.rank}`} />
          ))}
        </ThemedView>
      ) : (
        <EmptyState message='No dashboard data returned.' title='No data' />
      )}
    </ThemedView>
  );
}

function TopRankRow({
  accentColor,
  index,
  item }: {
  accentColor: string;
  index: number;
  item: { label: string; meta: string; rank: number; value: string };
}) {
  return (
    <ThemedView style={styles.topRankRow}>
      <ThemedView alignItems='center' flexDirection='row' gap={'three'}>
        <ThemedText color={accentColor} fontFamily={FontFamily.bold} fontSize={13} style={styles.rankNumber}>
          {String(index + 1).padStart(2, '0')}
        </ThemedText>
        <ThemedView flex={1} minWidth={0}>
          <ThemedText numberOfLines={1} color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={14}>
            {item.label}
          </ThemedText>
          <ThemedText numberOfLines={1} color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={12} marginTop={3}>
            {item.meta}
          </ThemedText>
        </ThemedView>
        <ThemedText numberOfLines={1} color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={13} textAlign='right'>
          {item.value}
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

function UserGrowthSection({ growth, summary }: { growth: UserGrowthChartItem[]; summary?: UserGrowthSummary }) {
  const maxValue = Math.max(...growth.map(item => Number(item.total_users) || 0), 1);
  const chartItems = growth.slice(-12);

  return (
    <ThemedView style={styles.analyticsSection}>
      <ThemedView alignItems='flex-start' flexDirection='row' gap={'three'}>
        <ThemedView style={[styles.analyticsMark, styles.topUsersAnalyticsMark, { backgroundColor: operationAccent }]} />
        <ThemedView flex={1} minWidth={0}>
          <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={16}>
            User Growth
          </ThemedText>
          <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={11} marginTop={2}>
            Monthly user base trend and charging activity.
          </ThemedText>
        </ThemedView>
        <SymbolView name='chart.line.uptrend.xyaxis' resizeMode='scaleAspectFit' size={18} tintColor={operationAccent} />
      </ThemedView>
      <ThemedView flexDirection='row' gap={'three'} style={styles.growthSummaryLine}>
        <GrowthMetric
          change={summary?.today_vs_yesterday_growth_percent}
          label='Total users'
          value={formatFullNumber(summary?.total_users)}
        />
        <GrowthMetric
          change={summary?.charged_today_vs_yesterday_percent}
          label='Active today'
          value={formatFullNumber(summary?.users_charged_today)}
        />
        <GrowthMetric
          change={summary?.avg_charge_duration_change_percent}
          label='Avg duration'
          value={formatDurationMinutes(summary?.avg_charge_duration_all_time)}
        />
      </ThemedView>
      <ThemedView alignSelf='flex-start' style={styles.growthChartLabel}>
        <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.bold} fontSize={11}>
          New & total users - last 12 months
        </ThemedText>
      </ThemedView>
      {chartItems.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.growthChartScroller}>
          {chartItems.map(item => {
            const total = Number(item.total_users) || 0;
            const height = Math.max(18, Math.round((total / maxValue) * 118));
            return (
              <ThemedView alignItems='center' gap={'one'} key={item.time} style={styles.growthBarColumn}>
                <ThemedText numberOfLines={1} color='#05A84B' fontFamily={FontFamily.bold} fontSize={11}>
                  +{formatFullNumber(item.new_users)}
                </ThemedText>
                <ThemedText numberOfLines={1} color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={11}>
                  {formatFullNumber(item.total_users)}
                </ThemedText>
                <ThemedView justifyContent='flex-end' style={styles.growthBarTrack}>
                  <ThemedView style={[styles.growthBar, { height }]} />
                </ThemedView>
                <ThemedText numberOfLines={1} color={Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={10}>
                  {formatGrowthMonth(item.time)}
                </ThemedText>
              </ThemedView>
            );
          })}
        </ScrollView>
      ) : (
        <EmptyState message='No growth data returned.' title='No data' />
      )}
    </ThemedView>
  );
}

function GrowthMetric({ change, label, value }: { change?: number; label: string; value: string }) {
  const changeColor = Number(change) >= 0 ? '#05A84B' : '#F43F5E';

  return (
    <ThemedView flex={1} minWidth={0} style={styles.growthMetric}>
      <ThemedText numberOfLines={1} color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={17} textAlign='center'>
        {value}
      </ThemedText>
      <ThemedText numberOfLines={1} color={Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={10} marginTop={2} textAlign='center'>
        {label}
      </ThemedText>
      <ThemedText numberOfLines={1} color={changeColor} fontFamily={FontFamily.semibold} fontSize={10} marginTop={4} textAlign='center'>
        {formatPercent(change)}
      </ThemedText>
    </ThemedView>
  );
}

function SectionTitle({ subtitle, title }: { subtitle: string; title: string }) {
  return (
    <ThemedView flex={1} minWidth={0}>
      <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={12} letterSpacing={1.8} lineHeight={17} textTransform='uppercase'>
        {title}
      </ThemedText>
      <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={12} lineHeight={17} marginTop={2}>
        {subtitle}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    borderRadius: mhs(16),
    height: 34,
    justifyContent: 'center',
    width: 34 },
  content: {
    gap: mhs(12),
    paddingBottom: 120,
    paddingTop: mhs(8) },
  footerLoader: {
    paddingVertical: mhs(16) },
  atRiskMetrics: {
    marginTop: mhs(12) },
  growthBar: {
    alignSelf: 'stretch',
    backgroundColor: '#05C75A',
    borderTopLeftRadius: mhs(16),
    borderTopRightRadius: mhs(16) },
  growthBarColumn: {
    width: 58 },
  growthBarTrack: {
    height: 126,
    width: '100%' },
  growthChartLabel: {
    backgroundColor: Palette.surfaceMuted,
    borderRadius: 999,
    marginTop: mhs(16),
    paddingHorizontal: mhs(12),
    paddingVertical: mhs(8) },
  growthChartScroller: {
    alignItems: 'flex-end',
    gap: mhs(12),
    paddingTop: mhs(12),
    paddingRight: screenHorizontalPadding },
  growthMetric: {
    backgroundColor: Palette.surfaceMuted,
    borderColor: Palette.borderSubtle,
    borderCurve: 'continuous',
    borderRadius: mhs(21),
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: mhs(8),
    paddingVertical: mhs(12) },
  growthSummaryLine: {
    marginTop: mhs(16) },
  iconButton: {
    alignItems: 'center',
    backgroundColor: '#FFF4ED',
    borderRadius: mhs(16),
    height: 38,
    justifyContent: 'center',
    width: 38 },
  inlineMetric: {
    borderBottomColor: Palette.borderSubtle,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: mhs(8) },
  inlineMetricValue: {
    fontVariant: ['tabular-nums'] },
  infoCard: {
    alignItems: 'center',
    backgroundColor: Palette.surfaceMuted,
    borderColor: Palette.borderSubtle,
    borderRadius: mhs(21),
    borderWidth: 1,
    flexDirection: 'row',
    gap: mhs(12),
    padding: mhs(16) },
  inlineList: {
    backgroundColor: Palette.surfaceRaised,
    borderColor: Palette.borderSubtle,
    borderRadius: mhs(21),
    borderWidth: 1,
    overflow: 'hidden' },
  inlineUserRow: {
    alignItems: 'center',
    borderBottomColor: Palette.borderSubtle,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: mhs(8),
    minHeight: 46,
    paddingHorizontal: mhs(12) },
  input: {
    backgroundColor: Palette.surfaceRaised,
    borderColor: Palette.border,
    borderRadius: mhs(21),
    borderWidth: 1,
    color: Palette.textPrimary,
    fontFamily: FontFamily.medium,
    fontSize: 15,
    minHeight: 48,
    paddingHorizontal: mhs(16),
    paddingVertical: mhs(12) },
  levelDot: {
    borderRadius: 999,
    height: 14,
    width: 14 },
  levelOption: {
    alignItems: 'center',
    backgroundColor: Palette.surfaceRaised,
    borderColor: Palette.borderSubtle,
    borderRadius: mhs(21),
    borderWidth: 1,
    flexDirection: 'row',
    gap: mhs(12),
    padding: mhs(12) },
  levelOptionSelected: {
    borderColor: Palette.accent,
    borderWidth: 1.5 },
  loadingCard: {
    alignItems: 'center',
    backgroundColor: Palette.surfaceRaised,
    borderColor: Palette.borderSubtle,
    borderRadius: mhs(21),
    borderWidth: 1,
    minHeight: 120,
    justifyContent: 'center' },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.99 }] },
  resultCard: {
    alignItems: 'center',
    backgroundColor: Palette.surfaceRaised,
    borderColor: Palette.borderSubtle,
    borderRadius: mhs(21),
    borderWidth: 1,
    padding: mhs(24) },
  search: {
    backgroundColor: Palette.surfaceRaised,
    borderColor: Palette.border,
    borderRadius: mhs(21),
    borderWidth: 1,
    color: Palette.textPrimary,
    fontFamily: FontFamily.medium,
    fontSize: 15,
    height: 48,
    paddingHorizontal: mhs(16) },
  segmentButton: {
    alignItems: 'center',
    borderRadius: mhs(16),
    flex: 1,
    height: 42,
    justifyContent: 'center' },
  segmentButtonSelected: {
    backgroundColor: operationAccent },
  segmented: {
    backgroundColor: Palette.surfaceMuted,
    borderRadius: mhs(21),
    padding: mhs(4) },
  selectedAvatar: {
    alignItems: 'center',
    backgroundColor: operationAccent,
    borderRadius: 999,
    height: 42,
    justifyContent: 'center',
    width: 42 },
  selectedSummary: {
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
    borderRadius: mhs(21),
    borderWidth: 1,
    flexDirection: 'row',
    gap: mhs(12),
    padding: mhs(12) },
  selectedUserRow: {
    borderColor: Palette.accent,
    borderRadius: mhs(21),
    borderWidth: 1.5,
    marginHorizontal: mhs(8),
    overflow: 'hidden' },
  serviceIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: mhs(12),
    height: 48,
    justifyContent: 'center',
    width: 48 },


  serviceRow: {
    width: '100%' },
  serviceTile: {
    alignItems: 'center',
    gap: mhs(4),
    minHeight: 74,
    justifyContent: 'center',
    paddingHorizontal: mhs(4) },
  sheetHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mhs(12),
    paddingHorizontal: mhs(16),
    paddingTop: mhs(12) },
  sheetList: {
    paddingHorizontal: mhs(8) },
  sheetNextButton: {
    height: 42,
    minWidth: 88 },
  analyticsMark: {
    borderRadius: 999,
    height: 24,
    width: 3 },
  analyticsRows: {
    marginTop: mhs(12) },
  analyticsSection: {
    borderBottomColor: Palette.borderSubtle,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: mhs(24),
    paddingTop: mhs(4) },
  rankNumber: {
    width: 24 },
  topUserCard: {
    backgroundColor: Palette.surfaceMuted,
    borderColor: Palette.borderSubtle,
    borderCurve: 'continuous',
    borderRadius: mhs(21),
    borderWidth: StyleSheet.hairlineWidth,
    gap: mhs(8),
    justifyContent: 'flex-start',
    padding: mhs(12) },
  topUserMeta: {
    lineHeight: 13 },
  topUserName: {
    lineHeight: 16 },
  topUserRankBadge: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: mhs(12),
    justifyContent: 'center',
    minHeight: 24,
    minWidth: 34,
    paddingHorizontal: mhs(8) },
  topUserRankText: {
    fontVariant: ['tabular-nums'] },
  topUserValue: {
    flex: 1,
    marginLeft: mhs(8),
    textAlign: 'right' },
  topUsersScroller: {
    marginTop: mhs(12) },
  topUsersScrollerContent: {
    gap: mhs(12),
    paddingRight: screenHorizontalPadding },
  topUsersAnalyticsMark: {
    marginTop: 2 },
  viewMoreButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
    minHeight: 32,
    justifyContent: 'center',
    paddingLeft: mhs(8) },
  viewMoreIconOpen: {
    transform: [{ rotate: '90deg' }] },
  topRankRow: {
    borderTopColor: Palette.borderSubtle,
    borderTopWidth: StyleSheet.hairlineWidth,
    minHeight: 58,
    justifyContent: 'center',
    paddingVertical: mhs(12) },
  stepPill: {
    backgroundColor: Palette.surfaceMuted,
    borderRadius: 999,
    paddingHorizontal: mhs(8),
    paddingVertical: mhs(8) },
  stepPillActive: {
    backgroundColor: operationAccent },
  textArea: {
    minHeight: 106,
    textAlignVertical: 'top' },
  warningCard: {
    alignItems: 'flex-start',
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
    borderRadius: mhs(21),
    borderWidth: 1,
    flexDirection: 'row',
    gap: mhs(12),
    padding: mhs(16) },
  wizardContent: {
    gap: mhs(16),
    padding: screenHorizontalPadding,
    paddingBottom: 120 },
  wizardHeader: {
    alignItems: 'center',
    borderBottomColor: Palette.borderSubtle,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: mhs(12),
    minHeight: 58,
    paddingHorizontal: screenHorizontalPadding } });
