import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Cable, CircleCheck, Clock, Copy, MapPin, MessageSquareWarning, ReceiptText, TriangleAlert, User, Zap } from 'lucide-react-native';
import type React from 'react';
import { type GestureResponderEvent, Pressable, StyleSheet } from 'react-native';

import { ThemedText, ThemedView } from 'components/base';
import { FlipCard } from 'components/base/flip-card';
import { ChargingProfileChart } from 'components/technical/charging-profile-chart';
import { FontFamily, Palette } from 'themes';
import { getDisplayImageUrl } from 'utils/media/image-url';

import type { CmsRecord } from './service';

type TransactionUser = {
  avatar?: { path?: string | null; url?: string | null } | null;
  avatar_url?: string | null;
  avatarUrl?: string | null;
  email?: string;
  id?: number;
  image?: { path?: string | null; url?: string | null } | null;
  name?: string;
  phoneNumber?: string;
};

type TransactionBox = {
  name?: string;
  phase?: number | string;
  power?: number | string;
  station?: { name?: string };
  uniqueId?: string;
  vendorId?: string;
};

type TransactionCurrentDirection = { name?: string; type?: string } | string;

type TransactionPriceProfile = {
  currentDirection?: TransactionCurrentDirection;
};

type TransactionPort = {
  connectorId?: number;
  currentDirection?: TransactionCurrentDirection;
  currentType?: string;
  id?: number;
  name?: string;
  orderOnBox?: number;
  outletId?: number;
  phase?: number | string;
  portType?: TransactionPriceProfile | string | null;
  portProfile?: TransactionPriceProfile | string | null;
  power?: number | string;
  priceProfile?: TransactionPriceProfile | string | null;
  tariff?: TransactionPriceProfile | string | null;
  type?: string;
};

type TransactionRecord = CmsRecord & {
  activationFee?: number | string;
  bikeBox?: TransactionBox;
  carBox?: TransactionBox;
  carConnector?: TransactionPort;
  chargeType?: string;
  chargeValue?: number | string;
  chargingFee?: number | string;
  discountAmount?: number | string;
  endTime?: number | string;
  invoiceId?: string;
  outlet?: TransactionPort;
  paid?: number | string;
  promoCode?: string;
  promotionCode?: { code?: string; name?: string } | string | null;
  promotionDiscount?: number | string;
  reasonClosed?: string;
  startTime?: number | string;
  status?: boolean | number | string;
  totalConsumedFee?: number | string;
  totalFee?: number | string;
  transactionId?: string;
  user?: TransactionUser;
  wattageConsumed?: number | string;
};

const meterAccent = '#0284C7';
const successAccent = '#15803D';
const transactionCarSuccessWh = 0.1 * 1000;
const transactionBikeSuccessWh = 0.005 * 1000;

type TransactionTone = 'charging' | 'danger' | 'success' | 'warning';

function toNumber(value?: number | string) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function toDate(value?: number | string) {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'number') return new Date(value < 10_000_000_000 ? value * 1000 : value);
  if (/^\d{10,13}$/.test(value)) {
    const numericValue = Number(value);
    return new Date(numericValue < 10_000_000_000 ? numericValue * 1000 : numericValue);
  }
  return new Date(value);
}

