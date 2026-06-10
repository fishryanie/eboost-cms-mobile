import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FontFamily, Palette, Radius, Spacing } from 'constants/theme';
import { getCmsServiceRoute, type CmsServiceGroup, type CmsServiceItem } from 'features/services/service-catalog';

export function ServiceChildrenSheet({ onClose, service }: { onClose: () => void; service: CmsServiceGroup | null }) {
  const ref = useRef<BottomSheetModal>(null);
  const [query, setQuery] = useState('');
  const snapPoints = useMemo(() => ['48%', '82%'], []);
  const { bottom } = useSafeAreaInsets();
  const filteredChildren = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!service || !normalizedQuery) return service?.children ?? [];

    return service.children.filter(child => {
      const searchableText = `${child.name} ${child.description}`.toLowerCase();
      return searchableText.includes(normalizedQuery);
    });
  }, [query, service]);

  useEffect(() => {
    if (service) {
      ref.current?.present();
    } else {
      ref.current?.dismiss();
    }
  }, [service]);

  function openChild(child: CmsServiceItem) {
    ref.current?.dismiss();
    router.push(getCmsServiceRoute(child));
  }

  return (
    <BottomSheetModal
      backdropComponent={props => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />}
      enableDynamicSizing
      keyboardBehavior='fillParent'
      onDismiss={() => {
        setQuery('');
        onClose();
      }}
      ref={ref}
      snapPoints={snapPoints}>
      <BottomSheetScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(bottom + 20, 32) }]}>
        {service ? (
          <>
            <View style={styles.header}>
              <View style={[styles.iconSurface, { backgroundColor: `${service.accentColor}14` }]}>
                <Image contentFit='contain' source={{ uri: service.iconUrl }} style={styles.icon} />
              </View>
              <View style={styles.headerText}>
                <Text numberOfLines={1} style={styles.title}>
                  {service.name}
                </Text>
                <Text style={styles.description}>{service.description}</Text>
              </View>
            </View>

            <BottomSheetTextInput
              autoCapitalize='none'
              autoCorrect={false}
              clearButtonMode='while-editing'
              onChangeText={setQuery}
              placeholder={`Search ${service.name}`}
              placeholderTextColor='#98A2B3'
              returnKeyType='search'
              style={styles.searchInput}
              value={query}
            />

            <View style={styles.serviceList}>
              {filteredChildren.length > 0 ? (
                filteredChildren.map(child => (
                  <Pressable
                    accessibilityRole='button'
                    key={child.slug}
                    onPress={() => openChild(child)}
                    style={({ pressed }) => [styles.childItem, pressed && styles.pressed]}>
                    <View style={[styles.childAccent, { backgroundColor: service.accentColor }]} />
                    <View style={styles.childText}>
                      <Text numberOfLines={1} style={styles.childName}>
                        {child.name}
                      </Text>
                      <Text numberOfLines={2} style={styles.childDescription}>
                        {child.description}
                      </Text>
                    </View>
                    <Text style={[styles.chevron, { color: service.accentColor }]}>{'>'}</Text>
                  </Pressable>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>No services found</Text>
                  <Text style={styles.emptyDescription}>Try another keyword.</Text>
                </View>
              )}
            </View>
          </>
        ) : null}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  chevron: {
    fontFamily: FontFamily.medium,
    fontSize: 28,
    lineHeight: 28,
  },
  childAccent: {
    borderRadius: Radius.pill,
    height: 36,
    opacity: 0.18,
    width: 4,
  },
  childDescription: {
    color: Palette.textSecondary,
    fontFamily: FontFamily.regular,
    fontSize: 12,
    lineHeight: 17,
  },
  childItem: {
    alignItems: 'center',
    backgroundColor: Palette.surfaceMuted,
    borderRadius: Radius.large,
    flexDirection: 'row',
    gap: Spacing.three,
    minHeight: 74,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  childName: {
    color: Palette.textPrimary,
    fontFamily: FontFamily.bold,
    fontSize: 15,
    lineHeight: 20,
  },
  childText: {
    flex: 1,
    gap: Spacing.one,
    minWidth: 0,
  },
  content: {
    gap: Spacing.four,
    padding: Spacing.four,
  },
  description: {
    color: Palette.textSecondary,
    fontFamily: FontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  emptyDescription: {
    color: Palette.textSecondary,
    fontFamily: FontFamily.regular,
    fontSize: 13,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: Palette.surfaceMuted,
    borderRadius: Radius.large,
    gap: Spacing.one,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.five,
  },
  emptyTitle: {
    color: Palette.textPrimary,
    fontFamily: FontFamily.bold,
    fontSize: 15,
    lineHeight: 20,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.four,
  },
  headerText: {
    flex: 1,
    gap: Spacing.one,
    minWidth: 0,
  },
  icon: {
    height: 30,
    width: 30,
  },
  iconSurface: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.99 }],
  },
  searchInput: {
    backgroundColor: Palette.surfaceMuted,
    borderRadius: Radius.large,
    color: Palette.textPrimary,
    fontFamily: FontFamily.semibold,
    fontSize: 15,
    lineHeight: 20,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  serviceList: {
    gap: Spacing.three,
  },
  title: {
    color: Palette.textPrimary,
    fontFamily: FontFamily.bold,
    fontSize: 20,
    lineHeight: 26,
  },
});
