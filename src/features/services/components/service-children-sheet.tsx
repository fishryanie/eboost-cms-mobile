import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { router } from 'expo-router';
import { Activity, ChartColumn, Handshake, Megaphone, Settings, ShieldUser, Wrench, type LucideIcon } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText, ThemedView } from 'components/base';

import { FontFamily, Palette, Radius, Spacing } from 'themes';
import { getCmsServiceRoute, type CmsServiceGroup, type CmsServiceIconName, type CmsServiceItem } from 'features/services/service-catalog';

const activeBottomButtonColor = 'rgba(0,0,0,0.06)';
const cmsServiceIcons: Record<CmsServiceIconName, LucideIcon> = {
  activity: Activity,
  chartColumn: ChartColumn,
  handshake: Handshake,
  megaphone: Megaphone,
  settings: Settings,
  shieldUser: ShieldUser,
  wrench: Wrench,
};

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
            <ThemedView alignItems='center' flexDirection='row' gap={Spacing.four}>
              <ServiceHeaderIcon service={service} />
              <ThemedView flex={1} gap={Spacing.one} minWidth={0}>
                <ThemedText numberOfLines={1} color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={20} lineHeight={26}>
                  {service.name}
                </ThemedText>
                <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={13} lineHeight={18}>
                  {service.description}
                </ThemedText>
              </ThemedView>
            </ThemedView>

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

            <ThemedView gap={Spacing.three}>
              {filteredChildren.length > 0 ? (
                filteredChildren.map(child => (
                  <Pressable
                    accessibilityRole='button'
                    key={child.slug}
                    onPress={() => openChild(child)}
                    style={({ pressed }) => [styles.childItem, pressed && styles.pressed]}>
                    <ThemedView style={[styles.childAccent, { backgroundColor: service.accentColor }]} />
                    <ThemedView flex={1} gap={Spacing.one} minWidth={0}>
                      <ThemedText numberOfLines={1} color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={15} lineHeight={20}>
                        {child.name}
                      </ThemedText>
                      <ThemedText numberOfLines={2} color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={12} lineHeight={17}>
                        {child.description}
                      </ThemedText>
                    </ThemedView>
                    <ThemedText style={[styles.chevron, { color: service.accentColor }]}>{'>'}</ThemedText>
                  </Pressable>
                ))
              ) : (
                <ThemedView
                  alignItems='center'
                  backgroundColor={Palette.surfaceMuted}
                  borderRadius={Radius.large}
                  gap={Spacing.one}
                  paddingHorizontal={Spacing.four}
                  paddingVertical={Spacing.five}>
                  <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={15} lineHeight={20}>
                    No services found
                  </ThemedText>
                  <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={13}>
                    Try another keyword.
                  </ThemedText>
                </ThemedView>
              )}
            </ThemedView>
          </>
        ) : null}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

function ServiceHeaderIcon({ service }: { service: CmsServiceGroup }) {
  const Icon = cmsServiceIcons[service.icon];

  return (
    <ThemedView style={styles.iconSurface}>
      <Icon color={Palette.textTertiary} size={24} strokeWidth={1.9} />
    </ThemedView>
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
  content: {
    gap: Spacing.four,
    padding: Spacing.four,
  },
  iconSurface: {
    alignItems: 'center',
    backgroundColor: activeBottomButtonColor,
    borderRadius: Radius.small,
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
});
