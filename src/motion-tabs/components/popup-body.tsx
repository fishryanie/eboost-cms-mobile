import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { memo, type ComponentProps, type FC, type FunctionComponent, type JSX, type ReactElement, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { TabIcon, type TabIconName } from '../../components/tab-icon';
import type { IPalette, IPopupRenderContext } from '../typings/motion-tabs';

type LinkedAction = {
  icon: TabIconName;
  key: string;
  label: string;
  trailing?: string;
};

const nowPlaying = {
  artist: 'Walter Isaacson',
  artwork: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1327861368i/11084145.jpg',
  backgroundColor: '#E7E7E7',
  progress: 0.46,
  title: 'Steve Jobs',
  timeLeft: '14m',
};

const homeActions: LinkedAction[] = [
  { icon: 'library', key: 'library', label: 'Library' },
  { icon: 'downloads', key: 'downloads', label: 'Downloads', trailing: '3' },
  { icon: 'bookmarks', key: 'bookmarks', label: 'Bookmarks' },
  { icon: 'sleep', key: 'sleep', label: 'Sleep timer', trailing: 'Off' },
];

const categories: LinkedAction[] = [
  { icon: 'library', key: 'fiction', label: 'Fiction' },
  { icon: 'bookmarks', key: 'self-help', label: 'Self-help' },
  { icon: 'trending', key: 'business', label: 'Business' },
  { icon: 'note', key: 'history', label: 'History' },
];

const recentItems: LinkedAction[] = [
  { icon: 'play', key: 'steve-jobs', label: 'Steve Jobs', trailing: 'Walter Isaacson' },
  { icon: 'play', key: 'atomic-habits', label: 'Atomic Habits', trailing: 'James Clear' },
  { icon: 'play', key: 'deep-work', label: 'Deep Work', trailing: 'Cal Newport' },
];

const userActions: LinkedAction[] = [
  { icon: 'balance', key: 'adjust-balance', label: 'Adjust Balance' },
  { icon: 'transfer', key: 'transfer-funds', label: 'Transfer Funds' },
  { icon: 'email', key: 'change-email', label: 'Change Email' },
  { icon: 'password', key: 'reset-password', label: 'Reset Password' },
  { icon: 'tier', key: 'change-tier', label: 'Change Tier' },
];

const locationActions: LinkedAction[] = [
  { icon: 'location', key: 'create-location', label: 'Create location' },
  { icon: 'map', key: 'pick-lat-lng', label: 'Pick lat lng' },
];

function useOpenMenuScreen() {
  const router = useRouter();

  return (key: string) => {
    router.push({
      pathname: '/menu/[slug]',
      params: { slug: key },
    } as never);
  };
}

const HomePopupBody: FC<IPopupRenderContext> & FunctionComponent<IPopupRenderContext> = memo<IPopupRenderContext & ComponentProps<typeof HomePopupBody>>(
  ({ colors }: IPopupRenderContext & ComponentProps<typeof HomePopupBody>): (ReactNode & ReactElement & JSX.Element) | null => {
    const openMenuScreen = useOpenMenuScreen();

    return (
      <View style={styles.homeContainer}>
        <Pressable
          onPress={() => openMenuScreen('steve-jobs')}
          style={({ pressed }) => [styles.listenCard, { backgroundColor: nowPlaying.backgroundColor, opacity: pressed ? 0.78 : 1 }]}>
          <Image source={{ uri: nowPlaying.artwork }} style={styles.artwork} />
          <View style={styles.cardMeta}>
            <Text style={styles.eyebrow}>Continue Listening</Text>
            <Text numberOfLines={1} style={styles.cardTitle}>
              {nowPlaying.title}
            </Text>
            <Text numberOfLines={1} style={styles.cardAuthor}>
              {nowPlaying.artist}
            </Text>
            <View style={styles.progressRow}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${nowPlaying.progress * 100}%` }]} />
              </View>
              <Text style={styles.timeLeft}>{nowPlaying.timeLeft}</Text>
            </View>
          </View>
          <View style={styles.playButton}>
            <TabIcon color='#FFFFFF' name='play' size={17} />
          </View>
        </Pressable>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.actions}>
          {homeActions.map(action => (
            <ActionRow action={action} colors={colors} key={action.key} onPress={() => openMenuScreen(action.key)} />
          ))}
        </View>
      </View>
    );
  },
);

HomePopupBody.displayName = 'HomePopupBody';

const SearchPopupBody: FC<IPopupRenderContext> & FunctionComponent<IPopupRenderContext> = memo<IPopupRenderContext & ComponentProps<typeof SearchPopupBody>>(
  ({ colors }: IPopupRenderContext & ComponentProps<typeof SearchPopupBody>): (ReactNode & ReactElement & JSX.Element) | null => {
    const openMenuScreen = useOpenMenuScreen();

    return (
      <View style={styles.searchContainer}>
        <Pressable
          onPress={() => openMenuScreen('search')}
          style={({ pressed }) => [
            styles.searchField,
            {
              backgroundColor: pressed ? colors.hover : colors.input,
              borderColor: colors.border,
            },
          ]}>
          <TabIcon color={colors.muted} name='search' size={15} />
          <Text style={[styles.searchPlaceholder, { color: colors.muted }]}>Search audiobooks, authors...</Text>
        </Pressable>

        <SectionLabel color={colors.muted}>Browse</SectionLabel>
        <View style={styles.chipRow}>
          {categories.map(category => (
            <Pressable
              key={category.key}
              onPress={() => openMenuScreen(category.key)}
              style={({ pressed }) => [
                styles.categoryChip,
                {
                  backgroundColor: pressed ? colors.hover : colors.input,
                  borderColor: colors.border,
                },
              ]}>
              <Text style={[styles.chipText, { color: colors.foreground }]}>{category.label}</Text>
            </Pressable>
          ))}
        </View>

        <SectionLabel color={colors.muted}>Recent</SectionLabel>
        <View style={styles.recentList}>
          {recentItems.map(item => (
            <ActionRow action={item} colors={colors} key={item.key} onPress={() => openMenuScreen(item.key)} small />
          ))}
        </View>
      </View>
    );
  },
);

SearchPopupBody.displayName = 'SearchPopupBody';

const UsersPopupBody: FC<IPopupRenderContext> & FunctionComponent<IPopupRenderContext> = ({
  colors,
}: IPopupRenderContext & ComponentProps<typeof UsersPopupBody>): (ReactNode & ReactElement & JSX.Element) | null => {
  const openMenuScreen = useOpenMenuScreen();

  return (
    <View style={styles.profileContainer}>
      <SectionLabel color={colors.muted}>User actions</SectionLabel>
      <View style={styles.actions}>
        {userActions.map(action => (
          <ActionRow action={action} colors={colors} key={action.key} onPress={() => openMenuScreen(action.key)} showChevron />
        ))}
      </View>
    </View>
  );
};

const LocationPopupBody: FC<IPopupRenderContext> & FunctionComponent<IPopupRenderContext> = ({
  colors,
}: IPopupRenderContext & ComponentProps<typeof LocationPopupBody>): (ReactNode & ReactElement & JSX.Element) | null => {
  const router = useRouter();
  const openMenuScreen = useOpenMenuScreen();

  return (
    <View style={styles.profileContainer}>
      <SectionLabel color={colors.muted}>Location actions</SectionLabel>
      <View style={styles.actions}>
        <ActionRow
          action={locationActions[0]}
          colors={colors}
          onPress={() =>
            router.push({
              pathname: '/location',
              params: { action: 'create' },
            } as never)
          }
          showChevron
        />
        <ActionRow action={locationActions[1]} colors={colors} onPress={() => openMenuScreen('pick-lat-lng')} showChevron />
      </View>
    </View>
  );
};

const PopupBody: FC<IPopupRenderContext> & FunctionComponent<IPopupRenderContext> = (
  context: IPopupRenderContext & ComponentProps<typeof PopupBody>,
): (ReactNode & ReactElement & JSX.Element) | null => {
  if (context.route.name === 'search') return <SearchPopupBody {...context} />;
  if (context.route.name === 'location') return <LocationPopupBody {...context} />;
  if (context.route.name === 'users') return <UsersPopupBody {...context} />;
  return <HomePopupBody {...context} />;
};

function ActionRow({
  action,
  colors,
  onPress,
  showChevron,
  small,
}: {
  action: LinkedAction;
  colors: IPalette;
  onPress: () => void;
  showChevron?: boolean;
  small?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.actionRow, small && styles.smallActionRow, { backgroundColor: pressed ? colors.hover : 'transparent' }]}>
      <View style={[styles.actionIconWrap, small && styles.smallActionIconWrap, { backgroundColor: small ? colors.input : 'transparent' }]}>
        <TabIcon color={colors.foreground} name={action.icon} size={small ? 15 : 20} />
      </View>
      <Text numberOfLines={1} style={[styles.actionLabel, small && styles.smallActionLabel, { color: colors.foreground }]}>
        {action.label}
      </Text>
      {action.trailing ? (
        <Text numberOfLines={1} style={[styles.actionTrailing, { color: colors.muted }]}>
          {action.trailing}
        </Text>
      ) : null}
      {showChevron ? <Text style={[styles.chevron, { color: colors.muted }]}>›</Text> : null}
    </Pressable>
  );
}

function SectionLabel({ children, color }: { children: string; color: string }) {
  return <Text style={[styles.sectionLabel, { color }]}>{children}</Text>;
}

const styles = StyleSheet.create({
  actionIconWrap: {
    alignItems: 'center',
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  actionLabel: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
  },
  actionRow: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 14,
    minHeight: 50,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  actions: {
    gap: 3,
  },
  actionTrailing: {
    flexShrink: 0,
    fontSize: 15,
    fontWeight: '600',
    maxWidth: 90,
  },
  artwork: {
    borderRadius: 10,
    height: 58,
    width: 58,
  },
  avatar: {
    borderRadius: 999,
    height: 38,
    width: 38,
  },
  cardAuthor: {
    color: 'rgba(0,0,0,0.55)',
    fontSize: 14,
    fontWeight: '600',
  },
  cardMeta: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    color: '#111111',
    fontSize: 19,
    fontWeight: '800',
  },
  categoryChip: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chevron: {
    fontSize: 22,
    lineHeight: 22,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 2,
  },
  email: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  eyebrow: {
    color: 'rgba(0,0,0,0.55)',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  homeContainer: {
    gap: 8,
    minWidth: 320,
    padding: 10,
  },
  listenCard: {
    alignItems: 'center',
    borderRadius: 18,
    flexDirection: 'row',
    gap: 13,
    padding: 12,
  },
  name: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '800',
  },
  nameRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  playButton: {
    alignItems: 'center',
    backgroundColor: '#000000',
    borderRadius: 999,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  proPill: {
    backgroundColor: '#FFD60A',
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  proPillText: {
    color: '#111111',
    fontSize: 9,
    fontWeight: '900',
  },
  profileContainer: {
    gap: 6,
    maxWidth: 300,
    minWidth: 278,
    padding: 8,
  },
  profileHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 11,
    paddingBottom: 8,
    paddingHorizontal: 8,
    paddingTop: 6,
  },
  profileMeta: {
    flex: 1,
    minWidth: 0,
  },
  progressFill: {
    backgroundColor: '#111111',
    borderRadius: 999,
    height: '100%',
  },
  progressRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  progressTrack: {
    backgroundColor: 'rgba(0,0,0,0.16)',
    borderRadius: 999,
    flex: 1,
    height: 4,
    overflow: 'hidden',
  },
  recentList: {
    gap: 2,
  },
  searchContainer: {
    gap: 10,
    minWidth: 320,
    padding: 10,
  },
  searchField: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchPlaceholder: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    marginLeft: 4,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  smallActionIconWrap: {
    borderRadius: 8,
    height: 34,
    width: 34,
  },
  smallActionLabel: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  smallActionRow: {
    gap: 10,
    minHeight: 44,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  timeLeft: {
    color: 'rgba(0,0,0,0.58)',
    fontSize: 13,
    fontWeight: '800',
  },
});

export { PopupBody };
