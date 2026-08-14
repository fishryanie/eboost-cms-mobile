import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { ChevronDown, ChevronUp, Copy, FileText } from 'lucide-react-native';
import { type PropsWithChildren, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, useWindowDimensions } from 'react-native';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { ThemedText, ThemedView } from 'components/base';
import { EmptyState } from 'components/ui';
import { FontFamily, Palette } from 'themes';
import { rmhs } from 'themes/scaling';

import {
  copyProfileValue,
  formatRecordValue,
  getAvatarUrl,
  getInitials,
  getRecordSubtitle,
  getRecordTitle,
  humanizeKey,
  profileColors,
  toProfileRecord,
  toProfileRecords,
} from './user-profile-helpers';
import type { ProfileRecord, ProfileTab } from './user-profile-types';

const AnimatedThemedView = Animated.createAnimatedComponent(ThemedView);
const profileTabWidth = rmhs(120);

export function SurfaceCard({ children }: PropsWithChildren) {
  return (
    <ThemedView backgroundColor='#FAFAFA' borderColor={Palette.borderSubtle} borderCurve='continuous' borderRadius={12} borderWidth={1} padding={'three'}>
      {children}
    </ThemedView>
  );
}

export function SectionHeading({ count, eyebrow, subtitle, title }: { count?: number; eyebrow: string; subtitle?: string; title: string }) {
  return (
    <ThemedView backgroundColor='transparent' gap={3}>
      <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={'two'}>
        <ThemedText color={Palette.accent} fontFamily={FontFamily.bold} fontSize={10} letterSpacing={1.1} textTransform='uppercase'>
          {eyebrow}
        </ThemedText>
        {count !== undefined ? <MiniBadge color={Palette.accent} label={String(count)} surface={profileColors.accentSurface} /> : null}
      </ThemedView>
      <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={18} lineHeight={24} selectable>
        {title}
      </ThemedText>
      {subtitle ? (
        <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={12} lineHeight={18}>
          {subtitle}
        </ThemedText>
      ) : null}
    </ThemedView>
  );
}

export function MiniBadge({ color, label, surface }: { color: string; label: string; surface: string }) {
  return (
    <ThemedView
      alignItems='center'
      alignSelf='flex-start'
      backgroundColor={surface}
      borderRadius={'pill'}
      justifyContent='center'
      paddingHorizontal={'two'}
      paddingVertical={4}>
      <ThemedText color={color} fontFamily={FontFamily.semibold} fontSize={10} lineHeight={14} numberOfLines={1} selectable>
        {label}
      </ThemedText>
    </ThemedView>
  );
}

export function CopyButton({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;

  return (
    <Pressable
      accessibilityLabel={`Copy ${label}`}
      accessibilityRole='button'
      hitSlop={8}
      onPress={() => void copyProfileValue(value, label)}
      style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1 })}>
      <ThemedView alignItems='center' backgroundColor={profileColors.accentSurface} borderRadius={'pill'} height={34} justifyContent='center' width={34}>
        <Copy color={Palette.accent} size={15} strokeWidth={2.2} />
      </ThemedView>
    </Pressable>
  );
}

export function ProfileHeaderAvatar({ user }: { user: UserProfile }) {
  const avatarUrl = getAvatarUrl(user);

  return (
    <ThemedView
      alignItems='center'
      backgroundColor={profileColors.accentSurface}
      borderColor={profileColors.accentBorder}
      borderRadius={'pill'}
      borderWidth={1}
      height={36}
      justifyContent='center'
      overflow='hidden'
      width={36}>
      {avatarUrl ? (
        <Image accessibilityLabel='User avatar' contentFit='cover' source={{ uri: avatarUrl }} style={{ height: 36, width: 36 }} />
      ) : (
        <ThemedText color={Palette.accent} fontFamily={FontFamily.bold} fontSize={11}>
          {getInitials(user)}
        </ThemedText>
      )}
    </ThemedView>
  );
}