function formatTransactionTime(value?: number | string) {
  const date = toDate(value);
  if (!date || Number.isNaN(date.getTime())) return '-';
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function formatTransactionDuration(start?: number | string, end?: number | string) {
  const startDate = toDate(start);
  const endDate = toDate(end);
  if (!startDate || !endDate) return '00:00:00';

  const seconds = Math.floor((endDate.getTime() - startDate.getTime()) / 1000);
  if (seconds < 0) return '00:00:00';
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor((seconds % 3600) / 60))}:${pad(seconds % 60)}`;
}

function formatCurrency(value?: number) {
  return `${Math.round(value || 0).toLocaleString()} đ`;
}

function formatChargeType(value?: string) {
  if (!value) return 'Unknown';
  if (value.toLowerCase() === 'quick.charge') return 'Quick Charge';
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function formatSecondsToTime(value?: number | string) {
  const totalSeconds = Math.max(0, Math.floor(toNumber(value)));
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const pad = (part: number) => String(part).padStart(2, '0');

  if (days) return `${days}d${hours ? ` ${pad(hours)}:${pad(minutes)}` : ''}`;
  if (hours) return `${pad(hours)}:${pad(minutes)}`;
  if (minutes) return `${pad(minutes)}m`;
  return `${seconds}s`;
}

function getPromotionCode(item: TransactionRecord) {
  if (item.promoCode) return item.promoCode;
  const promotion = item.promotionCode;
  if (!promotion) return undefined;
  return typeof promotion === 'string' ? promotion : promotion.code || promotion.name;
}

function getCurrentType(port?: TransactionPort) {
  if (typeof port?.currentDirection === 'string') return port.currentDirection;
  const profile =
    (port?.portType && typeof port.portType === 'object' ? port.portType : undefined) ||
    (port?.priceProfile && typeof port.priceProfile === 'object' ? port.priceProfile : undefined) ||
    (port?.portProfile && typeof port.portProfile === 'object' ? port.portProfile : undefined) ||
    (port?.tariff && typeof port.tariff === 'object' ? port.tariff : undefined);
  const profileDirection = profile?.currentDirection;
  return (
    port?.currentDirection?.type ||
    port?.currentDirection?.name ||
    (typeof profileDirection === 'string' ? profileDirection : profileDirection?.type || profileDirection?.name) ||
    port?.currentType ||
    port?.type
  );
}

function getUserAvatar(user?: TransactionUser) {
  return getDisplayImageUrl(user?.image?.url || user?.avatarUrl || user?.avatar_url || user?.avatar?.url || user?.avatar?.path);
}

function getChargeInfoMeta(item: TransactionRecord) {
  const chargeType = item.chargeType?.toLowerCase();
  const hasChargeValue = item.chargeValue !== undefined && item.chargeValue !== null && toNumber(item.chargeValue) > 0;

  if (chargeType === 'consumed') {
    return {
      backgroundColor: '#ECFDF3',
      borderColor: '#ABEFC6',
      color: '#067647',
      label: hasChargeValue ? `Limit ${(toNumber(item.chargeValue) / 1000).toFixed(2)} kW` : formatChargeType(item.chargeType),
    };
  }

  if (chargeType === 'quick.charge') {
    return { backgroundColor: '#FFFAEB', borderColor: '#FEDF89', color: '#B54708', label: 'Quick Charge' };
  }

  return {
    backgroundColor: '#EFF8FF',
    borderColor: '#B2DDFF',
    color: '#175CD3',
    label: hasChargeValue ? formatSecondsToTime(item.chargeValue) : formatChargeType(item.chargeType),
  };
}

function isTransactionCharging(status?: TransactionRecord['status']) {
  const normalizedStatus = String(status ?? '').toLowerCase();
  return status === undefined || status === false || status === 0 || normalizedStatus === '0' || normalizedStatus === 'charging';
}

function getTransactionTone(item: TransactionRecord, isBike: boolean): TransactionTone {
  if (isTransactionCharging(item.status)) return 'charging';
  const threshold = isBike ? transactionBikeSuccessWh : transactionCarSuccessWh;
  if (toNumber(item.wattageConsumed) < threshold) return 'danger';
  return toNumber(item.activationFee) !== 0 ? 'warning' : 'success';
}

function getTransactionStatus(tone: TransactionTone) {
  if (tone === 'charging') return { backgroundColor: '#EFF8FF', borderColor: '#B2DDFF', color: '#175CD3', icon: 'zap' as const, label: 'CHARGING' };
  if (tone === 'danger') return { backgroundColor: '#FEF2F2', borderColor: '#FECACA', color: '#B9382E', icon: 'alert' as const, label: 'FAILED' };
  if (tone === 'warning') return { backgroundColor: '#FFFAEB', borderColor: '#FEDF89', color: '#B54708', icon: 'alert' as const, label: 'ACTIVATION' };
  return { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0', color: successAccent, icon: 'check' as const, label: 'FINISHED' };
}

function getPortLabel(port: TransactionPort | undefined, isBike: boolean) {
  const kind = isBike ? 'Outlet' : 'Connector';
  const value = port?.name || port?.orderOnBox || port?.connectorId || port?.outletId || port?.id;
  if (value === undefined || value === null || value === '') return `${kind} --`;
  const label = String(value);
  return /outlet|connector|conn/i.test(label) ? label : `${kind} ${label}`;
}

function TransactionStatusIcon({ color, icon }: { color: string; icon: ReturnType<typeof getTransactionStatus>['icon'] }) {
  if (icon === 'check') return <CircleCheck color={color} size={10} />;
  if (icon === 'alert') return <TriangleAlert color={color} size={10} />;
  return <Zap color={color} size={10} />;
}

function MetricPill({ children }: { children: React.ReactNode }) {
  return (
    <ThemedView
      alignItems='center'
      backgroundColor={Palette.surfaceMuted}
      borderColor={Palette.borderSubtle}
      borderRadius={'small'}
      borderWidth={1}
      flexDirection='row'
      gap={'one'}
      justifyContent='center'
      minHeight={28}
      minWidth={0}
      paddingHorizontal={3}
      paddingVertical={'one'}
      width='24%'>
      {children}
    </ThemedView>
  );
}

function CardSurface({ children, tone }: { children: React.ReactNode; tone: TransactionTone }) {
  const surface =
    tone === 'danger'
      ? { backgroundColor: '#FEF7F7', borderColor: '#FFCCD3' }
      : tone === 'warning'
        ? { backgroundColor: '#FFFAEB', borderColor: '#FEDF89' }
        : tone === 'charging'
          ? { backgroundColor: '#F8FAFF', borderColor: '#C7D7FE' }
          : { backgroundColor: Palette.surfaceBase, borderColor: Palette.borderSubtle };

  return (
    <ThemedView
      backgroundColor={surface.backgroundColor}
      borderColor={surface.borderColor}
      borderRadius={16}
      borderWidth={1}
      boxShadow='0 8px 20px rgba(15, 23, 42, 0.08)'
      gap={'three'}
      padding={'three'}
      width='100%'>
      {children}
    </ThemedView>
  );
}

export function TransactionSessionCard({ item: rawItem }: { item: CmsRecord }) {
  const router = useRouter();
  const item = rawItem as TransactionRecord;
  const isBike = Boolean(item.bikeBox);
  const box = item.carBox || item.bikeBox;
  const port = item.carConnector || item.outlet;
  const portLabel = getPortLabel(port, isBike);
  const currentType = (getCurrentType(port) || 'AC').toUpperCase();
  const boxIdentifier = box?.uniqueId || box?.vendorId || 'Unknown box';
  const boxSecondary = box?.uniqueId ? box.vendorId || box.name || '--' : box?.name;
  const energyKwh = toNumber(item.wattageConsumed) / 1000;
  const activationFee = toNumber(item.activationFee);
  const chargingFee = toNumber(item.totalFee ?? item.totalConsumedFee ?? item.chargingFee);
  const promotionPercent = toNumber(item.promotionDiscount);
  const calculatedDiscount = Math.round(chargingFee * (promotionPercent / 100));
  const discount = item.discountAmount !== undefined && item.discountAmount !== null ? toNumber(item.discountAmount) : calculatedDiscount;
  const paidTotal = item.paid !== undefined && item.paid !== null ? toNumber(item.paid) : Math.max(0, chargingFee - discount);
  const promotionCode = getPromotionCode(item);
  const userAvatar = getUserAvatar(item.user);
  const transactionTone = getTransactionTone(item, isBike);
  const statusMeta = getTransactionStatus(transactionTone);
  const chargeMeta = getChargeInfoMeta(item);
  const reasonAccent = transactionTone === 'danger' ? Palette.textSecondary : '#B45309';
  const portPower = toNumber(port?.power ?? box?.power);
  const portPhase = toNumber(port?.phase ?? box?.phase);
  const portDetails = [portPower > 0 ? `${portPower} kW` : '', portPhase > 0 ? `${portPhase}P` : ''].filter(Boolean).join(' · ');
  const innerBackgroundColor = transactionTone === 'danger' ? '#FEF2F2' : transactionTone === 'charging' ? '#EBF5FF' : Palette.surfaceMuted;
  const innerBorderColor = transactionTone === 'danger' ? '#FECACA' : transactionTone === 'charging' ? '#BFDBFE' : Palette.borderSubtle;
  const statusLogId = isBike ? box?.uniqueId || box?.vendorId : box?.vendorId || box?.uniqueId;

  const copy = (text?: string) => {
    if (text) void Clipboard.setStringAsync(text);
  };

  const openStatusLogs = (event: GestureResponderEvent) => {
    event.stopPropagation();
    if (!statusLogId) return;

    router.push({
      pathname: '/technical/status-logs',
      params: { id: statusLogId, station: box?.station?.name || '', vehicle: isBike ? 'bike' : 'car' },
    } as never);
  };

  const openUserDetails = (event: GestureResponderEvent) => {
    event.stopPropagation();
    if (!item.user?.id) return;

    router.push({ pathname: '/user/[id]', params: { id: item.user.id } });
  };

  const frontCard = (
    <CardSurface tone={transactionTone}>
      <ThemedView gap={'one'}>
        <ThemedView flexDirection='row' gap={'two'} justifyContent='space-between'>
          <Pressable
            accessibilityLabel={`Open status logs for ${boxIdentifier}`}
            accessibilityRole='link'
            disabled={!statusLogId}
            hitSlop={4}
            onPress={openStatusLogs}
            style={{ flex: 1, minWidth: 0 }}>
            {({ pressed }) => (
              <ThemedView alignItems='center' flex={1} flexDirection='row' gap={'one'} minWidth={0} opacity={pressed ? 0.58 : 1}>
                <Cable color={meterAccent} size={16} />
                <ThemedText
                  color={statusLogId ? Palette.accentPressed : Palette.textPrimary}
                  flexShrink={1}
                  fontFamily={FontFamily.semibold}
                  fontSize={14}
                  lineHeight={20}
                  numberOfLines={1}>
                  {boxIdentifier}
                  {boxSecondary && boxSecondary !== boxIdentifier ? ` · ${boxSecondary}` : ''}
                </ThemedText>
              </ThemedView>
            )}
          </Pressable>

          <Pressable
            accessibilityLabel={`Open status logs for ${boxIdentifier}, ${portLabel}`}
            accessibilityRole='link'
            disabled={!statusLogId}
            hitSlop={4}
            onPress={openStatusLogs}>
            {({ pressed }) => (
              <ThemedView alignItems='flex-end' flexShrink={0} opacity={pressed ? 0.58 : 1}>
                <ThemedText
                  color={statusLogId ? Palette.accentPressed : Palette.textSecondary}
                  fontFamily={FontFamily.semibold}
                  fontSize={12}
                  lineHeight={16}
                  numberOfLines={1}>
                  {portLabel}
                  <ThemedText color={currentType === 'DC' ? '#067647' : '#175CD3'} fontFamily={FontFamily.bold}>
                    {` · ${currentType}`}
                  </ThemedText>
                  {!isBike && portDetails ? <ThemedText color={Palette.textSecondary}>{` · ${portDetails}`}</ThemedText> : null}
                </ThemedText>
              </ThemedView>
            )}
          </Pressable>
        </ThemedView>

        <ThemedView alignItems='center' flexDirection='row' gap={'one'}>
          <MapPin color={Palette.textSecondary} size={13} />
          <ThemedText color={Palette.textSecondary} flexShrink={1} fontFamily={FontFamily.regular} fontSize={12} lineHeight={16} numberOfLines={1}>
            {box?.station?.name?.toUpperCase() || 'Unknown station'}
          </ThemedText>
        </ThemedView>

        <ThemedView alignItems='center' flexDirection='row' gap={'one'}>
          <ReceiptText color={Palette.textTertiary} size={12} />
          <ThemedText color={Palette.textTertiary} flexShrink={1} fontFamily={FontFamily.medium} fontSize={10} lineHeight={14} numberOfLines={1} selectable>
            {item.invoiceId || 'No invoice'}
          </ThemedText>
        </ThemedView>
      </ThemedView>

      <ThemedView flexDirection='row' justifyContent='space-between'>
        <MetricPill>
          <Clock color={successAccent} size={11} />
          <ThemedText
            adjustsFontSizeToFit
            color={successAccent}
            flexShrink={1}
            fontFamily={FontFamily.semibold}
            fontSize={10}
            lineHeight={14}
            minimumFontScale={0.8}
            numberOfLines={1}
            selectable>
            {formatTransactionDuration(item.startTime, item.endTime)}
          </ThemedText>
        </MetricPill>
        <MetricPill>
          <Zap color={meterAccent} size={11} />
          <ThemedText
            adjustsFontSizeToFit
            color={meterAccent}
            flexShrink={1}
            fontFamily={FontFamily.bold}
            fontSize={10}
            lineHeight={14}
            minimumFontScale={0.8}
            numberOfLines={1}
            selectable>
            {energyKwh.toFixed(2)} kWh
          </ThemedText>
        </MetricPill>
        <ThemedView
          alignItems='center'
          backgroundColor={chargeMeta.backgroundColor}
          borderColor={chargeMeta.borderColor}
          borderRadius={'small'}
          borderWidth={1}
          justifyContent='center'
          minHeight={28}
          minWidth={0}
          paddingHorizontal={3}
          paddingVertical={'one'}
          width='24%'>
          <ThemedText
            adjustsFontSizeToFit
            color={chargeMeta.color}
            flexShrink={1}
            fontFamily={FontFamily.medium}
            fontSize={10}
            lineHeight={14}
            minimumFontScale={0.8}
            numberOfLines={1}>
            {chargeMeta.label}
          </ThemedText>
        </ThemedView>
        <ThemedView
          alignItems='center'
          backgroundColor={statusMeta.backgroundColor}
          borderColor={statusMeta.borderColor}
          borderRadius={'small'}
          borderWidth={1}
          flexDirection='row'
          gap={'one'}
          justifyContent='center'
          minHeight={28}
          minWidth={0}
          paddingHorizontal={3}
          paddingVertical={'one'}
          width='24%'>
          <TransactionStatusIcon color={statusMeta.color} icon={statusMeta.icon} />
          <ThemedText
            adjustsFontSizeToFit
            color={statusMeta.color}
            flexShrink={1}
            fontFamily={transactionTone === 'danger' ? FontFamily.semibold : FontFamily.medium}
            fontSize={10}
            lineHeight={14}
            minimumFontScale={0.8}
            numberOfLines={1}>
            {statusMeta.label}
          </ThemedText>
        </ThemedView>
      </ThemedView>

      <ThemedView backgroundColor={innerBorderColor} style={{ height: StyleSheet.hairlineWidth }} width='100%' />

      <ThemedView gap={2}>
        <ThemedView flexDirection='row' gap={'two'}>
          <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.regular} fontSize={11} lineHeight={15} width={50}>
            Started
          </ThemedText>
          <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.medium} fontSize={11} lineHeight={15} numberOfLines={1} selectable>
            {formatTransactionTime(item.startTime)}
          </ThemedText>
        </ThemedView>
        <ThemedView flexDirection='row' gap={'two'}>
          <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.regular} fontSize={11} lineHeight={15} width={50}>
            Ended
          </ThemedText>
          <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.medium} fontSize={11} lineHeight={15} numberOfLines={1} selectable>
            {formatTransactionTime(item.endTime)}
          </ThemedText>
        </ThemedView>
      </ThemedView>

      {item.reasonClosed ? (
        <ThemedView backgroundColor={innerBackgroundColor} borderColor={innerBorderColor} borderRadius={12} borderWidth={0.5} gap={'one'} padding={'two'}>
          <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={'one'}>
            <MessageSquareWarning color={reasonAccent} size={13} />
            <ThemedText color={reasonAccent} fontFamily={FontFamily.semibold} fontSize={10} letterSpacing={0.5} lineHeight={14} textTransform='uppercase'>
              Reason closed
            </ThemedText>
          </ThemedView>
          <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.regular} fontSize={12} lineHeight={17} selectable>
            {item.reasonClosed}
          </ThemedText>
        </ThemedView>
      ) : null}

      {!item.reasonClosed ? <ThemedView backgroundColor={innerBorderColor} style={{ height: StyleSheet.hairlineWidth }} width='100%' /> : null}

      <ThemedView alignItems='center' flexDirection='row' gap={'two'}>
        <Pressable
          accessibilityLabel={`Open user details for ${item.user?.name || 'user'}`}
          accessibilityRole='link'
          disabled={!item.user?.id}
          hitSlop={4}
          onPress={openUserDetails}>
          {({ pressed }) => (
            <ThemedView
              alignItems='center'
              backgroundColor={Palette.surfaceMuted}
              borderRadius={20}
              height={40}
              justifyContent='center'
              opacity={pressed ? 0.58 : 1}
              overflow='hidden'
              width={40}>
              {userAvatar ? (
                <Image
                  accessibilityLabel={`${item.user?.name || 'User'} avatar`}
                  contentFit='cover'
                  source={{ uri: userAvatar }}
                  style={{ height: 40, width: 40 }}
                />
              ) : (
                <User color={Palette.textSecondary} size={19} />
              )}
            </ThemedView>
          )}
        </Pressable>

        <ThemedView flex={1} gap={'one'} minWidth={0}>
          <ThemedView alignItems='center' flexDirection='row' gap={'two'} minWidth={0}>
            <Pressable
              accessibilityLabel={`Open user details for ${item.user?.name || 'user'}`}
              accessibilityRole='link'
              disabled={!item.user?.id}
              onPress={openUserDetails}
              style={{ flex: 1, minWidth: 0 }}>
              {({ pressed }) => (
                <ThemedText
                  color={item.user?.id ? Palette.accentPressed : Palette.textPrimary}
                  fontFamily={FontFamily.semibold}
                  fontSize={14}
                  lineHeight={18}
                  numberOfLines={1}
                  opacity={pressed ? 0.58 : 1}
                  selectable>
                  {item.user?.name || 'Unknown user'}
                </ThemedText>
              )}
            </Pressable>

            <ThemedView alignItems='center' flexDirection='row' flexShrink={0} gap={'one'} minWidth={0}>
              <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={11} lineHeight={15} numberOfLines={1} selectable>
                {item.user?.phoneNumber || 'N/A'}
              </ThemedText>
              {item.user?.phoneNumber ? (
                <Pressable
                  accessibilityLabel='Copy phone number'
                  hitSlop={8}
                  onPress={event => {
                    event.stopPropagation();
                    copy(item.user?.phoneNumber);
                  }}>
                  <Copy color={Palette.accent} size={11} />
                </Pressable>
              ) : null}
            </ThemedView>
          </ThemedView>

          <ThemedView alignItems='center' flexDirection='row' gap={'two'} minWidth={0}>
            <Pressable accessibilityRole='link' disabled={!item.user?.id} onPress={openUserDetails}>
              {({ pressed }) => (
                <ThemedText
                  color={item.user?.id ? Palette.accentPressed : Palette.textTertiary}
                  fontFamily={FontFamily.medium}
                  fontSize={10}
                  lineHeight={14}
                  opacity={pressed ? 0.58 : 1}
                  selectable>
                  #{item.user?.id || 'N/A'}
                </ThemedText>
              )}
            </Pressable>

            <ThemedView alignItems='center' flex={1} flexDirection='row' gap={'one'} justifyContent='flex-end' minWidth={0}>
              <ThemedText
                adjustsFontSizeToFit
                color={Palette.textSecondary}
                flexShrink={1}
                fontFamily={FontFamily.regular}
                fontSize={11}
                lineHeight={15}
                minimumFontScale={0.82}
                numberOfLines={1}
                selectable>
                {item.user?.email || 'N/A'}
              </ThemedText>
              {item.user?.email ? (
                <Pressable
                  accessibilityLabel='Copy email'
                  hitSlop={8}
                  onPress={event => {
                    event.stopPropagation();
                    copy(item.user?.email);
                  }}>
                  <Copy color={Palette.accent} size={11} />
                </Pressable>
              ) : null}
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </ThemedView>

      <ThemedView
        backgroundColor={innerBackgroundColor}
        borderColor={innerBorderColor}
        borderRadius={12}
        borderWidth={0.5}
        flexDirection='row'
        gap={'two'}
        padding={'two'}>
        <ThemedView flex={1} minWidth={0}>
          <ThemedText
            color={promotionCode ? successAccent : Palette.textTertiary}
            fontFamily={FontFamily.medium}
            fontSize={10}
            lineHeight={14}
            numberOfLines={1}>
            {promotionCode ? `${promotionCode}${promotionPercent > 0 ? ` (${promotionPercent}%)` : ''}` : 'No promotion code applied'}
          </ThemedText>
          <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={11} lineHeight={15}>
            Paid Total
          </ThemedText>
          <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={20} lineHeight={25} numberOfLines={1} selectable>
            {formatCurrency(paidTotal)}
          </ThemedText>
        </ThemedView>

        <ThemedView backgroundColor={innerBorderColor} style={{ width: StyleSheet.hairlineWidth }} />

        <ThemedView flex={1} gap={'one'} justifyContent='center' minWidth={0}>
          <ThemedView flexDirection='row' gap={'one'} justifyContent='space-between'>
            <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.regular} fontSize={11} lineHeight={15}>
              Activation
            </ThemedText>
            <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={11} lineHeight={15} numberOfLines={1} selectable>
              {formatCurrency(activationFee)}
            </ThemedText>
          </ThemedView>
          <ThemedView flexDirection='row' gap={'one'} justifyContent='space-between'>
            <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.regular} fontSize={11} lineHeight={15}>
              Charging
            </ThemedText>
            <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={11} lineHeight={15} numberOfLines={1} selectable>
              {formatCurrency(chargingFee)}
            </ThemedText>
          </ThemedView>
          {discount > 0 ? (
            <ThemedView flexDirection='row' gap={'one'} justifyContent='space-between'>
              <ThemedText color={successAccent} fontFamily={FontFamily.regular} fontSize={11} lineHeight={15}>
                Discount
              </ThemedText>
              <ThemedText color={successAccent} fontFamily={FontFamily.medium} fontSize={11} lineHeight={15} numberOfLines={1} selectable>
                -{formatCurrency(discount)}
              </ThemedText>
            </ThemedView>
          ) : null}
        </ThemedView>
      </ThemedView>
    </CardSurface>
  );

  if (isBike) return frontCard;

  return (
    <FlipCard borderRadius={21} containerStyle={{ width: '100%' }} height='auto' scaleOnPress width='100%'>
      <FlipCard.Front>
        <FlipCard.Trigger>{frontCard}</FlipCard.Trigger>
      </FlipCard.Front>
      <FlipCard.Back>
        <FlipCard.Trigger>
          <ThemedView
            backgroundColor={Palette.surfaceBase}
            borderColor={Palette.borderSubtle}
            borderRadius={21}
            borderWidth={1}
            boxShadow='0 8px 20px rgba(15, 23, 42, 0.08)'
            height='100%'
            overflow='hidden'
            width='100%'>
            <ChargingProfileChart compact fallbackEnergyKwh={energyKwh} mobileCard transactionId={item.transactionId || null} />
          </ThemedView>
        </FlipCard.Trigger>
      </FlipCard.Back>
    </FlipCard>
  );
}
