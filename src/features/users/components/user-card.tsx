import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { memo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FontFamily, Palette, Radius, Spacing } from 'constants/theme';
import { ImagePreviewModal } from 'shared/media/image-preview-modal';
import { getDisplayImageUrl } from 'shared/media/image-url';

import { getUserLoginProvider } from '../user-account';
import type { UserListItem } from '../types';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
});

function VerificationIcon({ verified }: { verified?: boolean }) {
  const color = verified ? '#00B85A' : '#FF3B4E';

  return (
    <View style={[styles.verifyCircle, { borderColor: color }]}>
      <SymbolView name={verified ? 'checkmark' : 'exclamationmark'} resizeMode='scaleAspectFit' size={10} tintColor={color} />
    </View>
  );
}

function ProviderIcon({ username }: { username?: string | null }) {
  const provider = getUserLoginProvider(username);

  if (provider === 'google') {
    return <Text style={styles.googleIcon}>G</Text>;
  }

  if (provider === 'apple') {
    return <SymbolView name='apple.logo' resizeMode='scaleAspectFit' size={15} tintColor={Palette.textSecondary} />;
  }

  return null;
}

function getUserAvatar(user: UserListItem) {
  return getDisplayImageUrl(user.image?.url || user.avatarUrl || user.avatar_url || user.avatar?.url || user.avatar?.path);
}

export const UserCard = memo(function UserCard({ onPress, user }: { onPress: () => void; user: UserListItem }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const displayName = user.name || user.username || user.email || `User #${user.id}`;
  const levelColor = user.userLevel?.backgroundColor || '#00AF55';
  const avatarUrl = getUserAvatar(user);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.avatarColumn}>
        <View style={styles.avatar}>
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
        </View>
        <View style={styles.idBadge}>
          <Text style={styles.idText}>#{user.id}</Text>
        </View>
      </View>

      <View style={styles.details}>
        <Text numberOfLines={1} style={styles.name}>
          {displayName}
        </Text>

        <View style={styles.contactRow}>
          <VerificationIcon verified={user.isPhoneVerified} />
          <Text numberOfLines={1} style={[styles.contactText, styles.phoneText]}>
            {user.phoneNumber || 'eboost-phone'}
          </Text>
          <SymbolView name='doc.on.doc' resizeMode='scaleAspectFit' size={14} tintColor='#00AF55' />
        </View>

        <View style={styles.contactRow}>
          <VerificationIcon verified={user.activatedMail} />
          <ProviderIcon username={user.username} />
          <Text numberOfLines={1} style={styles.contactText}>
            {user.email || 'No email'}
          </Text>
          <SymbolView name='doc.on.doc' resizeMode='scaleAspectFit' size={14} tintColor='#00AF55' />
        </View>
      </View>

      <View style={styles.summary}>
        {user.userLevel?.name ? (
          <View style={[styles.levelBadge, { backgroundColor: levelColor }]}>
            <Text numberOfLines={1} style={styles.levelText}>
              {user.userLevel.name}
            </Text>
          </View>
        ) : null}
        <Text style={styles.balanceLabel}>BALANCE</Text>
        <Text numberOfLines={1} style={styles.balance}>
          {currencyFormatter.format(user.balance || 0)} đ
        </Text>
      </View>
      <ImagePreviewModal imageUrl={avatarUrl} onClose={() => setPreviewOpen(false)} title={displayName} visible={previewOpen} />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    backgroundColor: '#66769E',
    borderColor: Palette.border,
    borderRadius: Radius.pill,
    borderWidth: 2,
    height: 50,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 50,
  },
  avatarColumn: {
    alignItems: 'center',
    alignSelf: 'stretch',
    justifyContent: 'center',
    width: 58,
  },
  avatarImage: {
    height: 50,
    width: 50,
  },
  balance: {
    color: '#00AF55',
    fontFamily: FontFamily.bold,
    fontSize: 15,
    lineHeight: 20,
    marginTop: 1,
    textAlign: 'right',
  },
  balanceLabel: {
    color: Palette.textTertiary,
    fontFamily: FontFamily.semibold,
    fontSize: 10,
    marginTop: 4,
    textAlign: 'right',
  },
  contactRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.one,
    minWidth: 0,
  },
  contactText: {
    color: Palette.textSecondary,
    fontFamily: FontFamily.regular,
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 17,
    minWidth: 0,
  },
  details: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  googleIcon: {
    color: Palette.textSecondary,
    fontFamily: FontFamily.bold,
    fontSize: 14,
    lineHeight: 16,
  },
  idBadge: {
    backgroundColor: Palette.surfaceRaised,
    borderColor: Palette.border,
    borderRadius: Radius.small,
    borderWidth: 1,
    marginTop: -7,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  idText: {
    color: Palette.textSecondary,
    fontFamily: FontFamily.semibold,
    fontSize: 10,
  },
  levelBadge: {
    alignSelf: 'flex-end',
    borderRadius: Radius.small,
    maxWidth: 84,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  levelText: {
    color: '#FFFFFF',
    fontFamily: FontFamily.semibold,
    fontSize: 10,
  },
  name: {
    color: Palette.textPrimary,
    fontFamily: FontFamily.bold,
    fontSize: 15,
    lineHeight: 20,
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
    gap: Spacing.three,
    minHeight: 82,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  summary: {
    alignItems: 'flex-end',
    alignSelf: 'stretch',
    justifyContent: 'center',
    minWidth: 78,
  },
  verifyCircle: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    height: 15,
    justifyContent: 'center',
    width: 15,
  },
});
