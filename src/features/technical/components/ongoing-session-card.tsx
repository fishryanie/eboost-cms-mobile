import { Battery, Cable, Clock, Copy, MapPin, User, Zap } from 'lucide-react-native';
import type React from 'react';
import { Pressable } from 'react-native';

import { ThemedText, ThemedView } from 'components/base';
import { FontFamily, Palette, Radius, Spacing } from 'themes';
import type { OngoingSessionRecord } from '../types';
import { formatChargeType, formatCurrency, formatSessionDuration, formatSessionTime, getOngoingSessionPayment } from './ongoing-session-card.helpers';

type OngoingSessionCardProps = {
  item: OngoingSessionRecord;
  onCopy?: (text?: string) => void;
};

const meterAccent = '#0284C7';
const successAccent = '#15803D';

function MetricPill({ children }: { children: React.ReactNode }) {
  return (
    <ThemedView
      alignItems='center'
      backgroundColor={Palette.surfaceMuted}
      borderColor={Palette.borderSubtle}
      borderRadius={Radius.small}
      borderWidth={1}
      flexDirection='row'
      gap={Spacing.one}
      minHeight={30}
      paddingHorizontal={Spacing.two}
      paddingVertical={Spacing.one}>
      {children}
    </ThemedView>
  );
}

export function OngoingSessionCard({ item, onCopy }: OngoingSessionCardProps) {
  const session = item.charging_session;
  const payment = getOngoingSessionPayment(item);
  const user = session?.user;

  return (
    <ThemedView
      backgroundColor={Palette.surfaceBase}
      borderColor={Palette.borderSubtle}
      borderRadius={Radius.large}
      borderWidth={1}
      boxShadow='0 8px 20px rgba(15, 23, 42, 0.08)'
      gap={Spacing.three}
      padding={Spacing.three}
      width='100%'>
      <ThemedView flexDirection='row' gap={Spacing.two} justifyContent='space-between'>
        <ThemedView flex={1} minWidth={0}>
          <ThemedView alignItems='center' flexDirection='row' gap={Spacing.one}>
            <Cable color={meterAccent} size={16} />
            <ThemedText color={Palette.textPrimary} flexShrink={1} fontFamily={FontFamily.semibold} fontSize={15} lineHeight={20} numberOfLines={1}>
              {item.boxId || item.vendorId || 'Unknown box'}
            </ThemedText>
          </ThemedView>
          <ThemedView alignItems='center' flexDirection='row' gap={Spacing.one} marginTop={Spacing.one}>
            <MapPin color={Palette.textSecondary} size={13} />
            <ThemedText color={Palette.textSecondary} flexShrink={1} fontFamily={FontFamily.regular} fontSize={12} lineHeight={16} numberOfLines={1}>
              {item.stationName?.toUpperCase() || 'Unknown station'}
            </ThemedText>
          </ThemedView>
        </ThemedView>

        <ThemedView alignItems='flex-end' minWidth={66}>
          <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={12} lineHeight={16}>
            Conn {item.connectorId || item.carConnectorId || '-'}
          </ThemedText>
          <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={11} lineHeight={15}>
            {item.power || 0} kW · {item.phase || 0}P
          </ThemedText>
        </ThemedView>
      </ThemedView>

      <ThemedView flexDirection='row' flexWrap='wrap' gap={Spacing.two}>
        <MetricPill>
          <Clock color={successAccent} size={13} />
          <ThemedText color={successAccent} fontFamily={FontFamily.semibold} fontSize={12} lineHeight={16}>
            {formatSessionDuration(session?.start_time, session?.end_time)}
          </ThemedText>
        </MetricPill>
        <MetricPill>
          <Zap color={meterAccent} size={13} />
          <ThemedText color={meterAccent} fontFamily={FontFamily.bold} fontSize={12} lineHeight={16}>
            {(session?.wattage_consumed || 0).toFixed(2)} kWh
          </ThemedText>
        </MetricPill>
        <MetricPill>
          <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.medium} fontSize={12} lineHeight={16}>
            {(session?.latest_detail?.A || 0).toFixed(0)}A
          </ThemedText>
        </MetricPill>
        <MetricPill>
          <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.medium} fontSize={12} lineHeight={16}>
            {(session?.latest_detail?.V || 0).toFixed(0)}V
          </ThemedText>
        </MetricPill>
        <MetricPill>
          <Battery color={Palette.textSecondary} size={13} />
          <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={12} lineHeight={16}>
            {session?.latest_detail?.SOC || 0}%
          </ThemedText>
        </MetricPill>
      </ThemedView>

      <ThemedView flexDirection='row' flexWrap='wrap' gap={Spacing.two}>
        <ThemedView backgroundColor={Palette.surfaceMuted} borderRadius={Radius.small} paddingHorizontal={Spacing.two} paddingVertical={Spacing.one}>
          <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={10} lineHeight={13} numberOfLines={1}>
            {session?.invoice_id || 'No invoice'}
          </ThemedText>
        </ThemedView>
        <ThemedView
          backgroundColor='#FFF5FA'
          borderColor='#F8CDE1'
          borderRadius={Radius.small}
          borderWidth={1}
          paddingHorizontal={Spacing.two}
          paddingVertical={Spacing.one}>
          <ThemedText color='#D9468A' fontFamily={FontFamily.medium} fontSize={10} lineHeight={13}>
            {formatChargeType(session?.charge_type)}
          </ThemedText>
        </ThemedView>
        <ThemedView
          alignItems='center'
          backgroundColor='#EEF6FF'
          borderColor='#B9D8FF'
          borderRadius={Radius.small}
          borderWidth={1}
          flexDirection='row'
          gap={Spacing.one}
          paddingHorizontal={Spacing.two}
          paddingVertical={Spacing.one}>
          <Zap color='#2F80ED' size={10} />
          <ThemedText color='#2F80ED' fontFamily={FontFamily.medium} fontSize={10} lineHeight={13}>
            {item.status || 'CHARGING'}
          </ThemedText>
        </ThemedView>
      </ThemedView>

      <ThemedView backgroundColor={Palette.borderSubtle} height={1} />

      <ThemedView flexDirection='row' gap={Spacing.three}>
        <ThemedView flex={1} gap={Spacing.one} minWidth={0}>
          <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.regular} fontSize={11} lineHeight={15}>
            Started
          </ThemedText>
          <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.medium} fontSize={12} lineHeight={16} numberOfLines={1}>
            {formatSessionTime(session?.start_time)}
          </ThemedText>
        </ThemedView>
        <ThemedView flex={1} gap={Spacing.one} minWidth={0}>
          <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.regular} fontSize={11} lineHeight={15}>
            Updated
          </ThemedText>
          <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.medium} fontSize={12} lineHeight={16} numberOfLines={1}>
            {formatSessionTime(session?.end_time)}
          </ThemedText>
        </ThemedView>
      </ThemedView>

      <ThemedView backgroundColor={Palette.borderSubtle} height={1} />

      <ThemedView flexDirection='row' gap={Spacing.two}>
        <ThemedView alignItems='center' backgroundColor={Palette.surfaceMuted} borderRadius={18} height={36} justifyContent='center' width={36}>
          <User color={Palette.textSecondary} size={18} />
        </ThemedView>
        <ThemedView flex={1} gap={Spacing.one} minWidth={0}>
          <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={14} lineHeight={18} numberOfLines={1}>
            {user?.name || 'Unknown user'}
          </ThemedText>
          <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={11} lineHeight={14}>
            ID: #{user?.id || 'N/A'}
          </ThemedText>
        </ThemedView>
        <ThemedView alignItems='flex-end' flex={1} gap={Spacing.one} minWidth={0}>
          <ThemedView alignItems='center' flexDirection='row' gap={Spacing.one} maxWidth='100%'>
            <ThemedText color={Palette.textSecondary} flexShrink={1} fontFamily={FontFamily.regular} fontSize={11} lineHeight={15} numberOfLines={1}>
              {user?.phone || 'N/A'}
            </ThemedText>
            {user?.phone ? (
              <Pressable hitSlop={8} onPress={() => onCopy?.(user.phone)}>
                <Copy color={Palette.accent} size={11} />
              </Pressable>
            ) : null}
          </ThemedView>
          <ThemedView alignItems='center' flexDirection='row' gap={Spacing.one} maxWidth='100%'>
            <ThemedText color={Palette.textSecondary} flexShrink={1} fontFamily={FontFamily.regular} fontSize={11} lineHeight={15} numberOfLines={1}>
              {user?.email || 'N/A'}
            </ThemedText>
            {user?.email ? (
              <Pressable hitSlop={8} onPress={() => onCopy?.(user.email)}>
                <Copy color={Palette.accent} size={11} />
              </Pressable>
            ) : null}
          </ThemedView>
        </ThemedView>
      </ThemedView>

      <ThemedView backgroundColor={Palette.surfaceMuted} borderRadius={Radius.medium} flexDirection='row' gap={Spacing.two} padding={Spacing.two}>
        <ThemedView flex={1} minWidth={0}>
          {payment.promotionPercent > 0 ? (
            <ThemedText color={successAccent} fontFamily={FontFamily.medium} fontSize={10} lineHeight={14} numberOfLines={1}>
              {payment.promotion ? `${payment.promotion} ` : ''}({payment.promotionPercent}%)
            </ThemedText>
          ) : null}
          <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={11} lineHeight={15}>
            Paid Total
          </ThemedText>
          <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={20} lineHeight={25} numberOfLines={1}>
            {formatCurrency(payment.paidTotal)}
          </ThemedText>
        </ThemedView>

        <ThemedView backgroundColor={Palette.borderSubtle} width={1} />

        <ThemedView flex={1} gap={Spacing.one} justifyContent='center' minWidth={0}>
          <ThemedView flexDirection='row' gap={Spacing.one} justifyContent='space-between'>
            <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.regular} fontSize={11} lineHeight={15}>
              Activation
            </ThemedText>
            <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={11} lineHeight={15} numberOfLines={1}>
              {formatCurrency(payment.activation)}
            </ThemedText>
          </ThemedView>
          <ThemedView flexDirection='row' gap={Spacing.one} justifyContent='space-between'>
            <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.regular} fontSize={11} lineHeight={15}>
              Charging
            </ThemedText>
            <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={11} lineHeight={15} numberOfLines={1}>
              {formatCurrency(payment.charging)}
            </ThemedText>
          </ThemedView>
          {payment.discount > 0 ? (
            <ThemedView flexDirection='row' gap={Spacing.one} justifyContent='space-between'>
              <ThemedText color={successAccent} fontFamily={FontFamily.regular} fontSize={11} lineHeight={15}>
                Discount
              </ThemedText>
              <ThemedText color={successAccent} fontFamily={FontFamily.medium} fontSize={11} lineHeight={15} numberOfLines={1}>
                -{formatCurrency(payment.discount)}
              </ThemedText>
            </ThemedView>
          ) : null}
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}
