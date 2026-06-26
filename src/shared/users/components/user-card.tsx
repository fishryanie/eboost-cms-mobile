import { mhs } from 'themes/scaling';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { memo, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { ThemedText, ThemedView } from 'components/base';

import { FontFamily, Palette } from 'themes';
import { ImagePreviewModal } from 'components/media/image-preview-modal';
import { getDisplayImageUrl } from 'utils/media/image-url';

import { getUserLoginProvider } from '../user-account';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
});

function VerificationIcon({ verified }: { verified?: boolean }) {
  const color = verified ? '#00B85A' : '#FF3B4E';

  return (
    <ThemedView style={[styles.verifyCircle, { borderColor: color }]}>
      <SymbolView name={verified ? 'checkmark' : 'exclamationmark'} resizeMode='scaleAspectFit' size={10} tintColor={color} />
    </ThemedView>
  );
}

function ProviderIcon({ username }: { username?: string | null }) {
  const provider = getUserLoginProvider(username);

  if (provider === 'google') {
    return (
      <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.bold} fontSize={14} lineHeight={16}>
        G
      </ThemedText>
    );
  }

  if (provider === 'apple') {
    return <SymbolView name='apple.logo' resizeMode='scaleAspectFit' size={15} tintColor={Palette.textSecondary} />;
  }

  return null;
}

function getUserAvatar(user: UserListItem) {
  return getDisplayImageUrl(user.image?.url || user.avatarUrl || user.avatar_url || user.avatar?.url || user.avatar?.path);
}

export const UserCard = memo(function UserCard({ onPress, style, user }: { onPress: () => void; style?: any; user: UserListItem }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const displayName = user.name || user.username || user.email || `User #${user.id}`;
  const levelColor = user.userLevel?.backgroundColor || '#00AF55';
  const avatarUrl = getUserAvatar(user);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, style, pressed && styles.pressed]}>
      <ThemedView alignItems='center' alignSelf='stretch' justifyContent='center' width={58}>
        <ThemedView
          alignItems='center'
          backgroundColor='#66769E'
          borderColor={Palette.border}
          borderRadius={'pill'}
          borderWidth={2}
          height={50}
          justifyContent='center'
          overflow='hidden'
          width={50}>
          {avatarUrl ? (
            <Pressable
              accessibilityLabel={`Open avatar for ${displayName}`}
              onPress={event => {
                event.stopPropagation();
                setPreviewOpen(true);
              }}>
              <Image contentFit='cover' source={{ uri: avatarUrl }} style={styles.avatarImage} />
            </Pressable>
          ) : (
            <SymbolView name='person.fill' resizeMode='scaleAspectFit' size={38} tintColor='#FFFFFF' />
          )}
        </ThemedView>
        <ThemedView
          backgroundColor={Palette.surfaceRaised}
          borderColor={Palette.border}
          borderRadius={'small'}
          borderWidth={1}
          marginTop={-7}
          paddingHorizontal={4}
          paddingVertical={1}>
          <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={10}>
            #{user.id}
          </ThemedText>
        </ThemedView>
      </ThemedView>

      <ThemedView flex={1} gap={2} minWidth={0}>
        <ThemedText numberOfLines={1} color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={14} lineHeight={19}>
          {displayName}
        </ThemedText>

        <ThemedView alignItems='center' flexDirection='row' gap={'one'} minWidth={0}>
          <VerificationIcon verified={user.isPhoneVerified} />
          <ThemedText numberOfLines={1} style={[styles.contactText, styles.phoneText]}>
            {user.phoneNumber || 'eboost-phone'}
          </ThemedText>
          <SymbolView name='doc.on.doc' resizeMode='scaleAspectFit' size={14} tintColor='#00AF55' />
        </ThemedView>

        <ThemedView alignItems='center' flexDirection='row' gap={'one'} minWidth={0}>
          <VerificationIcon verified={user.activatedMail} />
          <ProviderIcon username={user.username} />
          <ThemedText numberOfLines={1} color={Palette.textSecondary} fontFamily={FontFamily.regular} flexShrink={1} fontSize={12} lineHeight={17} minWidth={0}>
            {user.email || 'No email'}
          </ThemedText>
          <SymbolView name='doc.on.doc' resizeMode='scaleAspectFit' size={14} tintColor='#00AF55' />
        </ThemedView>
      </ThemedView>

      <ThemedView alignItems='flex-end' alignSelf='stretch' justifyContent='center' flexShrink={0} width={74}>
        {user.userLevel?.name ? (
          <ThemedView style={[styles.levelBadge, { backgroundColor: levelColor }]}>
            <ThemedText numberOfLines={1} color='#FFFFFF' fontFamily={FontFamily.semibold} fontSize={10}>
              {user.userLevel.name}
            </ThemedText>
          </ThemedView>
        ) : null}
        <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.semibold} fontSize={10} marginTop={4} textAlign='right'>
          BALANCE
        </ThemedText>
        <ThemedText numberOfLines={1} color='#00AF55' fontFamily={FontFamily.semibold} fontSize={14} lineHeight={18} marginTop={1} textAlign='right'>
          {currencyFormatter.format(user.balance || 0)} đ
        </ThemedText>
      </ThemedView>
      <ImagePreviewModal imageUrl={avatarUrl} onClose={() => setPreviewOpen(false)} title={displayName} visible={previewOpen} />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  avatarImage: {
    height: 50,
    width: 50,
  },
  contactText: {
    color: Palette.textSecondary,
    fontFamily: FontFamily.regular,
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 17,
    minWidth: 0,
  },
  levelBadge: {
    alignSelf: 'flex-end',
    borderRadius: mhs(12),
    maxWidth: 74,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  phoneText: {
    fontVariant: ['tabular-nums'],
  },
  pressed: {
    backgroundColor: Palette.surfaceMuted,
  },
  row: {
    alignItems: 'center',
    backgroundColor: Palette.surfaceBase,
    borderBottomColor: Palette.borderSubtle,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: mhs(8),
    minHeight: 82,
    paddingHorizontal: mhs(8),
    paddingVertical: mhs(12),
  },
  verifyCircle: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1.5,
    height: 15,
    justifyContent: 'center',
    width: 15,
  },
});
