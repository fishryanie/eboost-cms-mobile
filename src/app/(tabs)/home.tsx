import {
  BadgeDollarSign,
  BadgeInfo,
  Cable,
  CircleMinus,
  CirclePlus,
  Gauge,
  LockOpen,
  PencilLine,
  QrCode,
  RotateCcw,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet } from 'react-native';
import { ThemedText, ThemedView } from 'components/base';

import { HomeHeader } from 'components/home-header';
import { FontFamily, Palette, Radius, Spacing } from 'themes';
import { BiometricOptInPrompt } from 'features/auth/components/biometric-opt-in-prompt';
import { quickServiceGroups, type QuickServiceGroup, type QuickServiceIconName, type QuickServiceItem } from 'features/services/quick-service-catalog';
import { ReplaceMeterSheet } from 'features/services/replace-meter';
import { TriggerBoxSheet } from 'features/services/trigger-box';

const horizontalPadding = 16;
const activeBottomButtonColor = 'rgba(0,0,0,0.06)';
const quickServiceIcons: Record<QuickServiceIconName, LucideIcon> = {
  badgeDollarSign: BadgeDollarSign,
  badgeInfo: BadgeInfo,
  cable: Cable,
  circleMinus: CircleMinus,
  circlePlus: CirclePlus,
  gauge: Gauge,
  lockOpen: LockOpen,
  pencilLine: PencilLine,
  qrCode: QrCode,
  rotateCcw: RotateCcw,
  wrench: Wrench,
  zap: Zap,
};

export default function HomeScreen() {
  const [boxActionMode, setBoxActionMode] = useState<'reset' | 'trigger' | 'unlock' | null>(null);
  const [replaceMeterVisible, setReplaceMeterVisible] = useState(false);

  return (
    <ThemedView backgroundColor={Palette.surfaceBase} flex={1}>
      <HomeHeader />
      <FlatList
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior='automatic'
        data={quickServiceGroups}
        keyExtractor={group => group.slug}
        renderItem={({ item }) => (
          <QuickServiceGroupStrip group={item} onBoxAction={setBoxActionMode} onReplaceMeter={() => setReplaceMeterVisible(true)} />
        )}
        showsVerticalScrollIndicator={false}
      />
      {boxActionMode ? <TriggerBoxSheet mode={boxActionMode} onClose={() => setBoxActionMode(null)} visible={Boolean(boxActionMode)} /> : null}
      {replaceMeterVisible ? <ReplaceMeterSheet onClose={() => setReplaceMeterVisible(false)} visible={replaceMeterVisible} /> : null}
      <BiometricOptInPrompt />
    </ThemedView>
  );
}

function QuickServiceGroupStrip({
  group,
  onBoxAction,
  onReplaceMeter,
}: {
  group: QuickServiceGroup;
  onBoxAction: (mode: 'reset' | 'trigger' | 'unlock') => void;
  onReplaceMeter: () => void;
}) {
  return (
    <ThemedView gap={Spacing.three} marginBottom={Spacing.five}>
      <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={16} lineHeight={22}>
        {group.name}
      </ThemedText>

      <FlatList
        horizontal
        contentContainerStyle={styles.quickServiceList}
        data={group.services}
        keyExtractor={service => service.slug}
        renderItem={({ index, item }) => (
          <QuickServiceShortcut
            isLast={index === group.services.length - 1}
            onPress={
              item.slug === 'trigger-charger'
                ? () => onBoxAction('trigger')
                : item.slug === 'reset'
                  ? () => onBoxAction('reset')
                  : item.slug === 'unlock-charger'
                    ? () => onBoxAction('unlock')
                    : item.slug === 'replace-meter'
                      ? onReplaceMeter
                      : undefined
            }
            service={item}
          />
        )}
        showsHorizontalScrollIndicator={false}
      />
    </ThemedView>
  );
}

function QuickServiceShortcut({ isLast, onPress, service }: { isLast: boolean; onPress?: () => void; service: QuickServiceItem }) {
  return (
    <Pressable
      accessibilityLabel={service.name}
      accessibilityRole='button'
      onPress={onPress}
      style={({ pressed }) => [styles.quickServiceShortcut, !isLast && styles.quickServiceShortcutGap, pressed && styles.quickServiceShortcutPressed]}>
      <QuickServiceIcon service={service} />
      <ThemedView style={styles.quickServiceLabelBox}>
        <QuickServiceLabelLine line={service.labelLines[0]} />
        <QuickServiceLabelLine line={service.labelLines[1]} />
      </ThemedView>
    </Pressable>
  );
}

function QuickServiceIcon({ service }: { service: QuickServiceItem }) {
  const Icon = quickServiceIcons[service.icon];

  return (
    <ThemedView style={styles.quickServiceIconSurface}>
      <Icon color={Palette.textTertiary} size={24} strokeWidth={1.9} />
    </ThemedView>
  );
}

function QuickServiceLabelLine({ line }: { line: string }) {
  return (
    <ThemedText
      color={Palette.textPrimary}
      fontFamily={FontFamily.semibold}
      fontSize={10}
      height={13}
      includeFontPadding={false}
      lineHeight={13}
      maxFontSizeMultiplier={1.1}
      textAlign='center'
      width='100%'>
      {line || ' '}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 120,
    paddingHorizontal: horizontalPadding,
    paddingTop: Spacing.two,
  },
  quickServiceIconSurface: {
    alignItems: 'center',
    backgroundColor: activeBottomButtonColor,
    borderRadius: Radius.small,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  quickServiceList: {
    paddingRight: Spacing.two,
  },
  quickServiceLabelBox: {
    height: 26,
    justifyContent: 'center',
    width: '100%',
  },
  quickServiceShortcut: {
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 88,
    width: 64,
  },
  quickServiceShortcutGap: {
    marginRight: Spacing.one,
  },
  quickServiceShortcutPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
});
