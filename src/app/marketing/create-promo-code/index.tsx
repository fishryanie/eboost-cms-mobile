import { useMutation, useQuery } from '@tanstack/react-query';
import { BottomButton, HeaderTitle, ThemedText, ThemedView } from 'components/base';
import FloatingTextInput from 'components/ui/FloatingTextInput';
import { useRouter } from 'expo-router';
import { CheckCircle2 } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView } from 'react-native';
import { FontFamily, Palette } from 'themes';
import { mhs } from 'themes/scaling';
import { ChargerSelectSheet } from './charger-select-sheet';
import { createPromoCode, fetchPromoChargerOptions } from './service';
import { getVehicleTypeLabel, VehicleTypeSelectSheet } from './vehicle-type-select-sheet';
import type { PromoChargerTarget, PromoUserTarget } from './types';

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

export default function CreatePromoCodeScreen() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [nameVn, setNameVn] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionVn, setDescriptionVn] = useState('');
  const [note, setNote] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState('');
  const [maxTotalUsage, setMaxTotalUsage] = useState('');
  const [maxUsagePerUser, setMaxUsagePerUser] = useState('');
  const [startAt, setStartAt] = useState('');
  const [expiredAt, setExpiredAt] = useState('');
  const [vehicleType, setVehicleType] = useState<'bike' | 'car' | '0'>('0');
  const [vehicleTypeSheetVisible, setVehicleTypeSheetVisible] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [monopoly, setMonopoly] = useState(false);
  const [applyUsers, setApplyUsers] = useState(false);
  const [userIds, setUserIds] = useState('');
  const [applyChargers, setApplyChargers] = useState(false);
  const [chargerTargets, setChargerTargets] = useState<PromoChargerTarget[]>([]);
  const [chargerSheetVisible, setChargerSheetVisible] = useState(false);
  const chargersQuery = useQuery({ queryFn: fetchPromoChargerOptions, queryKey: ['marketing', 'promo-chargers'] });
  const mutation = useMutation({ mutationFn: createPromoCode });
  const canSubmit = useMemo(
    () => Boolean(code.trim() && name.trim() && nameVn.trim() && discountPercent.trim() && startAt.trim() && expiredAt.trim()) && !mutation.isPending,
    [code, discountPercent, expiredAt, mutation.isPending, name, nameVn, startAt],
  );
  const userTargets = useMemo<PromoUserTarget[]>(
    () =>
      userIds
        .split(',')
        .map(user => user.trim())
        .filter(Boolean)
        .map(user => ({ isBlocked: false, user: `/api/users/${user.replace(/^\/?api\/users\//, '')}` })),
    [userIds],
  );
  const chargerInputValue = useMemo(() => {
    if (!chargerTargets.length) return '';
    if (chargerTargets.length === 1) return chargerTargets[0].boxUniqueId;
    return `${chargerTargets.length} chargers selected`;
  }, [chargerTargets]);

  function toggleCharger(uniqueId: string, nextVehicleType: 'bike' | 'car') {
    setChargerTargets(current => {
      if (current.some(item => item.boxUniqueId === uniqueId)) {
        return current.filter(item => item.boxUniqueId !== uniqueId);
      }
      return [...current, { boxUniqueId: uniqueId, isBlocked: false, vehicleType: nextVehicleType }];
    });
  }

  async function submit() {
    if (!canSubmit) {
      Alert.alert('Missing information', 'Please fill promo code, name, discount, start date, and expiry date.');
      return;
    }

    try {
      const response = await mutation.mutateAsync({
        applyChargers,
        applyUsers,
        chargerTargets,
        code,
        description,
        descriptionVn,
        discountPercent,
        enabled,
        expiredAt,
        maxDiscountAmount,
        maxTotalUsage,
        maxUsagePerUser,
        monopoly,
        name,
        nameVn,
        note,
        startAt,
        userTargets,
        vehicleType,
        visible,
      });
      Alert.alert('Promo code created', `Created ${response.code || code.trim()}.`, [{ text: 'OK', onPress: () => router.back() }]);
    } catch (error) {
      Alert.alert('Create failed', error instanceof Error ? error.message : 'Please try again.');
    }
  }

  return (
    <ThemedView backgroundColor={Palette.surfaceBase} flex={1}>
      <HeaderTitle title='Create Promo Code' />
      <ScrollView contentContainerStyle={{ padding: mhs(16), paddingBottom: 112 }} keyboardShouldPersistTaps='handled'>
        <ThemedView gap={'four'}>
          <ThemedText color={Palette.textSecondary} fontSize={14} lineHeight={20}>
            Create a charging promotion code in disabled approval state.
          </ThemedText>
          <FloatingTextInput label='* Code' value={code} onChangeText={setCode} autoCapitalize='characters' />
          <FloatingTextInput label='* Name (English)' value={name} onChangeText={setName} />
          <FloatingTextInput label='* Name (Vietnamese)' value={nameVn} onChangeText={setNameVn} />
          <FloatingTextInput label='Description (English)' value={description} onChangeText={setDescription} multiline style={{ height: 84 }} />
          <FloatingTextInput label='Description (Vietnamese)' value={descriptionVn} onChangeText={setDescriptionVn} multiline style={{ height: 84 }} />
          <FloatingTextInput label='Notes' value={note} onChangeText={setNote} multiline style={{ height: 84 }} />
          <Pressable onPress={() => setVehicleTypeSheetVisible(true)}>
            <ThemedView pointerEvents='none'>
              <FloatingTextInput label='Vehicle Type' value={getVehicleTypeLabel(vehicleType)} editable={false} placeholder='Select vehicle type' />
            </ThemedView>
          </Pressable>
          <FloatingTextInput label='* Discount Percent' value={discountPercent} onChangeText={setDiscountPercent} keyboardType='decimal-pad' />
          <FloatingTextInput label='Max Discount Amount' value={maxDiscountAmount} onChangeText={setMaxDiscountAmount} isMoney />
          <FloatingTextInput label='Max Total Usage (empty = unlimited)' value={maxTotalUsage} onChangeText={setMaxTotalUsage} keyboardType='number-pad' />
          <FloatingTextInput
            label='Max Usage Per User (empty = unlimited)'
            value={maxUsagePerUser}
            onChangeText={setMaxUsagePerUser}
            keyboardType='number-pad'
          />
          <FloatingTextInput label='* Start At' value={startAt} onChangeText={setStartAt} placeholder='YYYY-MM-DD' />
          <FloatingTextInput label='* Expired At' value={expiredAt} onChangeText={setExpiredAt} placeholder='YYYY-MM-DD' />
          <ThemedView flexDirection='row' flexWrap='wrap' gap={'two'}>
            <ToggleRow active={enabled} label='Enabled' onPress={() => setEnabled(value => !value)} />
            <ToggleRow active={visible} label='Visible' onPress={() => setVisible(value => !value)} />
            <ToggleRow active={monopoly} label='Monopoly' onPress={() => setMonopoly(value => !value)} />
          </ThemedView>
          <ToggleRow active={applyUsers} label='Apply specific users' onPress={() => setApplyUsers(value => !value)} />
          {applyUsers ? <FloatingTextInput label='User IDs' value={userIds} onChangeText={setUserIds} placeholder='123,456' /> : null}
          <ToggleRow active={applyChargers} label='Apply specific chargers' onPress={() => setApplyChargers(value => !value)} />
          {applyChargers ? (
            <ThemedView gap={'two'}>
              <Pressable onPress={() => setChargerSheetVisible(true)}>
                <ThemedView pointerEvents='none'>
                  <FloatingTextInput label='Chargers' value={chargerInputValue} editable={false} placeholder='Select chargers' />
                </ThemedView>
              </Pressable>
              {chargerTargets.length ? (
                <ThemedText color={Palette.textSecondary} fontSize={12} lineHeight={18}>
                  {chargerTargets.map(item => item.boxUniqueId).join(', ')}
                </ThemedText>
              ) : null}
            </ThemedView>
          ) : null}
        </ThemedView>
      </ScrollView>
      <BottomButton disabled={!canSubmit} loading={mutation.isPending} onPress={submit} title='Create Promo Code' />
      <ChargerSelectSheet
        chargers={chargersQuery.data || []}
        loading={chargersQuery.isLoading}
        onClose={() => setChargerSheetVisible(false)}
        onToggle={toggleCharger}
        selectedTargets={chargerTargets}
        visible={chargerSheetVisible}
      />
      <VehicleTypeSelectSheet
        onClose={() => setVehicleTypeSheetVisible(false)}
        onSelect={setVehicleType}
        selectedValue={vehicleType}
        visible={vehicleTypeSheetVisible}
      />
    </ThemedView>
  );
}
