import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { ThemedText, ThemedView } from 'components/base';

import { HomeHeader } from 'components/home-header';
import { FontFamily, Palette, Radius, Spacing } from 'themes';
import { BiometricOptInPrompt } from 'features/auth/components/biometric-opt-in-prompt';
import { ServiceChildrenSheet } from 'features/services/components/service-children-sheet';
import { cmsServiceGroups, type CmsServiceGroup } from 'features/services/service-catalog';
import { quickServiceGroups, type QuickServiceGroup, type QuickServiceItem } from 'features/services/quick-service-catalog';
import { TriggerBoxSheet } from 'features/services/trigger-box';

const horizontalPadding = 16;
const serviceGridGap = 14;

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const [selectedService, setSelectedService] = useState<CmsServiceGroup | null>(null);
  const [triggerBoxOpen, setTriggerBoxOpen] = useState(false);
  const columnCount = width < 410 ? 3 : 4;
  const serviceItemWidth = (width - horizontalPadding * 2 - serviceGridGap * (columnCount - 1)) / columnCount;

  return (
    <ThemedView backgroundColor={Palette.surfaceBase} flex={1}>
      <HomeHeader />
      <FlatList
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior='automatic'
        data={quickServiceGroups}
        keyExtractor={group => group.slug}
        ListFooterComponent={<CmsServiceGrid itemWidth={serviceItemWidth} onSelectService={setSelectedService} />}
        renderItem={({ item }) => <QuickServiceGroupStrip group={item} onTriggerBox={() => setTriggerBoxOpen(true)} />}
        showsVerticalScrollIndicator={false}
      />
      <ServiceChildrenSheet onClose={() => setSelectedService(null)} service={selectedService} />
      {triggerBoxOpen ? <TriggerBoxSheet onClose={() => setTriggerBoxOpen(false)} visible={triggerBoxOpen} /> : null}
      <BiometricOptInPrompt />
    </ThemedView>
  );
}

function QuickServiceGroupStrip({ group, onTriggerBox }: { group: QuickServiceGroup; onTriggerBox: () => void }) {
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
            onPress={item.slug === 'trigger-charger' ? onTriggerBox : undefined}
            service={item}
          />
        )}
        showsHorizontalScrollIndicator={false}
      />
    </ThemedView>
  );
}

function CmsServiceGrid({ itemWidth, onSelectService }: { itemWidth: number; onSelectService: (service: CmsServiceGroup) => void }) {
  return (
    <>
      <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={16} lineHeight={22} marginBottom={Spacing.four}>
        Services
      </ThemedText>
      <ThemedView alignItems='center' columnGap={serviceGridGap} flexDirection='row' flexWrap='wrap' rowGap={Spacing.five}>
        {cmsServiceGroups.map(service => (
          <ServiceShortcut itemWidth={itemWidth} key={service.slug} onPress={() => onSelectService(service)} service={service} />
        ))}
      </ThemedView>
    </>
  );
}

function QuickServiceShortcut({ isLast, onPress, service }: { isLast: boolean; onPress?: () => void; service: QuickServiceItem }) {
  return (
    <Pressable
      accessibilityLabel={service.name}
      accessibilityRole='button'
      onPress={onPress}
      style={({ pressed }) => [styles.quickServiceShortcut, !isLast && styles.quickServiceShortcutGap, pressed && styles.quickServiceShortcutPressed]}>
      <ThemedView style={styles.quickServiceIconSurface}>
        <SymbolView name={service.icon as never} resizeMode='scaleAspectFit' size={24} tintColor={Palette.accent} />
      </ThemedView>
      <ThemedView style={styles.quickServiceLabelBox}>
        <QuickServiceLabelLine line={service.labelLines[0]} />
        <QuickServiceLabelLine line={service.labelLines[1]} />
      </ThemedView>
    </Pressable>
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

function ServiceShortcut({ itemWidth, onPress, service }: { itemWidth: number; onPress: () => void; service: CmsServiceGroup }) {
  return (
    <Pressable
      accessibilityLabel={`Open ${service.name} services`}
      accessibilityRole='button'
      onPress={onPress}
      style={({ pressed }) => [styles.serviceShortcut, { height: itemWidth * 1.06, width: itemWidth }, pressed && styles.serviceShortcutPressed]}>
      <Image contentFit='contain' source={{ uri: service.iconUrl }} style={styles.serviceIcon} />

      <ThemedText
        numberOfLines={2}
        color={Palette.textPrimary}
        fontFamily={FontFamily.regular}
        fontSize={13}
        includeFontPadding={false}
        lineHeight={15}
        textAlign='center'
        width='100%'>
        {service.name}
      </ThemedText>
    </Pressable>
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
    backgroundColor: '#E8F4EF',
    borderRadius: Radius.pill,
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
    width: 72,
  },
  quickServiceShortcutGap: {
    marginRight: Spacing.three,
  },
  quickServiceShortcutPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
  serviceIcon: {
    height: 28,
    width: 28,
  },
  serviceShortcut: {
    alignItems: 'center',
    backgroundColor: Palette.surfaceMuted,
    borderCurve: 'continuous',
    borderRadius: Radius.large,
    justifyContent: 'center',
    paddingBottom: Spacing.three,
    paddingHorizontal: Spacing.two,
    paddingTop: Spacing.four,
    gap: Spacing.three,
  },
  serviceShortcutPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.96 }],
  },
});
