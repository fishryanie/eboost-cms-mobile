import { Image } from 'expo-image';
import { AlertTriangle, Check, Copy, User } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable } from 'react-native';

import { ThemedText, ThemedView } from 'components/base';
import { ImagePreviewModal } from 'components/media/image-preview-modal';
import { FontFamily, Palette } from 'themes';

import { getUserLoginProvider } from '../user-account';
import { copyProfileValue, formatPhone, getAvatarUrl, getDisplayName } from './user-profile-helpers';

export function UserProfileSummaryCard({ user }: { user: UserProfile }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const avatarUrl = getAvatarUrl(user);
  const displayName = getDisplayName(user);

  return (
    <>
      <ThemedView backgroundColor={Palette.surfaceBase} gap={'three'} paddingHorizontal={'one'} paddingVertical={'three'}>
        <ThemedView alignItems='flex-start' backgroundColor='transparent' flexDirection='row' gap={'two'}>
          <ThemedView alignItems='center' backgroundColor='transparent' flexShrink={0} width={64}>
            <Pressable
              accessibilityLabel={avatarUrl ? `Open avatar for ${displayName}` : undefined}
              accessibilityRole={avatarUrl ? 'button' : undefined}
              disabled={!avatarUrl}
              onPress={() => setPreviewOpen(true)}>
              {({ pressed }) => (
                <ThemedView
                  alignItems='center'
                  backgroundColor='#EAF3EE'
                  borderColor={Palette.borderSubtle}
                  borderRadius={'pill'}
                  borderWidth={2}
                  height={56}
                  justifyContent='center'
                  opacity={pressed ? 0.72 : 1}
                  overflow='hidden'
                  width={56}>
                  {avatarUrl ? (
                    <Image accessibilityLabel={`${displayName} avatar`} contentFit='cover' source={{ uri: avatarUrl }} style={{ height: 56, width: 56 }} />
                  ) : (
                    <User color={Palette.accent} size={30} strokeWidth={1.8} />
                  )}
                </ThemedView>
              )}
            </Pressable>
            <ThemedView
              backgroundColor={Palette.surfaceRaised}
              borderColor={Palette.border}
              borderCurve='continuous'
              borderRadius={6}
              borderWidth={1}
              marginTop={-8}
              paddingHorizontal={'one'}
              paddingVertical={2}>
              <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={10} lineHeight={13} selectable>
                #{user.id}
              </ThemedText>
            </ThemedView>
          </ThemedView>

          <ThemedView backgroundColor='transparent' flex={1} gap={3} minWidth={0} paddingTop={2}>
            <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={17} lineHeight={22} numberOfLines={1} selectable>
              {displayName}
            </ThemedText>
            <ContactLine copyLabel='Phone number' copyValue={user.phoneNumber} value={formatPhone(user.phoneNumber)} verified={user.isPhoneVerified} />
            <ContactLine
              copyLabel='Email address'
              copyValue={user.email}
              providerUsername={user.username}
              value={user.email || 'No email'}
              verified={user.activatedMail}
            />
          </ThemedView>
        </ThemedView>

        {user.address ? (
          <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.regular} fontSize={13} lineHeight={19} selectable>
            {user.address}
          </ThemedText>
        ) : null}
      </ThemedView>
      <ImagePreviewModal imageUrl={avatarUrl} onClose={() => setPreviewOpen(false)} title={displayName} visible={previewOpen} />
    </>
  );
}

function ContactLine({
  copyLabel,
  copyValue,
  providerUsername,
  value,
  verified,
}: {
  copyLabel: string;
  copyValue?: string | null;
  providerUsername?: string | null;
  value: string;
  verified?: boolean;
}) {
  return (
    <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={'one'} minWidth={0}>
      <VerificationIcon verified={verified} />
      {providerUsername ? <ProviderMark username={providerUsername} /> : null}
      <ThemedText color={Palette.textPrimary} flex={1} fontFamily={FontFamily.regular} fontSize={13} lineHeight={18} minWidth={0} numberOfLines={1} selectable>
        {value}
      </ThemedText>
      <InlineCopyButton label={copyLabel} value={copyValue} />
    </ThemedView>
  );
}

function VerificationIcon({ verified }: { verified?: boolean }) {
  const color = verified ? '#00B85A' : '#FF3B4E';

  return (
    <ThemedView
      alignItems='center'
      backgroundColor='transparent'
      borderColor={color}
      borderRadius={'pill'}
      borderWidth={1.5}
      flexShrink={0}
      height={16}
      justifyContent='center'
      width={16}>
      {verified ? <Check color={color} size={10} strokeWidth={3} /> : <AlertTriangle color={color} size={9} strokeWidth={2.6} />}
    </ThemedView>
  );
}

function ProviderMark({ username }: { username: string }) {
  const provider = getUserLoginProvider(username);
  if (provider !== 'apple' && provider !== 'google') return null;

  return (
    <ThemedText color={Palette.textSecondary} flexShrink={0} fontFamily={FontFamily.bold} fontSize={14} lineHeight={16}>
      {provider === 'google' ? 'G' : 'A'}
    </ThemedText>
  );
}

function InlineCopyButton({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;

  return (
    <Pressable accessibilityLabel={`Copy ${label}`} accessibilityRole='button' hitSlop={8} onPress={() => void copyProfileValue(value, label)}>
      {({ pressed }) => (
        <ThemedView alignItems='center' backgroundColor='transparent' height={20} justifyContent='center' opacity={pressed ? 0.5 : 1} width={20}>
          <Copy color={Palette.accent} size={16} strokeWidth={2.2} />
        </ThemedView>
      )}
    </Pressable>
  );
}
