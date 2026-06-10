import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { HomeHeader } from 'components/home-header';
import { FontFamily, Palette, Radius, Spacing } from 'constants/theme';
import { ServiceChildrenSheet } from 'features/services/components/service-children-sheet';
import { cmsServiceGroups, type CmsServiceGroup } from 'features/services/service-catalog';

const horizontalPadding = 16;
const columnCount = 4;
const serviceGridGap = 16;

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const [selectedService, setSelectedService] = useState<CmsServiceGroup | null>(null);
  const serviceItemWidth = (width - horizontalPadding * 2 - serviceGridGap * (columnCount - 1)) / columnCount;

  return (
    <View style={styles.container}>
      <HomeHeader />
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior='automatic' showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Services</Text>
        <View style={styles.serviceGrid}>
          {cmsServiceGroups.map(service => (
            <ServiceShortcut itemWidth={serviceItemWidth} key={service.slug} onPress={() => setSelectedService(service)} service={service} />
          ))}
        </View>
      </ScrollView>
      <ServiceChildrenSheet onClose={() => setSelectedService(null)} service={selectedService} />
    </View>
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

      <Text numberOfLines={2} style={styles.serviceLabel}>
        {service.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Palette.surfaceBase,
    flex: 1,
  },
  content: {
    paddingBottom: 120,
    paddingHorizontal: horizontalPadding,
    paddingTop: Spacing.two,
  },
  sectionTitle: {
    color: Palette.textPrimary,
    fontFamily: FontFamily.bold,
    fontSize: 16,
    lineHeight: 22,
    marginBottom: Spacing.four,
  },
  serviceGrid: {
    alignItems: 'center',
    columnGap: serviceGridGap,
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: Spacing.five,
  },
  serviceIcon: {
    height: 30,
    width: 30,
  },
  serviceLabel: {
    color: Palette.textPrimary,
    fontFamily: FontFamily.medium,
    fontSize: 13,
    includeFontPadding: false,
    lineHeight: 16,
    textAlign: 'center',
    width: '100%',
  },
  serviceShortcut: {
    alignItems: 'center',
    backgroundColor: Palette.surfaceMuted,
    borderCurve: 'continuous',
    borderRadius: Radius.large,
    justifyContent: 'space-between',
    paddingBottom: Spacing.four,
    paddingHorizontal: Spacing.two,
    paddingTop: Spacing.five,
  },
  serviceShortcutPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.96 }],
  },
});
