import { ArrowDownLeft, ArrowUpRight, type LucideIcon } from 'lucide-react-native';

import { ThemedText, ThemedView } from 'components/base';
import { FontFamily, Palette } from 'themes';

import { SectionHeading } from './user-profile-common';
import { formatCurrency, numberFormatter } from './user-profile-helpers';

const creditColor = '#067647';
const creditSurface = '#ECFDF3';
const debitColor = '#C01048';
const debitSurface = '#FFF1F3';
const gapColor = '#B54708';

export function UserProfileWalletFlow({ user }: { user: UserProfile }) {
  const summary = getWalletFlowSummary(user);

  return (
    <ThemedView backgroundColor='transparent' gap={'three'}>
      <SectionHeading eyebrow='Wallet' title='Wallet flow' />
      <ThemedView alignItems='stretch' backgroundColor='transparent' flexDirection='row' gap={'two'}>
        <FlowColumn
          Icon={ArrowDownLeft}
          color={creditColor}
          count={`${numberFormatter.format(summary.creditedFlowCount)} inflows`}
          rows={[
            { label: 'Activity', value: summary.activityCreditAmount },
            { label: summary.providerSourceLabel, value: summary.providerCreditAmount },
            { gap: true, label: 'Gap', value: summary.missingProviderCreditAmount },
          ]}
          surface={creditSurface}
          title='Credits'
          total={summary.creditedAmount}
        />
        <FlowColumn
          Icon={ArrowUpRight}
          color={debitColor}
          count={`${numberFormatter.format(summary.debitedFlowCount)} outflows`}
          rows={[
            { label: 'Activity', value: summary.debitedAmount },
            { label: 'Charging', value: summary.chargingActivityAmount },
            { label: 'Subscription', value: summary.subscriptionDebitAmount },
            { gap: true, label: 'Gap', value: summary.chargingGapAmount },
          ]}
          surface={debitSurface}
          title='Debits'
          total={summary.expectedDebitAmount}
        />
      </ThemedView>
    </ThemedView>
  );
}

type FlowRow = { gap?: boolean; label: string; value: number };

