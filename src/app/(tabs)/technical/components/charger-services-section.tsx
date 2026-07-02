import { Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import {
  BadgeDollarSign,
  BadgeInfo,
  Cable,
  CircleMinus,
  CirclePlus,
  Gauge,
  LockOpen,
  MapPin,
  PencilLine,
  QrCode,
  RotateCcw,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react-native';

import { quickServiceGroups, type QuickServiceIconName, type QuickServiceItem } from 'app/(tabs)/technical/features/quick-service-catalog';
import { ThemedText, ThemedView } from 'components/base';
import { FontFamily, Palette } from 'themes';

import { SectionTitle, chunkItems } from 'components/technical/list-ui';
import { styles } from 'components/technical/styles';

const quickServiceIcons: Record<QuickServiceIconName, LucideIcon> = {
  badgeDollarSign: BadgeDollarSign,
  badgeInfo: BadgeInfo,
  cable: Cable,
  circleMinus: CircleMinus,
  circlePlus: CirclePlus,
  gauge: Gauge,
  lockOpen: LockOpen,
  mapPin: MapPin,
  pencilLine: PencilLine,
  qrCode: QrCode,
  rotateCcw: RotateCcw,
  wrench: Wrench,
  zap: Zap,
};

export function QuickServiceShortcut({ onPress, service, tileWidth }: { onPress?: () => void; service: QuickServiceItem; tileWidth: number }) {
  const Icon = quickServiceIcons[service.icon];

  return (
    <Pressable
      accessibilityLabel={service.name}
      accessibilityRole='button'
      onPress={onPress}
      style={({ pressed }) => [styles.serviceShortcut, { width: tileWidth }, pressed && styles.pressed]}>
      <ThemedView style={styles.serviceIconSurface}>
        <Icon color={Palette.textPrimary} size={24} />
      </ThemedView>
      <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.medium} fontSize={10} lineHeight={13} numberOfLines={2} textAlign='center'>
        {service.labelLines.filter(Boolean).join(' ')}
      </ThemedText>
    </Pressable>
  );
}

export function ChargerServicesSection({
  onBoxAction,
  onReplaceMeter,
  onSetupLocation,
  tileWidth,
}: {
  onBoxAction: (mode: 'reset' | 'trigger' | 'unlock') => void;
  onReplaceMeter: () => void;
  onSetupLocation: () => void;
  tileWidth: number;
}) {
  const router = useRouter();
  const services = quickServiceGroups[0]?.services || [];
  const rows = chunkItems(services, 4);

  return (
    <ThemedView gap={'three'}>
      <SectionTitle subtitle='Same charger service shortcuts used on Home.' title='Charger Services' />
      <ThemedView gap={'three'}>
        {rows.map((row, rowIndex) => (
          <ThemedView flexDirection='row' justifyContent='space-between' key={`service-row-${rowIndex}`} style={styles.serviceRow}>
            {row.map(service => (
              <QuickServiceShortcut
                key={service.slug}
                tileWidth={tileWidth}
                onPress={
                  service.slug === 'trigger-charger'
                    ? () => onBoxAction('trigger')
                    : service.slug === 'reset'
                      ? () => onBoxAction('reset')
                      : service.slug === 'unlock-charger'
                        ? () => onBoxAction('unlock')
                        : service.slug === 'replace-meter'
                          ? onReplaceMeter
                          : service.slug === 'setup-location'
                            ? onSetupLocation
                            : service.slug === 'uninstall-charger'
                              ? () => router.push('/technical/uninstall-charger')
                              : service.slug === 'replace-charger'
                                ? () => router.push('/technical/replace-charger')
                                : service.slug === 'add-charger'
                                  ? () => router.push('/technical/add-charger')
                                  : undefined
                }
                service={service}
              />
            ))}
            {row.length < 4
              ? Array.from({ length: 4 - row.length }).map((_, index) => <ThemedView key={`service-spacer-${rowIndex}-${index}`} width={tileWidth} />)
              : null}
          </ThemedView>
        ))}
      </ThemedView>
    </ThemedView>
  );
}
