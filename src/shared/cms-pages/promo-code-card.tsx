import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Bike, Calendar, Car, Check, ChevronDown, ChevronUp, Copy, Pencil, Zap } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable } from 'react-native';

import { ThemedText, ThemedView } from 'components/base';
import { FontFamily, Palette } from 'themes';
import type { CmsSectionConfig } from './config';
import type { CmsRecord } from './service';

export type PromoCodeItem = CmsRecord & {
  approval?: string;
  approvalStatus?: string;
  approved?: boolean;
  boxTargets?: (string | { boxUniqueId?: string; isBlocked?: boolean })[];
  boxUniqueId?: string;
  boxes?: (string | { boxUniqueId?: string; name?: string })[] | string;
  code?: string;
  createdAt?: string;
  currentTotalUsage?: number | string;
  currentUsage?: number | string;
  description?: string;
  descriptionVn?: string;
  discountPercent?: number | string;
  enabled?: boolean;
  expiredAt?: string;
  id?: number | string;
  iriId?: string;
  isApproved?: boolean;
  km?: number | string;
  maxDiscountAmount?: number | string;
  maxRequired?: number | string;
  maxTotalUsage?: number | string;
  maxUsagePerUser?: number | string;
  minRequired?: number | string;
  moneyGift?: number | string;
  monopoly?: boolean;
  name?: string;
  nameVn?: string;
  note?: string;
  promotionCodeBoxes?: ({ boxUniqueId?: string; isBlocked?: boolean; name?: string } | string)[];
  promotionCodeUsers?: ({ isBlocked?: boolean; user?: string; userId?: string | number } | string)[];
  startAt?: string;
  status?: string | number | boolean;
  tag?: string;
  tags?: string[];
  userCount?: number;
  userLimit?: number | string;
  userTargets?: (string | { isBlocked?: boolean; user?: string })[];
  users?: (string | { id?: number | string; user?: string })[] | string;
  vehicleType?: 'bike' | 'car' | 0 | '0' | string;
  visible?: boolean;
};

const currencyFormatter = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });
const LEFT_STUB_WIDTH = 104;

function toNumber(value: unknown): number {
  if (value === undefined || value === null || value === '') return 0;
  const num = Number(typeof value === 'string' ? value.replace(/,/g, '') : value);
  return Number.isFinite(num) ? num : 0;
}

function parseDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  if (typeof value === 'number') {
    return new Date(value < 10_000_000_000 ? value * 1000 : value);
  }
  if (typeof value === 'string' && /^\d{10,13}$/.test(value)) {
    const num = Number(value);
    return new Date(num < 10_000_000_000 ? num * 1000 : num);
  }
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function formatDateString(date?: Date): string {
  if (!date) return '—';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function calculatePromoValidity(startValue?: unknown, endValue?: unknown) {
  const startDate = parseDate(startValue);
  const endDate = parseDate(endValue);
  const now = Date.now();

  const startMs = startDate ? startDate.getTime() : undefined;
  const endMs = endDate ? endDate.getTime() : undefined;

  let durationDays: number | undefined;
  if (startMs !== undefined && endMs !== undefined && endMs >= startMs) {
    durationDays = Math.max(1, Math.round((endMs - startMs) / 86_400_000));
  }

  if (endMs !== undefined && now > endMs) {
    return {
      border: '#FECDCA',
      color: '#B42318',
      durationDays,
      endDate,
      label: 'Expired',
      startDate,
      statusColor: '#D92D20',
      surface: '#FEF3F2',
      tone: 'expired' as const,
    };
  }

  if (startMs !== undefined && now < startMs) {
    const daysUntilStart = Math.max(1, Math.ceil((startMs - now) / 86_400_000));
    return {
      border: '#FEDF89',
      color: '#B54708',
      durationDays,
      endDate,
      label: `Upcoming (${daysUntilStart}d)`,
      startDate,
      statusColor: '#D97706',
      surface: '#FFFAEB',
      tone: 'upcoming' as const,
    };
  }

  if (endMs !== undefined) {
    const daysLeft = Math.max(0, Math.ceil((endMs - now) / 86_400_000));
    return {
      border: '#ABEFC6',
      color: '#067647',
      daysLeft,
      durationDays,
      endDate,
      label: `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left`,
      startDate,
      statusColor: '#0B9B55',
      surface: '#ECFDF3',
      tone: 'active' as const,
    };
  }

  return {
    border: Palette.borderSubtle,
    color: Palette.textTertiary,
    durationDays,
    endDate,
    label: 'No expiry',
    startDate,
    statusColor: Palette.textTertiary,
    surface: Palette.surfaceMuted,
    tone: 'none' as const,
  };
}

export function getPromoVehicleInfo(vehicleType: unknown) {
  const normalized = String(vehicleType ?? '')
    .toLowerCase()
    .trim();
  if (normalized === 'bike' || normalized === '1') {
    return {
      icon: Bike,
      label: 'Bike',
      type: 'bike' as const,
    };
  }
  if (normalized === 'car' || normalized === '2') {
    return {
      icon: Car,
      label: 'Car',
      type: 'car' as const,
    };
  }
  return {
    icon: Zap,
    label: 'All vehicles',
    type: 'all' as const,
  };
}

function extractIdString(item: unknown): string {
  if (typeof item === 'string') {
    return item.replace(/^\/?api\/users\//, '').replace(/^\/?api\/promotion_code_users\//, '');
  }
  if (item && typeof item === 'object') {
    const obj = item as Record<string, unknown>;
    const cand = obj.boxUniqueId || obj.uniqueId || obj.user || obj.userId || obj.id || obj.name;
    return String(cand ?? '').replace(/^\/?api\/users\//, '');
  }
  return String(item ?? '');
}

export function getPromoAudienceSummary(record: PromoCodeItem) {
  const rawUsers = record.promotionCodeUsers || record.userTargets || record.users;
  const userList = Array.isArray(rawUsers) ? rawUsers.map(extractIdString).filter(Boolean) : [];
  const singleUser = typeof record.users === 'string' && record.users.trim() ? record.users.trim() : undefined;

  let usersLabel = 'All users';
  let isUsersAll = true;

  if (userList.length === 1) {
    usersLabel = `User: ${userList[0]}`;
    isUsersAll = false;
  } else if (userList.length > 1) {
    usersLabel = `${userList.length} users`;
    isUsersAll = false;
  } else if (singleUser) {
    usersLabel = `User: ${singleUser}`;
    isUsersAll = false;
  }

  const rawBoxes = record.promotionCodeBoxes || record.boxTargets || record.boxes;
  const boxList = Array.isArray(rawBoxes) ? rawBoxes.map(extractIdString).filter(Boolean) : [];
  const singleBox = record.boxUniqueId || (typeof record.boxes === 'string' && record.boxes.trim() ? record.boxes.trim() : undefined);

  let boxesLabel = 'All boxes';
  let isBoxesAll = true;

  if (boxList.length === 1) {
    boxesLabel = `Box: ${boxList[0]}`;
    isBoxesAll = false;
  } else if (boxList.length > 1) {
    boxesLabel = `${boxList.length} boxes`;
    isBoxesAll = false;
  } else if (singleBox) {
    boxesLabel = `Box: ${singleBox}`;
    isBoxesAll = false;
  }

  const kmVal = record.km !== undefined && record.km !== null && record.km !== '' && record.km !== 'NONE' ? String(record.km) : undefined;

  return {
    boxList,
    boxesLabel,
    isBoxesAll,
    isUsersAll,
    kmLabel: kmVal ? `${kmVal} km` : undefined,
    userList,
    usersLabel,
  };
}

export function PromoCodeCard({
  accentColor: _accentColor = '#D64A7F',
  index,
  onEdit,
  record: rawRecord,
  section,
}: {
  accentColor?: string;
  index: number;
  onEdit?: () => void;
  record: CmsRecord;
  section: CmsSectionConfig;
}) {
  const record = rawRecord as PromoCodeItem;
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const recordId = record.id ?? (record.iriId ? String(record.iriId).split('/').filter(Boolean).at(-1) : undefined);
  const isWallet = section.key === 'wallet' || record.moneyGift !== undefined;

  // Code is the primary title
  const code = record.code?.trim() || `PROMO#${recordId ?? index + 1}`;

  // Validity
  const validity = useMemo(() => calculatePromoValidity(record.startAt, record.expiredAt), [record.startAt, record.expiredAt]);

  // Discount / Value
  const discountPercent = toNumber(record.discountPercent);
  const maxDiscount = toNumber(record.maxDiscountAmount);
  const isUnlimitedMax = maxDiscount <= 0;

  const moneyGift = toNumber(record.moneyGift);
  const minRequired = toNumber(record.minRequired);

  // Audience
  const vehicle = useMemo(() => getPromoVehicleInfo(record.vehicleType), [record.vehicleType]);
  const audience = useMemo(() => getPromoAudienceSummary(record), [record]);

  // Usage & Limits
  const currentUsage = toNumber(record.currentTotalUsage ?? record.currentUsage ?? 0);
  const maxTotalUsage = toNumber(record.maxTotalUsage ?? -1);
  const isUnlimitedTotal = maxTotalUsage <= 0;

  // Status
  const isEnabled = record.enabled !== false;
  const isVisible = record.visible !== false;
  const isMonopoly = Boolean(record.monopoly);
  const approvalLabel = String(record.approval || record.approvalStatus || 'System');

  const handleCopyCode = useCallback(async () => {
    try {
      await Clipboard.setStringAsync(code);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard error
    }
  }, [code]);

  return (
    <ThemedView
      backgroundColor={Palette.surfaceRaised}
      borderColor={Palette.borderSubtle}
      borderCurve='continuous'
      borderRadius={16}
      borderWidth={1}
      boxShadow='0 4px 14px rgba(15, 23, 42, 0.05)'
      overflow='hidden'
      width='100%'>
      {/* VOUCHER TICKET SECTION */}
      <ThemedView alignItems='stretch' flexDirection='row' minHeight={116} position='relative'>
        {/* 1. LEFT STUB: % Discount & Remaining Validity */}
        <ThemedView
          alignItems='center'
          backgroundColor={isWallet ? '#FDF2F8' : '#F0FDF4'}
          borderRightColor={Palette.borderSubtle}
          borderRightWidth={1}
          borderStyle='dashed'
          justifyContent='center'
          paddingHorizontal={6}
          paddingVertical={12}
          width={LEFT_STUB_WIDTH}>
          {/* Discount / Gift Value */}
          <ThemedView alignItems='center' gap={1}>
            <ThemedText
              adjustsFontSizeToFit
              color={isWallet ? '#C11574' : '#027A48'}
              fontFamily={FontFamily.bold}
              fontSize={22}
              lineHeight={26}
              minimumFontScale={0.75}
              numberOfLines={1}
              selectable>
              {isWallet ? `+${moneyGift >= 1000 ? `${moneyGift / 1000}k` : currencyFormatter.format(moneyGift)}` : `${discountPercent}%`}
            </ThemedText>
            <ThemedText color={isWallet ? '#9E165F' : '#047857'} fontFamily={FontFamily.bold} fontSize={10} letterSpacing={0.8} textTransform='uppercase'>
              {isWallet ? 'WALLET' : 'DISCOUNT'}
            </ThemedText>
          </ThemedView>

          {/* Remaining Validity Pill */}
          <ThemedView
            alignItems='center'
            backgroundColor={validity.surface}
            borderColor={validity.border}
            borderRadius={'pill'}
            borderWidth={1}
            marginTop={8}
            paddingHorizontal={6}
            paddingVertical={3}>
            <ThemedText color={validity.color} fontFamily={FontFamily.semibold} fontSize={10} lineHeight={13} numberOfLines={1}>
              {validity.label}
            </ThemedText>
          </ThemedView>
        </ThemedView>

        {/* TOP TICKET CUTOUT NOTCH */}
        <ThemedView
          backgroundColor={Palette.surfaceBase}
          borderColor={Palette.borderSubtle}
          borderRadius={8}
          borderWidth={1}
          height={14}
          left={LEFT_STUB_WIDTH - 7}
          position='absolute'
          top={-8}
          width={14}
        />

        {/* BOTTOM TICKET CUTOUT NOTCH */}
        <ThemedView
          backgroundColor={Palette.surfaceBase}
          borderColor={Palette.borderSubtle}
          borderRadius={8}
          borderWidth={1}
          bottom={-8}
          height={14}
          left={LEFT_STUB_WIDTH - 7}
          position='absolute'
          width={14}
        />

        {/* 2. RIGHT BODY: Promo Code, Date Range, Conditions */}
        <ThemedView flex={1} gap={5} justifyContent='center' paddingHorizontal={12} paddingVertical={10}>
          {/* Row 1: Code + Copy + Edit */}
          <ThemedView alignItems='center' flexDirection='row' justifyContent='space-between'>
            <Pressable
              accessibilityHint='Tap to copy code'
              accessibilityLabel={`Copy code ${code}`}
              accessibilityRole='button'
              hitSlop={6}
              onPress={handleCopyCode}
              style={({ pressed }) => ({ flex: 1, minWidth: 0, opacity: pressed ? 0.65 : 1 })}>
              <ThemedView alignItems='center' flexDirection='row' gap={5}>
                <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={15} letterSpacing={0.5} numberOfLines={1} selectable>
                  {code}
                </ThemedText>
                {copied ? (
                  <ThemedView
                    alignItems='center'
                    backgroundColor='#E8F7EE'
                    borderRadius={'pill'}
                    flexDirection='row'
                    gap={2}
                    paddingHorizontal={5}
                    paddingVertical={1}>
                    <Check color={Palette.accent} size={10} strokeWidth={2.5} />
                    <ThemedText color={Palette.accent} fontFamily={FontFamily.bold} fontSize={9}>
                      Copied
                    </ThemedText>
                  </ThemedView>
                ) : (
                  <Copy color={Palette.textTertiary} size={12} />
                )}
              </ThemedView>
            </Pressable>

            {onEdit ? (
              <Pressable
                accessibilityLabel={`Edit ${code}`}
                accessibilityRole='button'
                hitSlop={6}
                onPress={onEdit}
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
                <ThemedView alignItems='center' backgroundColor='#F1F5F9' borderRadius={'pill'} height={22} justifyContent='center' width={22}>
                  <Pencil color={Palette.textSecondary} size={10} strokeWidth={2} />
                </ThemedView>
              </Pressable>
            ) : null}
          </ThemedView>

          {/* Row 2: Date Range */}
          <ThemedView alignItems='center' flexDirection='row' gap={4}>
            <Calendar color={Palette.textTertiary} size={11} />
            <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={11} lineHeight={15}>
              {formatDateString(validity.startDate)} – {formatDateString(validity.endDate)}
            </ThemedText>
          </ThemedView>

          {/* Row 3: Discount Limit & Vehicle */}
          <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.regular} fontSize={11} lineHeight={15} numberOfLines={1}>
            {isWallet
              ? minRequired > 0
                ? `Min deposit: ${currencyFormatter.format(minRequired)} đ`
                : 'No min deposit'
              : isUnlimitedMax
                ? 'No max limit'
                : `Max: ${currencyFormatter.format(maxDiscount)} đ`}
            {' · '}
            {vehicle.label}
          </ThemedText>

          {/* Row 4: Target Scope & Usage & Details Action */}
          <ThemedView alignItems='center' flexDirection='row' justifyContent='space-between'>
            <ThemedText color={Palette.textTertiary} flex={1} fontFamily={FontFamily.regular} fontSize={10} numberOfLines={1}>
              {audience.boxesLabel} · Used: {currentUsage}
              {isUnlimitedTotal ? '/∞' : `/${maxTotalUsage}`}
            </ThemedText>

            <Pressable
              accessibilityRole='button'
              hitSlop={6}
              onPress={() => setExpanded(prev => !prev)}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
              <ThemedView alignItems='center' flexDirection='row' gap={2}>
                <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={10}>
                  {expanded ? 'Collapse' : 'Details'}
                </ThemedText>
                {expanded ? <ChevronUp color={Palette.textSecondary} size={11} /> : <ChevronDown color={Palette.textSecondary} size={11} />}
              </ThemedView>
            </Pressable>
          </ThemedView>
        </ThemedView>
      </ThemedView>

      {/* EXPANDED DRAWER */}
      {expanded ? (
        <ThemedView backgroundColor={Palette.surfaceMuted} borderTopColor={Palette.borderSubtle} borderTopWidth={1} gap={'two'} padding={12}>
          {record.nameVn || record.name ? (
            <ThemedView gap={2}>
              <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={10}>
                Program name
              </ThemedText>
              <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={11} lineHeight={16} selectable>
                {record.name || record.nameVn}
                {record.name && record.nameVn && record.name !== record.nameVn ? ` (${record.nameVn})` : ''}
              </ThemedText>
            </ThemedView>
          ) : null}

          {record.description ? (
            <ThemedView gap={2}>
              <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={10}>
                Description (English)
              </ThemedText>
              <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.regular} fontSize={11} lineHeight={16} selectable>
                {record.description}
              </ThemedText>
            </ThemedView>
          ) : null}

          {record.descriptionVn ? (
            <ThemedView gap={2}>
              <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={10}>
                Description (Vietnamese)
              </ThemedText>
              <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.regular} fontSize={11} lineHeight={16} selectable>
                {record.descriptionVn}
              </ThemedText>
            </ThemedView>
          ) : null}

          {record.note ? (
            <ThemedView gap={2}>
              <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={10}>
                Internal note
              </ThemedText>
              <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={11} lineHeight={16} selectable>
                {record.note}
              </ThemedText>
            </ThemedView>
          ) : null}

          <ThemedView gap={2}>
            <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={10}>
              System configuration
            </ThemedText>
            <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={11}>
              {isEnabled ? 'Enabled' : 'Disabled'} · {isVisible ? 'Visible' : 'Hidden'}
              {isMonopoly ? ' · Monopoly' : ''} · {approvalLabel}
            </ThemedText>
          </ThemedView>

          {audience.boxList.length > 0 ? (
            <ThemedView gap={2}>
              <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={10}>
                Target boxes ({audience.boxList.length})
              </ThemedText>
              <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={11} selectable>
                {audience.boxList.join(', ')}
              </ThemedText>
            </ThemedView>
          ) : null}

          {audience.userList.length > 0 ? (
            <ThemedView gap={2}>
              <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={10}>
                Target users ({audience.userList.length})
              </ThemedText>
              <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={11} selectable>
                {audience.userList.join(', ')}
              </ThemedText>
            </ThemedView>
          ) : null}

          {onEdit ? (
            <Pressable
              accessibilityRole='button'
              onPress={onEdit}
              style={({ pressed }) => ({
                alignItems: 'center',
                backgroundColor: Palette.surfaceBase,
                borderColor: Palette.borderSubtle,
                borderRadius: 8,
                borderWidth: 1,
                flexDirection: 'row',
                gap: 5,
                justifyContent: 'center',
                minHeight: 34,
                marginTop: 2,
                opacity: pressed ? 0.7 : 1,
              })}>
              <Pencil color={Palette.textPrimary} size={12} />
              <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={12}>
                Edit promotion code
              </ThemedText>
            </Pressable>
          ) : null}
        </ThemedView>
      ) : null}
    </ThemedView>
  );
}