export function ProfileTabBar({
  activeTab,
  onChange,
  progress,
}: {
  activeTab: ProfileTab;
  onChange: (tab: ProfileTab) => void;
  progress: SharedValue<number>;
}) {
  const tabs: { label: string; value: ProfileTab }[] = [
    { label: 'Overview', value: 'overview' },
    { label: 'Activity', value: 'activity' },
    { label: 'Payment', value: 'payment' },
    { label: 'Transactions', value: 'transactions' },
    { label: 'Promotions', value: 'promotions' },
    { label: 'SMS Logs', value: 'sms-logs' },
    { label: 'Notifications', value: 'notification-messages' },
  ];
  const scrollRef = useRef<ScrollView>(null);
  const { width: viewportWidth } = useWindowDimensions();
  const activeIndex = Math.max(
    0,
    tabs.findIndex(tab => tab.value === activeTab),
  );
  const indicatorStyle = useAnimatedStyle(
    () => ({
      transform: [{ translateX: progress.get() * profileTabWidth }],
    }),
    [],
  );

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        animated: true,
        x: Math.max(0, activeIndex * profileTabWidth - (viewportWidth - profileTabWidth) / 2),
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [activeIndex, viewportWidth]);

  return (
    <ThemedView backgroundColor={Palette.surfaceBase} borderBottomColor={Palette.borderSubtle} borderBottomWidth={1} overflow='hidden' width='100%'>
      <ScrollView horizontal ref={scrollRef} showsHorizontalScrollIndicator={false}>
        <ThemedView backgroundColor='transparent' flexDirection='row' position='relative' width={tabs.length * profileTabWidth}>
          {tabs.map(tab => {
            const selected = activeTab === tab.value;

            return (
              <Pressable
                accessibilityRole='tab'
                accessibilityState={{ selected }}
                key={tab.value}
                onPress={() => {
                  if (!selected) {
                    void Haptics.selectionAsync().catch(() => undefined);
                    onChange(tab.value);
                  }
                }}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, width: profileTabWidth })}>
                <ThemedView alignItems='center' backgroundColor='transparent' height={56} justifyContent='center' paddingHorizontal={'two'}>
                  <ThemedText
                    color={selected ? Palette.accent : Palette.textSecondary}
                    fontFamily={selected ? FontFamily.bold : FontFamily.semibold}
                    fontSize={14}
                    lineHeight={19}
                    numberOfLines={1}>
                    {tab.label}
                  </ThemedText>
                </ThemedView>
              </Pressable>
            );
          })}
        </ThemedView>
        <AnimatedThemedView
          backgroundColor={Palette.accent}
          bottom={0}
          height={2}
          left={0}
          pointerEvents='none'
          position='absolute'
          style={indicatorStyle}
          width={profileTabWidth}
        />
      </ScrollView>
    </ThemedView>
  );
}

export function RecordDetails({ record }: { record: ProfileRecord | unknown }) {
  const entries = Object.entries(toProfileRecord(record));

  return (
    <ThemedView backgroundColor={Palette.surfaceMuted} borderCurve='continuous' borderRadius={14} overflow='hidden'>
      {entries.map(([key, value], index) => (
        <ThemedView
          borderBottomColor={index === entries.length - 1 ? 'transparent' : Palette.borderSubtle}
          borderBottomWidth={index === entries.length - 1 ? 0 : 1}
          gap={4}
          key={key}
          paddingHorizontal={'three'}
          paddingVertical={'three'}>
          <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.semibold} fontSize={9} letterSpacing={0.7} textTransform='uppercase'>
            {humanizeKey(key)}
          </ThemedText>
          <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.medium} fontSize={11} lineHeight={17} selectable>
            {formatRecordValue(value)}
          </ThemedText>
        </ThemedView>
      ))}
    </ThemedView>
  );
}

export function ProfileRecordCard({ index, record }: { index: number; record: ProfileRecord }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <SurfaceCard>
      <ThemedView gap={'three'}>
        <Pressable accessibilityRole='button' onPress={() => setExpanded(value => !value)} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
          <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={'three'}>
            <ThemedView alignItems='center' backgroundColor={profileColors.infoSurface} borderRadius={12} height={38} justifyContent='center' width={38}>
              <FileText color={profileColors.info} size={18} />
            </ThemedView>
            <ThemedView backgroundColor='transparent' flex={1} gap={2} minWidth={0}>
              <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={13} lineHeight={18} numberOfLines={2} selectable>
                {getRecordTitle(record, index)}
              </ThemedText>
              <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={10} lineHeight={15} numberOfLines={1}>
                {getRecordSubtitle(record)}
              </ThemedText>
            </ThemedView>
            {expanded ? <ChevronUp color={Palette.textTertiary} size={18} /> : <ChevronDown color={Palette.textTertiary} size={18} />}
          </ThemedView>
        </Pressable>
        {expanded ? <RecordDetails record={record} /> : null}
      </ThemedView>
    </SurfaceCard>
  );
}

export function ProfileRecordList({ emptyMessage, emptyTitle, records }: { emptyMessage: string; emptyTitle: string; records?: unknown[] | null }) {
  const normalizedRecords = toProfileRecords(records);

  if (!normalizedRecords.length) return <EmptyState message={emptyMessage} title={emptyTitle} />;

  return (
    <ThemedView backgroundColor='transparent' gap={'two'}>
      {normalizedRecords.map((record, index) => (
        <ProfileRecordCard index={index} key={String(record.id || record.iriId || record.code || record.createdAt || JSON.stringify(record))} record={record} />
      ))}
    </ThemedView>
  );
}

export function ProfileLoadingState() {
  return (
    <ThemedView backgroundColor='transparent' gap={'four'}>
      <ThemedView borderRadius={'large'} height={168} loading />
      <ThemedView flexDirection='row' flexWrap='wrap' gap={'three'}>
        <ThemedView borderRadius={'large'} height={92} loading width='48%' />
        <ThemedView borderRadius={'large'} height={92} loading width='48%' />
        <ThemedView borderRadius={'large'} height={92} loading width='48%' />
        <ThemedView borderRadius={'large'} height={92} loading width='48%' />
      </ThemedView>
      <ThemedView borderRadius={'large'} height={220} loading />
    </ThemedView>
  );
}
