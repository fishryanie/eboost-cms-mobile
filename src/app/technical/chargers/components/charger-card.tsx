import { Bike, Car, CircleAlert, CircleCheck, EyeOff, MapPin } from 'lucide-react-native';

import { ThemedText, ThemedView } from 'components/base';
import { FontFamily, Palette } from 'themes';

type ChargerTone = 'danger' | 'success' | 'warning';

const CHARGER_TONES: Record<ChargerTone, { accent: string; badge: string; card: string; icon: string }> = {
  danger: { accent: Palette.danger, badge: '#FEE4E2', card: '#FFF7F6', icon: '#FFE9E7' },
  success: { accent: Palette.accentPressed, badge: '#DFF3E8', card: Palette.surfaceMuted, icon: '#E8F6EE' },
  warning: { accent: '#B54708', badge: '#FEF0C7', card: '#FFFAEB', icon: '#FFF3D6' },
};

export function ChargerCard({ item, vehicle }: { item: ChargerRecord; vehicle: TechnicalVehicle }) {
  const station = typeof item.station === 'string' ? item.station : item.station?.name || item.stationName || '-';
  const identifier = item.vendorId || item.uniqueId || `#${item.id || '-'}`;
  const label = item.enabled === false ? 'Disabled' : item.visible === false ? 'Hidden' : 'Active';
  const tone: ChargerTone = item.enabled === false ? 'danger' : item.visible === false ? 'warning' : 'success';
  const presentation = CHARGER_TONES[tone];
  const ChargerIcon = vehicle === 'car' ? Car : Bike;
  const StatusIcon = tone === 'danger' ? CircleAlert : tone === 'warning' ? EyeOff : CircleCheck;

  return (
    <ThemedView
      backgroundColor={presentation.card}
      borderColor={tone === 'success' ? Palette.borderSubtle : presentation.badge}
      borderRadius={'small'}
      borderWidth={1}
      overflow='hidden'>
      <ThemedView alignItems='center' flexDirection='row' gap={'two'} paddingHorizontal={'three'} paddingVertical={'two'}>
        <ThemedView alignItems='center' backgroundColor={presentation.icon} borderRadius={9} flexShrink={0} height={34} justifyContent='center' width={34}>
          <ChargerIcon color={presentation.accent} size={17} strokeWidth={2.2} />
        </ThemedView>

        <ThemedView flex={1} gap={1} minWidth={0}>
          <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={14} lineHeight={19} numberOfLines={1} selectable>
            {identifier}
          </ThemedText>
          <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={11} lineHeight={16} numberOfLines={1} selectable>
            {item.name || item.uniqueId || 'Unnamed charger'}
          </ThemedText>
        </ThemedView>

        <ThemedView
          alignItems='center'
          backgroundColor={presentation.badge}
          borderRadius={'pill'}
          flexDirection='row'
          flexShrink={0}
          gap={3}
          paddingHorizontal={7}
          paddingVertical={3}>
          <StatusIcon color={presentation.accent} size={11} strokeWidth={2.2} />
          <ThemedText color={presentation.accent} fontFamily={FontFamily.semibold} fontSize={11} lineHeight={15} selectable>
            {label}
          </ThemedText>
        </ThemedView>
      </ThemedView>

      <ThemedView
        alignItems='center'
        borderColor={tone === 'success' ? Palette.borderSubtle : presentation.badge}
        borderTopWidth={1}
        flexDirection='row'
        gap={6}
        paddingHorizontal={'three'}
        paddingVertical={7}>
        <MapPin color={Palette.textTertiary} size={14} strokeWidth={2.1} />
        <ThemedText color={Palette.textSecondary} flex={1} fontFamily={FontFamily.medium} fontSize={12} lineHeight={17} numberOfLines={1} selectable>
          {station === '-' ? 'No station assigned' : station}
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}
