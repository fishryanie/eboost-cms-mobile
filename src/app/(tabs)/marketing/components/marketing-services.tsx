import { ThemedText, ThemedView } from 'components/base';
import { useRouter } from 'expo-router';
import { Bell, CalendarPlus, FileText, Gift, PauseCircle, TicketPercent, Timer, type LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';
import { mhs } from 'themes/scaling';
import { FontFamily, Palette } from 'themes';
import { SectionTitle } from './subscription-stats';
import { useDrawerStore } from 'utils/drawer-store';

const screenHorizontalPadding = 18;

function chunkItems<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

type MarketingServiceItem = {
  icon: LucideIcon;
  labelLines: [string, string];
  label: string;
  route: string;
};

const marketingServices: MarketingServiceItem[] = [
  {
    icon: Bell,
    labelLines: ['Push', 'Notice'],
    label: 'Push Notice',
    route: '/marketing/push-notice',
  },
  {
    icon: CalendarPlus,
    labelLines: ['Schedule', 'Notice'],
    label: 'Schedule Push Notice',
    route: '/marketing/schedule-notice',
  },
  {
    icon: FileText,
    labelLines: ['Notice', 'Drafts'],
    label: 'Notice Drafts',
    route: '/marketing/notice-drafts',
  },
  {
    icon: TicketPercent,
    labelLines: ['Create', 'Promo Code'],
    label: 'Create Promo Codes',
    route: '/marketing/create-promo-code',
  },
  {
    icon: Gift,
    labelLines: ['Bonus', 'Campaign'],
    label: 'Create Bonus Money Campaigns',
    route: '/marketing/create-bonus-campaign',
  },
  {
    icon: Timer,
    labelLines: ['Extend', 'Package'],
    label: 'Extend Promotional Packages',
    route: '/marketing/extend-package',
  },
  {
    icon: PauseCircle,
    labelLines: ['Suspend', 'Package'],
    label: 'Suspend Promotional Packages',
    route: '/marketing/suspend-package',
  },
];

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    borderRadius: mhs(16),
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  content: {
    gap: mhs(12),
    paddingBottom: 120,
    paddingTop: mhs(8),
  },
  dividedSection: {
    borderTopColor: Palette.borderSubtle,
    borderTopWidth: 1,
    paddingTop: mhs(16),
  },
  energyValue: {
    flexBasis: '47%',
    flexGrow: 1,
    gap: 2,
  },
  headerIcon: {
    alignItems: 'center',
    borderRadius: mhs(21),
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  metricOption: {
    alignItems: 'center',
    borderRadius: mhs(16),
    flex: 1,
    justifyContent: 'center',
    minHeight: 34,
  },
  metricOptionActive: {
    backgroundColor: Palette.surfaceRaised,
    borderColor: Palette.borderSubtle,
    borderWidth: 1,
  },
  metricSwitch: {
    backgroundColor: Palette.surfaceMuted,
    borderRadius: mhs(21),
    gap: mhs(4),
    padding: 4,
  },
  packageDot: {
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  packageRow: {
    backgroundColor: Palette.surfaceMuted,
    borderRadius: mhs(16),
    padding: mhs(12),
  },
  packageListContent: {
    gap: mhs(8),
    paddingBottom: 120,
    paddingHorizontal: screenHorizontalPadding,
    paddingTop: mhs(12),
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.99 }],
  },
  progressFill: {
    borderRadius: 5,
    height: 10,
  },
  progressTrack: {
    backgroundColor: '#EEF2F7',
    borderRadius: 5,
    height: 10,
    overflow: 'hidden',
  },
  refreshButton: {
    alignItems: 'center',
    borderColor: Palette.borderSubtle,
    borderRadius: mhs(16),
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  safeArea: {
    backgroundColor: Palette.surfaceBase,
    flex: 1,
  },
  serviceIconSurface: {
    alignItems: 'center',
    backgroundColor: Palette.antiFlashWhite,
    borderRadius: mhs(16),
    height: mhs(56),
    width: mhs(56),
    justifyContent: 'center',
  },
  serviceRow: {
    width: '100%',
  },
  serviceShortcut: {
    alignItems: 'center',
    gap: mhs(6),
    minHeight: 88,
    justifyContent: 'flex-start',
    paddingHorizontal: mhs(4),
  },
  summaryStat: {
    backgroundColor: Palette.surfaceMuted,
    borderRadius: mhs(16),
    padding: mhs(12),
  },
  textButton: {
    paddingHorizontal: mhs(4),
    paddingVertical: mhs(8),
  },
});

export function MarketingServicesSection({ tileWidth }: { tileWidth: number }) {
  const router = useRouter();
  const rows = chunkItems(marketingServices, 4);
  const openService = (route: string) => {
    useDrawerStore.getState().closeDrawer();
    router.push(route as never);
  };

  return (
    <ThemedView gap={'three'}>
      <SectionTitle subtitle='Fast access for common campaign operations.' title='Services' />
      <ThemedView gap={'three'}>
        {rows.map((row, rowIndex) => (
          <ThemedView flexDirection='row' justifyContent='space-between' key={`marketing-service-row-${rowIndex}`} style={styles.serviceRow}>
            {row.map(service => (
              <MarketingServiceTile key={service.route} service={service} tileWidth={tileWidth} onPress={() => openService(service.route)} />
            ))}
            {row.length < 4
              ? Array.from({ length: 4 - row.length }).map((_, index) => <ThemedView key={`marketing-service-spacer-${rowIndex}-${index}`} width={tileWidth} />)
              : null}
          </ThemedView>
        ))}
      </ThemedView>
    </ThemedView>
  );
}

export function MarketingServiceTile({ onPress, service, tileWidth }: { onPress: () => void; service: MarketingServiceItem; tileWidth: number }) {
  const Icon = service.icon;

  return (
    <Pressable
      accessibilityLabel={service.label}
      accessibilityRole='button'
      onPress={onPress}
      style={({ pressed }) => [styles.serviceShortcut, { width: tileWidth }, pressed && styles.pressed]}>
      <ThemedView style={styles.serviceIconSurface}>
        <Icon color={Palette.textPrimary} size={22} />
      </ThemedView>
      <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.medium} fontSize={10} lineHeight={13} numberOfLines={2} textAlign='center'>
        {service.labelLines.filter(Boolean).join('\n')}
      </ThemedText>
    </Pressable>
  );
}
