import { useRouter } from 'expo-router';
import { BellRing, CalendarClock, ChevronRight, FileText, Layers3, type LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText, ThemedView } from 'components/base';
import { AnimatedHeaderFlatList } from 'components/organisms/anmated-header-flatlist';
import { FontFamily, Palette } from 'themes';

const accentColor = '#D64A7F';

type NotificationAction = {
  description: string;
  href: string;
  icon: LucideIcon;
  title: string;
};

const notificationActions: NotificationAction[] = [
  {
    description: 'Compose and deliver a notification to a topic or a selected customer.',
    href: '/marketing/push-notice',
    icon: BellRing,
    title: 'Push notice',
  },
  {
    description: 'Create a notice that will be delivered automatically at a chosen time.',
    href: '/marketing/schedule-notice',
    icon: CalendarClock,
    title: 'Schedule notice',
  },
  {
    description: 'Review saved drafts and continue editing messages that are not ready to send.',
    href: '/marketing/notice-drafts',
    icon: FileText,
    title: 'Notice drafts',
  },
  {
    description: 'Browse reusable bilingual messages and send a notice from a standard template.',
    href: '/marketing/notification-message-templates',
    icon: Layers3,
    title: 'Message templates',
  },
];

export function NotificationsPage({ onBack }: { onBack: () => void }) {
  const router = useRouter();

  return (
    <ThemedView flex={1} backgroundColor={Palette.surfaceBase}>
      <AnimatedHeaderFlatList
        canGoBack
        contentContainerStyle={{ paddingBottom: 120 }}
        data={notificationActions}
        keyExtractor={item => item.href}
        largeHeaderTitleStyle={{ fontFamily: FontFamily.bold, fontSize: 36, letterSpacing: -0.7, lineHeight: 42 }}
        largeTitle='Notifications'
        onBack={onBack}
        renderItem={({ item }) => <NotificationActionRow action={item} onPress={() => router.push(item.href as never)} />}
        showsVerticalScrollIndicator={false}
        smallHeaderTitleStyle={{ fontFamily: FontFamily.semibold }}
        subtitle='4 notification tools'
      />
    </ThemedView>
  );
}

function NotificationActionRow({ action, onPress }: { action: NotificationAction; onPress: () => void }) {
  const Icon = action.icon;

  return (
    <ThemedView backgroundColor={Palette.surfaceBase} overflow='hidden'>
      <Pressable accessibilityLabel={action.title} accessibilityRole='button' onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
        <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={12} minHeight={104} paddingLeft={12}>
          <ThemedView
            alignItems='center'
            backgroundColor={`${accentColor}0D`}
            borderColor={`${accentColor}24`}
            borderCurve='continuous'
            borderRadius={16}
            borderWidth={1}
            height={64}
            justifyContent='center'
            width={64}>
            <Icon color={accentColor} size={25} strokeWidth={1.8} />
          </ThemedView>

          <ThemedView
            backgroundColor='transparent'
            borderBottomColor='#E6EAE8'
            borderBottomWidth={StyleSheet.hairlineWidth}
            flex={1}
            gap={5}
            justifyContent='center'
            minHeight={104}
            minWidth={0}
            paddingRight={12}
            paddingVertical={10}>
            <ThemedText color={accentColor} fontFamily={FontFamily.semibold} fontSize={9} letterSpacing={0.7} lineHeight={12} textTransform='uppercase'>
              Notification tool
            </ThemedText>
            <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={'three'}>
              <ThemedView flex={1} minWidth={0}>
                <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={15} lineHeight={20}>
                  {action.title}
                </ThemedText>
                <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={11} lineHeight={15} marginTop={3} numberOfLines={2}>
                  {action.description}
                </ThemedText>
              </ThemedView>
              <ChevronRight color={Palette.textTertiary} size={18} />
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </Pressable>
    </ThemedView>
  );
}
