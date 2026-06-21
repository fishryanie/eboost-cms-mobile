import { mhs } from 'themes/scaling';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { FlatList, Pressable, StyleSheet } from 'react-native';
import { ThemedText, ThemedView } from 'components/base';

import { TabIcon } from 'components/tab-icon';
import { FontFamily, Palette } from 'themes';

import type { CmsMobilePanel, CmsMobileSection } from 'components/animated-tab-bar/constants';

const screenHorizontalPadding = 18;

export function CmsSectionScreen({ section }: { section: CmsMobileSection }) {
  const router = useRouter();

  return (
    <ThemedView safePaddingTop flex={1} backgroundColor={Palette.surfaceBase}>
      <FlatList
        contentContainerStyle={styles.content}
        data={section.panels}
        keyExtractor={panel => panel.key}
        ListHeaderComponent={
          <ThemedView gap={'two'} paddingBottom={'two'}>
            <ThemedView alignItems='center' flexDirection='row' gap={'three'}>
              <ThemedView style={[styles.headerIcon, { backgroundColor: `${section.accentColor}18` }]}>
                <TabIcon color={section.accentColor} name={section.icon} size={24} />
              </ThemedView>
              <ThemedView flex={1} minWidth={0}>
                <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={26} letterSpacing={0} lineHeight={31}>
                  {section.title}
                </ThemedText>
                <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={13} lineHeight={18} marginTop={3}>
                  {section.description}
                </ThemedText>
              </ThemedView>
            </ThemedView>
          </ThemedView>
        }
        renderItem={({ item }) => (
          <PanelCard
            accentColor={section.accentColor}
            panel={item}
            onPress={() =>
              router.push({
                pathname: `/${section.key}/[panel]`,
                params: { panel: item.key } } as never)
            }
          />
        )}
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
  );
}

export function CmsPlaceholderPanelScreen({ accentColor, onBack, panel }: { accentColor: string; onBack: () => void; panel: CmsMobilePanel }) {
  return (
    <ThemedView safePaddingTop flex={1} backgroundColor={Palette.surfaceBase}>
      <FlatList
        contentContainerStyle={styles.content}
        data={[panel]}
        keyExtractor={item => item.key}
        ListHeaderComponent={
          <ThemedView alignItems='center' flexDirection='row' minHeight={38}>
            <Pressable accessibilityLabel='Back' accessibilityRole='button' onPress={onBack} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
              <ChevronLeft color={Palette.textPrimary} size={20} strokeWidth={2.2} />
            </Pressable>
            <ThemedText color={Palette.textPrimary} flex={1} fontFamily={FontFamily.semibold} fontSize={16} lineHeight={21} textAlign='center'>
              {panel.title}
            </ThemedText>
            <ThemedView width={34} />
          </ThemedView>
        }
        renderItem={({ item }) => (
          <ThemedView style={styles.placeholderCard}>
            <ThemedView alignItems='center' flexDirection='row' gap={'three'}>
              <ThemedView style={[styles.panelIcon, { backgroundColor: `${accentColor}18` }]}>
                <TabIcon color={accentColor} name={item.icon} size={24} />
              </ThemedView>
              <ThemedView flex={1} minWidth={0}>
                <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={18} lineHeight={24}>
                  {item.title}
                </ThemedText>
                <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={13} lineHeight={19} marginTop={3}>
                  {item.description}
                </ThemedText>
              </ThemedView>
            </ThemedView>
          </ThemedView>
        )}
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
  );
}

function PanelCard({ accentColor, onPress, panel }: { accentColor: string; onPress: () => void; panel: CmsMobilePanel }) {
  return (
    <Pressable accessibilityRole='button' onPress={onPress} style={({ pressed }) => [styles.panelCard, pressed && styles.pressed]}>
      <ThemedView style={[styles.panelIcon, { backgroundColor: `${accentColor}18` }]}>
        <TabIcon color={accentColor} name={panel.icon} size={22} />
      </ThemedView>
      <ThemedView flex={1} gap={'one'} minWidth={0}>
        <ThemedText numberOfLines={1} color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={15} lineHeight={20}>
          {panel.title}
        </ThemedText>
        <ThemedText numberOfLines={2} color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={12} lineHeight={17}>
          {panel.description}
        </ThemedText>
      </ThemedView>
      <ThemedText color={accentColor} fontFamily={FontFamily.medium} fontSize={24} lineHeight={24}>
        {'>'}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    borderRadius: mhs(16),
    height: 34,
    justifyContent: 'center',
    width: 34 },
  content: {
    gap: mhs(12),
    paddingBottom: 120,
    paddingHorizontal: screenHorizontalPadding,
    paddingTop: mhs(8) },
  headerIcon: {
    alignItems: 'center',
    borderRadius: mhs(21),
    height: 52,
    justifyContent: 'center',
    width: 52 },
  panelCard: {
    alignItems: 'center',
    backgroundColor: Palette.surfaceRaised,
    borderColor: Palette.borderSubtle,
    borderRadius: mhs(21),
    borderWidth: 1,
    flexDirection: 'row',
    gap: mhs(12),
    minHeight: 82,
    padding: mhs(12) },
  panelIcon: {
    alignItems: 'center',
    borderRadius: mhs(16),
    height: 46,
    justifyContent: 'center',
    width: 46 },
  placeholderCard: {
    backgroundColor: Palette.surfaceRaised,
    borderColor: Palette.borderSubtle,
    borderRadius: mhs(21),
    borderWidth: 1,
    gap: mhs(12),
    padding: mhs(16) },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.99 }] } });
