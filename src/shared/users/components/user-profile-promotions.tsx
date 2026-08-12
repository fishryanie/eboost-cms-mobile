import * as Haptics from 'expo-haptics';
import { ChevronDown, ChevronUp, CircleDollarSign, Gift, History, ReceiptText, Sparkles, TicketPercent, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView } from 'react-native';

import { ThemedText, ThemedView } from 'components/base';
import { EmptyState } from 'components/ui';
import { FontFamily, Palette } from 'themes';

import { MiniBadge, ProfileRecordList, RecordDetails, SectionHeading, SurfaceCard } from './user-profile-common';
import { formatCurrency, formatDate, numberFormatter, profileColors } from './user-profile-helpers';
import type { PromotionTab } from './user-profile-types';

export function UserProfilePromotions({ user }: { user: UserProfile }) {
  const [activeTab, setActiveTab] = useState<PromotionTab>('code-history');
  const tabs: { Icon: LucideIcon; count: number; label: string; value: PromotionTab }[] = [
    { Icon: History, count: user.promotionCodeHistories?.length || 0, label: 'Code usage', value: 'code-history' },
    { Icon: TicketPercent, count: user.promotionCodes?.length || 0, label: 'Codes', value: 'codes' },
    { Icon: Gift, count: user.promotionMoneys?.length || 0, label: 'Promo money', value: 'money' },
    { Icon: CircleDollarSign, count: user.promotionMoneyHistories?.length || 0, label: 'Money history', value: 'money-history' },
  ];

  return (
    <ThemedView backgroundColor='transparent' gap={'five'}>
      <ThemedView backgroundColor='transparent' gap={'three'}>
        <SectionHeading
          eyebrow='Promotion matrix'
          subtitle='Code redemption, available assets, promotional money, and every returned history object.'
          title='Incentives & usage'
        />
        <ScrollView contentContainerStyle={{ gap: 8, paddingRight: 12 }} horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map(tab => {
            const selected = activeTab === tab.value;
            const Icon = tab.Icon;
            return (
              <Pressable
                accessibilityRole='tab'
                accessibilityState={{ selected }}
                key={tab.value}
                onPress={() => {
                  void Haptics.selectionAsync().catch(() => undefined);
                  setActiveTab(tab.value);
                }}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                <ThemedView
                  alignItems='center'
                  backgroundColor={selected ? profileColors.accentSurface : Palette.surfaceRaised}
                  borderColor={selected ? profileColors.accentBorder : Palette.borderSubtle}
                  borderRadius={'pill'}
                  borderWidth={1}
                  flexDirection='row'
                  gap={'two'}
                  height={38}
                  paddingHorizontal={'three'}>
                  <Icon color={selected ? Palette.accent : Palette.textTertiary} size={15} />
                  <ThemedText color={selected ? Palette.accent : Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={11}>
                    {tab.label}
                  </ThemedText>
                  <MiniBadge
                    color={selected ? Palette.accent : Palette.textSecondary}
                    label={String(tab.count)}
                    surface={selected ? '#D7F6E4' : Palette.surfaceMuted}
                  />
                </ThemedView>
              </Pressable>
            );
          })}
        </ScrollView>
      </ThemedView>
      <PromotionContent activeTab={activeTab} user={user} />
    </ThemedView>
  );
}

function PromotionContent({ activeTab, user }: { activeTab: PromotionTab; user: UserProfile }) {
  if (activeTab === 'code-history') {
    const items = user.promotionCodeHistories || [];
    if (!items.length) return <EmptyState message='No promotion code usage was returned for this account.' title='No code usage' />;

    return (
      <ThemedView backgroundColor='transparent' gap={'two'}>
        {items.map(item => (
          <PromotionUsageCard item={item} key={item.id} />
        ))}
      </ThemedView>
    );
  }

  if (activeTab === 'codes') {
    return (
      <ProfileRecordList emptyMessage='No promotion code asset is linked to this account.' emptyTitle='No promotion codes' records={user.promotionCodes} />
    );
  }

  if (activeTab === 'money') {
    return (
      <ProfileRecordList
        emptyMessage='No promotional money asset is linked to this account.'
        emptyTitle='No promotional money'
        records={user.promotionMoneys}
      />
    );
  }

  return (
    <ProfileRecordList
      emptyMessage='No promotional money usage history was returned for this account.'
      emptyTitle='No money usage history'
      records={user.promotionMoneyHistories}
    />
  );
}

function PromotionUsageCard({ item }: { item: UserPromotionHistoryItem }) {
  const [expanded, setExpanded] = useState(false);
  const usedLabel = item.isUsed === false ? 'Available' : 'Used';
  const accent = item.isUsed === false ? profileColors.warning : profileColors.accent;
  const surface = item.isUsed === false ? profileColors.warningSurface : profileColors.accentSurface;

  return (
    <SurfaceCard>
      <ThemedView gap={'three'}>
        <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={'three'}>
          <ThemedView alignItems='center' backgroundColor={surface} borderRadius={12} height={42} justifyContent='center' width={42}>
            <Sparkles color={accent} size={19} />
          </ThemedView>
          <ThemedView backgroundColor='transparent' flex={1} gap={2} minWidth={0}>
            <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={14} lineHeight={19} numberOfLines={1} selectable>
              {item.code}
            </ThemedText>
            <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={10}>
              {formatDate(item.usedAt)}
            </ThemedText>
          </ThemedView>
          <ThemedView alignItems='flex-end' gap={3}>
            <ThemedText color={accent} fontFamily={FontFamily.bold} fontSize={14} selectable>
              {numberFormatter.format(item.discountPercent || 0)}%
            </ThemedText>
            <MiniBadge color={accent} label={usedLabel} surface={surface} />
          </ThemedView>
        </ThemedView>

        <ThemedView backgroundColor={Palette.surfaceMuted} borderCurve='continuous' borderRadius={13} gap={'two'} padding={'three'}>
          <PromotionSummaryRow label='Saved' value={formatCurrency(item.discountAmount)} />
          <PromotionSummaryRow label='Invoice' value={item.invoiceId || 'Not available'} />
          <PromotionSummaryRow label='Vehicle' value={item.vehicleType || 'Not available'} />
        </ThemedView>

        <Pressable accessibilityRole='button' onPress={() => setExpanded(value => !value)} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
          <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={'two'} justifyContent='center' minHeight={32}>
            <ReceiptText color={Palette.textSecondary} size={14} />
            <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={11}>
              {expanded ? 'Hide all API fields' : 'Show all API fields'}
            </ThemedText>
            {expanded ? <ChevronUp color={Palette.textTertiary} size={15} /> : <ChevronDown color={Palette.textTertiary} size={15} />}
          </ThemedView>
        </Pressable>
        {expanded ? <RecordDetails record={item} /> : null}
      </ThemedView>
    </SurfaceCard>
  );
}

function PromotionSummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={'three'}>
      <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={10} width={52}>
        {label}
      </ThemedText>
      <ThemedText color={Palette.textPrimary} flex={1} fontFamily={FontFamily.semibold} fontSize={11} lineHeight={16} numberOfLines={2} selectable>
        {value}
      </ThemedText>
    </ThemedView>
  );
}
