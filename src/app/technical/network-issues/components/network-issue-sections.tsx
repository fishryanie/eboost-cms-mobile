import { useRouter } from 'expo-router';
import { Pressable } from 'react-native';

import { ThemedText, ThemedView } from 'components/base';
import { FontFamily, Palette } from 'themes';

import { formatRelativeTime } from 'components/technical/common';
import { styles } from 'components/technical/styles';

type NetworkIssue = ConnectionLogRecord & {
  vehicle: TechnicalVehicle;
};

export function NetworkIssueCard({ item, isLast }: { item: NetworkIssue; isLast?: boolean }) {
  const router = useRouter();

  const timestamp = item.timestamp;
  const date = timestamp ? new Date(timestamp) : new Date();
  const dayStr = !Number.isNaN(date.getTime()) ? date.getDate().toString() : '--';
  const monthStr = !Number.isNaN(date.getTime()) ? (date.getMonth() + 1).toString() : '';
  const timeStr = !Number.isNaN(date.getTime()) ? date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '--:--';

  const color = item.vehicle === 'bike' ? Palette.accent : '#3867D6';

  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: '/technical/status-logs', params: { id: item.chargePointID, vehicle: item.vehicle, station: item.stationName } } as never)
      }
      style={({ pressed }) => [{ flexDirection: 'row', width: '100%' }, pressed && styles.pressed]}>
      {/* Left Column: Date & Day */}
      <ThemedView alignItems='center' marginRight={'three'} width={56}>
        <ThemedText color={Palette.accent} fontFamily={FontFamily.bold} fontSize={16}>
          {dayStr}
          {monthStr ? (
            <ThemedText color={Palette.accent} fontFamily={FontFamily.bold} fontSize={11}>
              /{monthStr}
            </ThemedText>
          ) : null}
        </ThemedText>
        <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.regular} fontSize={10} marginTop={'one'}>
          {timeStr}
        </ThemedText>
        <ThemedView backgroundColor={Palette.antiFlashWhite} borderRadius={20} marginTop={'one'} paddingHorizontal={4} paddingVertical={2}>
          <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={9} textAlign='center'>
            {formatRelativeTime(item.timestamp)}
          </ThemedText>
        </ThemedView>
      </ThemedView>

      {/* Middle Column: Dot & Line */}
      <ThemedView alignItems='center' marginRight={'three'} width={24}>
        <ThemedView
          backgroundColor={color}
          borderColor={Palette.surfaceBase}
          borderRadius={7}
          borderWidth={2}
          height={14}
          marginTop={'one'}
          width={14}
          zIndex={1}
        />
        {!isLast && <ThemedView backgroundColor={Palette.borderSubtle} bottom={-20} position='absolute' top={14} width={1} />}
      </ThemedView>

      {/* Right Column: Content */}
      <ThemedView flex={1} paddingBottom={'five'}>
        <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={15}>
          {item.chargePointID || '-'}
        </ThemedText>

        <ThemedView marginTop={'one'}>
          <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={12}>
            {item.stationName || `${item.vehicle === 'bike' ? 'Bike' : 'Car'} charger`}
          </ThemedText>
        </ThemedView>
      </ThemedView>
    </Pressable>
  );
}
