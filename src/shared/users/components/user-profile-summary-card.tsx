import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { AtSign, Mail, Phone, Settings, WalletCards } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable } from 'react-native';

import { ThemedText, ThemedView } from 'components/base';
import { ImagePreviewModal } from 'components/media/image-preview-modal';
import { FontFamily, Palette } from 'themes';
import { getDisplayImageUrl } from 'utils/media/image-url';

import { CopyButton, MiniBadge, SurfaceCard } from './user-profile-common';
import { formatCurrency, formatPhone, getAvatarUrl, getDisplayName, getInitials, getProviderLabel, profileColors } from './user-profile-helpers';

export function UserProfileSummaryCard({ user }: { user: UserProfile }) {
  const router = useRouter();
  const [previewOpen, setPreviewOpen] = useState(false);
  const avatarUrl = getAvatarUrl(user);
  const displayName = getDisplayName(user);
  const levelImageUrl = getDisplayImageUrl(user.userLevel?.image?.url);

  return (
    <>
      <SurfaceCard>
        <ThemedView backgroundColor='transparent' gap={'four'}>
          <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={'three'}>
            <Pressable
              accessibilityLabel={avatarUrl ? `Open avatar for ${displayName}` : undefined}
              accessibilityRole={avatarUrl ? 'button' : undefined}
              disabled={!avatarUrl}
              onPress={() => setPreviewOpen(true)}>
              {({ pressed }) => (
                <ThemedView
                  alignItems='center'
                  backgroundColor='#EAF3EF'
                  borderColor='#D3E4DC'
                  borderRadius={'pill'}
                  borderWidth={2}
                  height={68}
                  justifyContent='center'
                  opacity={pressed ? 0.72 : 1}
                  overflow='hidden'
                  width={68}>
                  {avatarUrl ? (
                    <Image accessibilityLabel={`${displayName} avatar`} contentFit='cover' source={{ uri: avatarUrl }} style={{ height: 68, width: 68 }} />
                  ) : (
                    <ThemedText color='#446052' fontFamily={FontFamily.bold} fontSize={21}>
                      {getInitials(user)}
                    </ThemedText>
                  )}
                </ThemedView>
              )}
            </Pressable>

            <ThemedView backgroundColor='transparent' flex={1} gap={'two'} minWidth={0}>
              <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={18} lineHeight={23} numberOfLines={2} selectable>
                {displayName}
              </ThemedText>
              <ThemedView backgroundColor='transparent' flexDirection='row' flexWrap='wrap' gap={'one'}>
                <MiniBadge
                  color={user.enabled === false ? profileColors.danger : profileColors.accent}
                  label={user.enabled === false ? 'Disabled' : 'Active'}
                  surface={user.enabled === false ? profileColors.dangerSurface : profileColors.accentSurface}
                />
                <ThemedView
                  alignItems='center'
                  backgroundColor={user.userLevel?.backgroundColor || '#344054'}
                  borderRadius={'pill'}
                  flexDirection='row'
                  gap={4}
                  minHeight={22}
                  paddingHorizontal={'two'}>
                  {levelImageUrl ? <Image contentFit='contain' source={{ uri: levelImageUrl }} style={{ height: 12, width: 12 }} /> : null}
                  <ThemedText color='#FFFFFF' fontFamily={FontFamily.bold} fontSize={9} textTransform='uppercase'>
                    {user.userLevel?.name || 'No level'}
                  </ThemedText>
                </ThemedView>
              </ThemedView>
              <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={'one'}>
                <AtSign color={Palette.textTertiary} size={12} />
                <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={10} numberOfLines={1} selectable>
                  {getProviderLabel(user.username)} · #{user.id}
                </ThemedText>
              </ThemedView>
            </ThemedView>

            <Pressable
              accessibilityLabel='Open account settings'
              accessibilityRole='button'
              onPress={() => router.push({ pathname: '/user/[id]/settings', params: { id: String(user.id) } } as never)}
              style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1 })}>
              <ThemedView
                alignItems='center'
                backgroundColor={Palette.surfaceMuted}
                borderColor={Palette.borderSubtle}
                borderRadius={'pill'}
                borderWidth={1}
                height={42}
                justifyContent='center'
                width={42}>
                <Settings color={Palette.textPrimary} size={19} strokeWidth={2.2} />
              </ThemedView>
            </Pressable>
          </ThemedView>

          <ThemedView backgroundColor={Palette.surfaceMuted} borderCurve='continuous' borderRadius={14} overflow='hidden'>
            <ContactRow Icon={Phone} copyLabel='Phone number' copyValue={user.phoneNumber} label='Phone' value={formatPhone(user.phoneNumber)} />
            <ContactRow Icon={Mail} copyLabel='Email address' copyValue={user.email} isLast label='Email' value={user.email || 'Not available'} />
          </ThemedView>

          <ThemedView
            alignItems='center'
            backgroundColor='#073D2A'
            borderCurve='continuous'
            borderRadius={15}
            flexDirection='row'
            gap={'three'}
            minHeight={66}
            paddingHorizontal={'four'}>
            <ThemedView alignItems='center' backgroundColor='rgba(255,255,255,0.12)' borderRadius={11} height={38} justifyContent='center' width={38}>
              <WalletCards color='#FFFFFF' size={19} />
            </ThemedView>
            <ThemedView backgroundColor='transparent' flex={1} gap={1}>
              <ThemedText color='rgba(255,255,255,0.68)' fontFamily={FontFamily.bold} fontSize={9} letterSpacing={1} textTransform='uppercase'>
                Wallet balance
              </ThemedText>
              <ThemedText color='#FFFFFF' fontFamily={FontFamily.bold} fontSize={22} lineHeight={28} selectable>
                {formatCurrency(user.balance)}
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </SurfaceCard>
      <ImagePreviewModal imageUrl={avatarUrl} onClose={() => setPreviewOpen(false)} title={displayName} visible={previewOpen} />
    </>
  );
}

function ContactRow({
  Icon,
  copyLabel,
  copyValue,
  isLast,
  label,
  value,
}: {
  Icon: typeof Mail;
  copyLabel: string;
  copyValue?: string | null;
  isLast?: boolean;
  label: string;
  value: string;
}) {
  return (
    <ThemedView
      alignItems='center'
      backgroundColor='transparent'
      borderBottomColor={isLast ? 'transparent' : Palette.borderSubtle}
      borderBottomWidth={isLast ? 0 : 1}
      flexDirection='row'
      gap={'two'}
      minHeight={48}
      paddingHorizontal={'three'}>
      <Icon color={Palette.textTertiary} size={15} />
      <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.semibold} fontSize={10} width={42}>
        {label}
      </ThemedText>
      <ThemedText color={Palette.textPrimary} flex={1} fontFamily={FontFamily.medium} fontSize={12} lineHeight={17} numberOfLines={2} selectable>
        {value}
      </ThemedText>
      <CopyButton label={copyLabel} value={copyValue} />
    </ThemedView>
  );
}
