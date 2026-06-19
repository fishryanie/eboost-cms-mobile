import { Battery, Cable, Clock, Copy, MapPin, User, Zap } from 'lucide-react-native';
import type React from 'react';
import type { GestureResponderEvent } from 'react-native';
import { Pressable } from 'react-native';

import { ThemedText, ThemedView } from 'components/base';
import { FlipCard } from 'components/base/flip-card';
import { FontFamily, Palette } from 'themes';
import { formatChargeType, formatCurrency, formatSessionDuration, formatSessionTime, getOngoingSessionPayment } from './ongoing-session-card.helpers';

type OngoingSessionCardProps = {
  item: OngoingSessionRecord;
  onCopy?: (text?: string) => void;
  vehicle?: TechnicalVehicle;
};

const meterAccent = '#0284C7';
const successAccent = '#15803D';

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
      minHeight={30}
      paddingHorizontal={'two'}
      paddingVertical={'one'}>
      {children}
    </ThemedView>
  );
}

function CardSurface({ children }: { children: React.ReactNode }) {
  return (
    <ThemedView
      backgroundColor={Palette.surfaceBase}
      borderColor={Palette.borderSubtle}
      borderRadius={21}
      borderWidth={1}
      boxShadow='0 8px 20px rgba(15, 23, 42, 0.08)'
      gap={'three'}
      padding={'three'}
      width='100%'>
      {children}
    </ThemedView>
  );
}