function FlowColumn({
  Icon,
  color,
  count,
  rows,
  surface,
  title,
  total,
}: {
  Icon: LucideIcon;
  color: string;
  count: string;
  rows: FlowRow[];
  surface: string;
  title: string;
  total: number;
}) {
  return (
    <ThemedView
      backgroundColor={Palette.surfaceRaised}
      borderColor={Palette.borderSubtle}
      borderCurve='continuous'
      borderRadius={16}
      borderWidth={1}
      flex={1}
      minWidth={0}
      overflow='hidden'>
      <ThemedView backgroundColor={surface} gap={'two'} padding={'three'}>
        <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={'two'}>
          <ThemedView alignItems='center' backgroundColor={Palette.surfaceRaised} borderRadius={8} height={25} justifyContent='center' width={25}>
            <Icon color={color} size={14} strokeWidth={2.3} />
          </ThemedView>
          <ThemedText color={color} fontFamily={FontFamily.bold} fontSize={10} letterSpacing={0.8} numberOfLines={1} textTransform='uppercase'>
            {title}
          </ThemedText>
        </ThemedView>
        <ThemedText adjustsFontSizeToFit color={color} fontFamily={FontFamily.bold} fontSize={17} minimumFontScale={0.72} numberOfLines={1} selectable>
          {formatCurrency(total)}
        </ThemedText>
        <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={9} numberOfLines={1}>
          {count}
        </ThemedText>
      </ThemedView>
      <ThemedView backgroundColor='transparent' paddingHorizontal={'three'} paddingVertical={'two'}>
        {rows.map((row, index) => (
          <ThemedView key={row.label} backgroundColor='transparent'>
            {index > 0 ? <ThemedView backgroundColor={Palette.borderSubtle} height={1} /> : null}
            <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={'one'} justifyContent='space-between' minHeight={29}>
              <ThemedText color={row.gap ? gapColor : Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={9} numberOfLines={1}>
                {row.label}
              </ThemedText>
              <ThemedText
                adjustsFontSizeToFit
                color={row.gap ? gapColor : color}
                fontFamily={FontFamily.semibold}
                fontSize={9}
                minimumFontScale={0.72}
                numberOfLines={1}
                selectable
                textAlign='right'>
                {formatCurrency(row.value)}
              </ThemedText>
            </ThemedView>
          </ThemedView>
        ))}
      </ThemedView>
    </ThemedView>
  );
}

function getWalletFlowSummary(user: UserProfile) {
  const balanceHistory = user.balanceHistory || [];
  const positiveFlows = balanceHistory.filter(item => item.balanceAction === '+');
  const negativeFlows = balanceHistory.filter(item => item.balanceAction === '-');
  const balanceHistoryReferences = balanceHistory.map(item => normalizeReference(item.reason)).filter(Boolean);
  const successfulMomoCredits = (user.momoHistories || []).filter(item => isSuccessProviderStatus(item.status));
  const successfulAlepayCredits = (user.alePayHistories || []).filter(item => isSuccessProviderStatus(item.status));
  const providerSourceLabel =
    successfulMomoCredits.length && successfulAlepayCredits.length
      ? 'MoMo / AlePay'
      : successfulMomoCredits.length
        ? 'MoMo'
        : successfulAlepayCredits.length
          ? 'AlePay'
          : 'Provider';
  const providerSuccessCredits = [...successfulMomoCredits, ...successfulAlepayCredits].reduce<{ amount: number; orderCode: string }[]>((result, item) => {
    const orderCode = normalizeReference(item.orderCode);
    if (!orderCode || result.some(existing => existing.orderCode === orderCode)) return result;
    const amount = normalizePositiveAmount(item.amount);
    if (!amount) return result;
    result.push({ amount, orderCode });
    return result;
  }, []);
  const extraProviderCredits = [...(user.momoHistories || []), ...(user.alePayHistories || [])].reduce<{ amount: number; reference: string }[]>(
    (result, item) => {
      if (!isSuccessProviderStatus(item.status)) return result;
      const reference = normalizeReference(item.orderCode);
      if (!reference || balanceHistoryReferences.some(reason => reason.startsWith(reference)) || result.some(existing => existing.reference === reference))
        return result;
      const amount = normalizePositiveAmount(item.amount);
      if (!amount) return result;
      result.push({ amount, reference });
      return result;
    },
    [],
  );
  const activityCreditAmount = positiveFlows.reduce((sum, item) => sum + normalizePositiveAmount(item.amount), 0);
  const providerCreditAmount = providerSuccessCredits.reduce((sum, item) => sum + item.amount, 0);
  const missingProviderCreditAmount = extraProviderCredits.reduce((sum, item) => sum + item.amount, 0);
  const debitedAmount = negativeFlows.reduce((sum, item) => sum + normalizePositiveAmount(item.amount), 0);
  const chargingActivityAmount = negativeFlows.filter(isChargingWalletEntry).reduce((sum, item) => sum + normalizePositiveAmount(item.amount), 0);
  const paidBillsAmount = normalizePositiveAmount(user.totalChargedPaid);
  const subscriptionDebitAmount = (user.subscriptionHistories || []).reduce((sum, item) => sum + normalizePositiveAmount(item.amount), 0);

  return {
    activityCreditAmount,
    chargingActivityAmount,
    chargingGapAmount: paidBillsAmount - chargingActivityAmount,
    creditedAmount: activityCreditAmount + missingProviderCreditAmount,
    creditedFlowCount: positiveFlows.length + extraProviderCredits.length,
    debitedAmount,
    debitedFlowCount: negativeFlows.length,
    expectedDebitAmount: paidBillsAmount + subscriptionDebitAmount,
    missingProviderCreditAmount,
    providerCreditAmount,
    providerSourceLabel,
    subscriptionDebitAmount,
  };
}

function normalizeReference(value?: string | null) {
  return `${value || ''}`.trim().toLowerCase();
}

function normalizePositiveAmount(value?: number | null) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}

function isSuccessProviderStatus(status?: string | null) {
  return normalizeReference(status) === 'success';
}

function isChargingWalletEntry(item: BalanceHistoryItem) {
  const reason = `${item.reason || ''}`.toUpperCase();
  return item.balanceAction === '-' && (reason.includes('EBIKE') || reason.includes('ECAR') || reason.includes('EVD'));
}
