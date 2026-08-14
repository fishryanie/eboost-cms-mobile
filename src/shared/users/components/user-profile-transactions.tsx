import * as Haptics from 'expo-haptics';
import { Landmark, Smartphone, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable } from 'react-native';

import { ThemedText, ThemedView } from 'components/base';
import { FontFamily, Palette } from 'themes';

import { ProfileRecordList, SectionHeading } from './user-profile-common';
import { profileColors } from './user-profile-helpers';
import type { PaymentProviderTab } from './user-profile-types';

export function UserProfilePayment({ user }: { user: UserProfile }) {
  const [provider, setProvider] = useState<PaymentProviderTab>('momo');
  const tabs: ProviderOption[] = [
    { Icon: Smartphone, count: user.momoHistories?.length || 0, label: 'MoMo', value: 'momo' },
    { Icon: Landmark, count: user.alePayHistories?.length || 0, label: 'AlePay', value: 'alepay' },
  ];
  const active = tabs.find(tab => tab.value === provider) || tabs[0];
  const records = provider === 'momo' ? user.momoHistories : user.alePayHistories;

  return (
    <ThemedView backgroundColor='transparent' gap={'three'}>
      <SectionHeading
        count={active.count}
        eyebrow='Provider history'
        subtitle='Switch between MoMo and AlePay records returned for this account.'
        title={active.label}
      />
      <ThemedView backgroundColor={Palette.surfaceMuted} borderCurve='continuous' borderRadius={'pill'} flexDirection='row' gap={4} padding={4}>
        {tabs.map(tab => (
          <ProviderButton active={provider === tab.value} key={tab.value} onPress={() => setProvider(tab.value)} tab={tab} />
        ))}
      </ThemedView>
      <ProfileRecordList
        emptyMessage={`No ${active.label} payment records were returned for this account.`}
        emptyTitle={`No ${active.label} history`}
        records={records}
      />
    </ThemedView>
  );
}

type ProviderOption = { Icon: LucideIcon; count: number; label: string; value: PaymentProviderTab };

function ProviderButton({ active, onPress, tab: { Icon, count, label } }: { active: boolean; onPress: () => void; tab: ProviderOption }) {
  return (
    <Pressable
      accessibilityRole='tab'
      accessibilityState={{ selected: active }}
      onPress={() => {
        void Haptics.selectionAsync().catch(() => undefined);
        onPress();
      }}
      style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.72 : 1 })}>
      <ThemedView
        alignItems='center'
        backgroundColor={active ? Palette.surfaceRaised : 'transparent'}
        borderColor={active ? profileColors.accentBorder : 'transparent'}
        borderRadius={'pill'}
        borderWidth={1}
        flexDirection='row'
        gap={'two'}
        height={42}
        justifyContent='center'>
        <Icon color={active ? Palette.accent : Palette.textTertiary} size={16} />
        <ThemedText color={active ? Palette.accent : Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={12}>
          {label}
        </ThemedText>
        <ThemedView
          alignItems='center'
          backgroundColor={active ? profileColors.accentSurface : Palette.surfaceRaised}
          borderRadius={'pill'}
          height={20}
          justifyContent='center'
          minWidth={20}
          paddingHorizontal={5}>
          <ThemedText color={active ? Palette.accent : Palette.textTertiary} fontFamily={FontFamily.bold} fontSize={9}>
            {count}
          </ThemedText>
        </ThemedView>
      </ThemedView>
    </Pressable>
  );
}
