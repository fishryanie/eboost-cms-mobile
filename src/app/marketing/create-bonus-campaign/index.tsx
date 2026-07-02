import { useMutation } from '@tanstack/react-query';
import { BottomButton, HeaderTitle, ThemedText, ThemedView } from 'components/base';
import FloatingTextInput from 'components/ui/FloatingTextInput';
import { useRouter } from 'expo-router';
import { CheckCircle2 } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView } from 'react-native';
import { FontFamily, Palette } from 'themes';
import { mhs } from 'themes/scaling';
import { createBonusCampaign } from './service';
import type { BonusBlacklistUser, BonusRule } from './types';

function ToggleRow({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <ThemedView
        alignItems='center'
        backgroundColor={active ? Palette.accent : Palette.surfaceMuted}
        borderRadius={16}
        flexDirection='row'
        gap={'two'}
        minHeight={42}
        paddingHorizontal={'four'}>
        {active ? <CheckCircle2 color='#FFFFFF' size={16} /> : null}
        <ThemedText color={active ? '#FFFFFF' : Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={13}>
          {label}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export default function CreateBonusCampaignScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [nameVn, setNameVn] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionVn, setDescriptionVn] = useState('');
  const [userType, setUserType] = useState<'0' | '1' | '2'>('0');
  const [userAffectedAt, setUserAffectedAt] = useState('');
  const [beginAt, setBeginAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [topUpAmountMin, setTopUpAmountMin] = useState('');
  const [topUpAmountMax, setTopUpAmountMax] = useState('');
  const [bonusAmountMin, setBonusAmountMin] = useState('');
  const [bonusAmountMax, setBonusAmountMax] = useState('');
  const [maxTotalUsage, setMaxTotalUsage] = useState('');
  const [maxUsagePerUser, setMaxUsagePerUser] = useState('');
  const [rule, setRule] = useState<BonusRule>({ isPercent: false, maxAmount: '', minAmount: '', value: '' });
  const [blacklistText, setBlacklistText] = useState('');
  const [blacklistReason, setBlacklistReason] = useState('');
  const mutation = useMutation({ mutationFn: createBonusCampaign });
  const canSubmit = useMemo(
    () =>
      Boolean(
        name.trim() &&
        nameVn.trim() &&
        beginAt.trim() &&
        endAt.trim() &&
        topUpAmountMin.trim() &&
        topUpAmountMax.trim() &&
        bonusAmountMin.trim() &&
        bonusAmountMax.trim() &&
        rule.minAmount.trim() &&
        rule.maxAmount.trim() &&
        rule.value.trim(),
      ) && !mutation.isPending,
    [
      beginAt,
      bonusAmountMax,
      bonusAmountMin,
      endAt,
      mutation.isPending,
      name,
      nameVn,
      rule.maxAmount,
      rule.minAmount,
      rule.value,
      topUpAmountMax,
      topUpAmountMin,
    ],
  );
  const blacklistUsers = useMemo<BonusBlacklistUser[]>(
    () =>
      blacklistText
        .split(',')
        .map(user => user.trim())
        .filter(Boolean)
        .map(user => ({ reason: blacklistReason.trim(), user: `/api/users/${user.replace(/^\/?api\/users\//, '')}` })),
    [blacklistReason, blacklistText],
  );

  async function submit() {
    if (!canSubmit) {
      Alert.alert('Missing information', 'Please fill campaign date, top-up range, and bonus range.');
      return;
    }

    try {
      await mutation.mutateAsync({
        beginAt,
        blacklistUsers,
        bonusAmountMax,
        bonusAmountMin,
        bonusRules: [rule],
        description,
        descriptionVn,
        endAt,
        maxTotalUsage,
        maxUsagePerUser,
        name,
        nameVn,
        topUpAmountMax,
        topUpAmountMin,
        userAffectedAt,
        userType,
      });
      Alert.alert('Bonus campaign created', 'Campaign was created in inactive state.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (error) {
      Alert.alert('Create failed', error instanceof Error ? error.message : 'Please try again.');
    }
  }

  return (
    <ThemedView backgroundColor={Palette.surfaceBase} flex={1}>
      <HeaderTitle title='Bonus Campaign' />
      <ScrollView contentContainerStyle={{ padding: mhs(16), paddingBottom: 112 }} keyboardShouldPersistTaps='handled'>
        <ThemedView gap={'four'}>
          <ThemedText color={Palette.textSecondary} fontSize={14} lineHeight={20}>
            Create a top-up bonus campaign in inactive approval state.
          </ThemedText>
          <FloatingTextInput label='* Name (English)' value={name} onChangeText={setName} />
          <FloatingTextInput label='* Name (Vietnamese)' value={nameVn} onChangeText={setNameVn} />
          <FloatingTextInput label='Description (English)' value={description} onChangeText={setDescription} multiline style={{ height: 84 }} />
          <FloatingTextInput label='Description (Vietnamese)' value={descriptionVn} onChangeText={setDescriptionVn} multiline style={{ height: 84 }} />
          <ThemedView flexDirection='row' flexWrap='wrap' gap={'two'}>
            <ToggleRow active={userType === '0'} label='All User' onPress={() => setUserType('0')} />
            <ToggleRow active={userType === '1'} label='New User' onPress={() => setUserType('1')} />
            <ToggleRow active={userType === '2'} label='Old User' onPress={() => setUserType('2')} />
          </ThemedView>
          {userType !== '0' ? (
            <FloatingTextInput label='User Affected At' value={userAffectedAt} onChangeText={setUserAffectedAt} placeholder='YYYY-MM-DD' />
          ) : null}
          <FloatingTextInput label='* Begin At' value={beginAt} onChangeText={setBeginAt} placeholder='YYYY-MM-DD' />
          <FloatingTextInput label='* End At' value={endAt} onChangeText={setEndAt} placeholder='YYYY-MM-DD' />
          <FloatingTextInput label='* Top-up Min' value={topUpAmountMin} onChangeText={setTopUpAmountMin} isMoney />
          <FloatingTextInput label='* Top-up Max' value={topUpAmountMax} onChangeText={setTopUpAmountMax} isMoney />
          <FloatingTextInput label='* Bonus Min' value={bonusAmountMin} onChangeText={setBonusAmountMin} isMoney />
          <FloatingTextInput label='* Bonus Max' value={bonusAmountMax} onChangeText={setBonusAmountMax} isMoney />
          <FloatingTextInput label='Total Usage Limit' value={maxTotalUsage} onChangeText={setMaxTotalUsage} keyboardType='number-pad' />
          <FloatingTextInput label='Usage Per User' value={maxUsagePerUser} onChangeText={setMaxUsagePerUser} keyboardType='number-pad' />
          <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={15}>
            Bonus Rule
          </ThemedText>
          <FloatingTextInput
            label='* Rule Min Amount'
            value={rule.minAmount}
            onChangeText={value => setRule(current => ({ ...current, minAmount: value }))}
            isMoney
          />
          <FloatingTextInput
            label='* Rule Max Amount'
            value={rule.maxAmount}
            onChangeText={value => setRule(current => ({ ...current, maxAmount: value }))}
            isMoney
          />
          <FloatingTextInput
            label='* Rule Value'
            value={rule.value}
            onChangeText={value => setRule(current => ({ ...current, value }))}
            keyboardType='decimal-pad'
          />
          <ToggleRow
            active={rule.isPercent}
            label='Rule value is percent'
            onPress={() => setRule(current => ({ ...current, isPercent: !current.isPercent }))}
          />
          <FloatingTextInput label='Blacklist User IDs' value={blacklistText} onChangeText={setBlacklistText} placeholder='123,456' />
          <FloatingTextInput label='Blacklist Reason' value={blacklistReason} onChangeText={setBlacklistReason} />
        </ThemedView>
      </ScrollView>
      <BottomButton disabled={!canSubmit} loading={mutation.isPending} onPress={submit} title='Create Campaign' />
    </ThemedView>
  );
}