export function OngoingSessionCard({ item, onCopy, vehicle }: OngoingSessionCardProps) {
  const session = item.charging_session;
  const payment = getOngoingSessionPayment(item);
  const user = session?.user;

  const handleCopy = (event: GestureResponderEvent, text?: string) => {
    event.stopPropagation();
    onCopy?.(text);
  };

  return (
    <FlipCard borderRadius={21} containerStyle={{ width: '100%' }} height='auto' scaleOnPress width='100%'>
      <FlipCard.Front>
        <FlipCard.Trigger>
          <CardSurface>
            <ThemedView flexDirection='row' gap={'two'} justifyContent='space-between'>
              <ThemedView flex={1} minWidth={0}>
                <ThemedView alignItems='center' flexDirection='row' gap={'one'}>
                  <Cable color={meterAccent} size={16} />
                  <ThemedText color={Palette.textPrimary} flexShrink={1} fontFamily={FontFamily.semibold} fontSize={15} lineHeight={20} numberOfLines={1}>
                    {item.boxId || item.vendorId || 'Unknown box'}
                  </ThemedText>
                </ThemedView>
                <ThemedView alignItems='center' flexDirection='row' gap={'one'} marginTop={'one'}>
                  <MapPin color={Palette.textSecondary} size={13} />
                  <ThemedText color={Palette.textSecondary} flexShrink={1} fontFamily={FontFamily.regular} fontSize={12} lineHeight={16} numberOfLines={1}>
                    {item.stationName?.toUpperCase() || 'Unknown station'}
                  </ThemedText>
                </ThemedView>
              </ThemedView>

              <ThemedView alignItems='flex-end' minWidth={66}>
                <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={12} lineHeight={16}>
                  {vehicle === 'bike' ? 'Outlet ' : 'Conn '}
                  {item.connectorId || item.carConnectorId || '-'}
                </ThemedText>
                {vehicle !== 'bike' && (
                  <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={11} lineHeight={15}>
                    {item.power || 0} kW · {item.phase || 0}P
                  </ThemedText>
                )}
              </ThemedView>
            </ThemedView>

            <ThemedView flexDirection='row' flexWrap='wrap' gap={'two'}>
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
              {vehicle !== 'bike' && (
                <>
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
                </>
              )}
            </ThemedView>

            <ThemedView flexDirection='row' flexWrap='wrap' gap={'two'}>
              <ThemedView backgroundColor={Palette.surfaceMuted} borderRadius={'small'} paddingHorizontal={'two'} paddingVertical={'one'}>
                <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={10} lineHeight={13} numberOfLines={1}>
                  {session?.invoice_id || 'No invoice'}
                </ThemedText>
              </ThemedView>
              <ThemedView
                backgroundColor='#FFF5FA'
                borderColor='#F8CDE1'
                borderRadius={'small'}
                borderWidth={1}
                paddingHorizontal={'two'}
                paddingVertical={'one'}>
                <ThemedText color='#D9468A' fontFamily={FontFamily.medium} fontSize={10} lineHeight={13}>
                  {formatChargeType(session?.charge_type)}
                </ThemedText>
              </ThemedView>
              <ThemedView
                alignItems='center'
                backgroundColor='#EEF6FF'
                borderColor='#B9D8FF'
                borderRadius={'small'}
                borderWidth={1}
                flexDirection='row'
                gap={'one'}
                paddingHorizontal={'two'}
                paddingVertical={'one'}>
                <Zap color='#2F80ED' size={10} />
                <ThemedText color='#2F80ED' fontFamily={FontFamily.medium} fontSize={10} lineHeight={13}>
                  {item.status || 'CHARGING'}
                </ThemedText>
              </ThemedView>
            </ThemedView>

            <ThemedView backgroundColor={Palette.borderSubtle} height={1} />

            <ThemedView gap={2}>
              <ThemedView flexDirection='row' gap={'two'}>
                <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.regular} fontSize={11} lineHeight={15} width={50}>
                  Started
                </ThemedText>
                <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.medium} fontSize={11} lineHeight={15} numberOfLines={1}>
                  {formatSessionTime(session?.start_time)}
                </ThemedText>
              </ThemedView>
              <ThemedView flexDirection='row' gap={'two'}>
                <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.regular} fontSize={11} lineHeight={15} width={50}>
                  Updated
                </ThemedText>
                <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.medium} fontSize={11} lineHeight={15} numberOfLines={1}>
                  {formatSessionTime(session?.end_time)}
                </ThemedText>
              </ThemedView>
            </ThemedView>

            <ThemedView backgroundColor={Palette.borderSubtle} height={1} />

            <ThemedView flexDirection='row' gap={'two'}>
              <ThemedView alignItems='center' backgroundColor={Palette.surfaceMuted} borderRadius={18} height={36} justifyContent='center' width={36}>
                <User color={Palette.textSecondary} size={18} />
              </ThemedView>
              <ThemedView flex={1} gap={'one'} minWidth={0}>
                <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={14} lineHeight={18} numberOfLines={1}>
                  {user?.name || 'Unknown user'}
                </ThemedText>
                <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={11} lineHeight={14}>
                  ID: #{user?.id || 'N/A'}
                </ThemedText>
              </ThemedView>
              <ThemedView alignItems='flex-end' flex={1} gap={'one'} minWidth={0}>
                <ThemedView alignItems='center' flexDirection='row' gap={'one'} maxWidth='100%'>
                  <ThemedText color={Palette.textSecondary} flexShrink={1} fontFamily={FontFamily.regular} fontSize={11} lineHeight={15} numberOfLines={1}>
                    {user?.phone || 'N/A'}
                  </ThemedText>
                  {user?.phone ? (
                    <Pressable hitSlop={8} onPress={event => handleCopy(event, user.phone)}>
                      <Copy color={Palette.accent} size={11} />
                    </Pressable>
                  ) : null}
                </ThemedView>
                <ThemedView alignItems='center' flexDirection='row' gap={'one'} maxWidth='100%'>
                  <ThemedText color={Palette.textSecondary} flexShrink={1} fontFamily={FontFamily.regular} fontSize={11} lineHeight={15} numberOfLines={1}>
                    {user?.email || 'N/A'}
                  </ThemedText>
                  {user?.email ? (
                    <Pressable hitSlop={8} onPress={event => handleCopy(event, user.email)}>
                      <Copy color={Palette.accent} size={11} />
                    </Pressable>
                  ) : null}
                </ThemedView>
              </ThemedView>
            </ThemedView>

            <ThemedView backgroundColor={Palette.surfaceMuted} borderRadius={'medium'} flexDirection='row' gap={'two'} padding={'two'}>
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

              <ThemedView flex={1} gap={'one'} justifyContent='center' minWidth={0}>
                <ThemedView flexDirection='row' gap={'one'} justifyContent='space-between'>
                  <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.regular} fontSize={11} lineHeight={15}>
                    Activation
                  </ThemedText>
                  <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={11} lineHeight={15} numberOfLines={1}>
                    {formatCurrency(payment.activation)}
                  </ThemedText>
                </ThemedView>
                <ThemedView flexDirection='row' gap={'one'} justifyContent='space-between'>
                  <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.regular} fontSize={11} lineHeight={15}>
                    Charging
                  </ThemedText>
                  <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={11} lineHeight={15} numberOfLines={1}>
                    {formatCurrency(payment.charging)}
                  </ThemedText>
                </ThemedView>
                {payment.discount > 0 ? (
                  <ThemedView flexDirection='row' gap={'one'} justifyContent='space-between'>
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
          </CardSurface>
        </FlipCard.Trigger>
      </FlipCard.Front>

      <FlipCard.Back>
        <FlipCard.Trigger>
          <ThemedView backgroundColor={Palette.surfaceBase} borderRadius={21} height='100%' width='100%' />
        </FlipCard.Trigger>
      </FlipCard.Back>
    </FlipCard>
  );
}
