import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { ThemedText, ThemedView } from 'components/base';

import { HomeHeader } from 'components/home-header';
import { FontFamily, Palette, Radius, Spacing } from 'themes';
import { BiometricOptInPrompt } from 'features/auth/components/biometric-opt-in-prompt';
import { ServiceChildrenSheet } from 'features/services/components/service-children-sheet';
import { cmsServiceGroups, type CmsServiceGroup } from 'features/services/service-catalog';

const horizontalPadding = 16;
const serviceGridGap = 14;

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const [selectedService, setSelectedService] = useState<CmsServiceGroup | null>(null);
  const columnCount = width < 410 ? 3 : 4;
  const serviceItemWidth = (width - horizontalPadding * 2 - serviceGridGap * (columnCount - 1)) / columnCount;

  return (
    <ThemedView backgroundColor={Palette.surfaceBase} flex={1}>
      <HomeHeader />
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior='automatic' showsVerticalScrollIndicator={false}>
        <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={16} lineHeight={22} marginBottom={Spacing.four}>
          Services
        </ThemedText>
        <ThemedView alignItems='center' columnGap={serviceGridGap} flexDirection='row' flexWrap='wrap' rowGap={Spacing.five}>
          {cmsServiceGroups.map(service => (
            <ServiceShortcut itemWidth={serviceItemWidth} key={service.slug} onPress={() => setSelectedService(service)} service={service} />
          ))}
        </ThemedView>
      </ScrollView>
      <ServiceChildrenSheet onClose={() => setSelectedService(null)} service={selectedService} />
      <BiometricOptInPrompt />
    </ThemedView>
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
