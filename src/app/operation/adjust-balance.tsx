import { Stack, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';

import { ThemedText, ThemedView } from 'components/base';
import { BottomButton } from 'components/base/BottomButton';
import { AppScreen } from 'components/ui';
import FloatingTextInput from 'components/ui/FloatingTextInput';
import { UserCard } from 'shared/users/components/user-card';
import { useInfiniteUsers } from 'shared/users/hooks';
import { FontFamily, Palette } from 'themes';
import { mhs } from 'themes/scaling';

import { HeaderTitle } from 'components/base/HeaderTitle';

import SegmentedControl from 'components/organisms/segmented-control';

export default function AdjustBalanceScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // User search state
  const [queryInput, setQueryInput] = useState('');
  const [query, setQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const usersQuery = useInfiniteUsers(query);
  const users = useMemo(() => usersQuery.data?.pages.flatMap(page => page.items) || [], [usersQuery.data]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setQuery(queryInput.trim());
      if (queryInput.trim() === '') {
        setSelectedUser(null);
      }
    }, 350);
    return () => clearTimeout(timeout);
  }, [queryInput]);

  // Form state
  const [type, setType] = useState('plus');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const onNext = () => {
    // Proceed to next step
  };

  return (
    <ThemedView flex={1} backgroundColor={Palette.surfaceBase}>
      <HeaderTitle title='Adjust Balance' />

      {/* Stepper Header */}
      <ThemedView style={styles.stepperContainer}>
        <ThemedView style={styles.stepWrapper}>
          <ThemedView style={[styles.stepCircle, step >= 1 ? styles.stepCircleActive : undefined]}>
            <ThemedText style={[styles.stepCircleText, step >= 1 ? styles.stepCircleTextActive : undefined]}>1</ThemedText>
          </ThemedView>
          <ThemedText style={[styles.stepLabel, step >= 1 ? styles.stepLabelActive : undefined]}>Adjustment Details</ThemedText>
        </ThemedView>
        <ThemedView style={[styles.stepLine, step >= 2 ? styles.stepLineActive : undefined]} />
        <ThemedView style={styles.stepWrapper}>
          <ThemedView style={[styles.stepCircle, step >= 2 ? styles.stepCircleActive : undefined]}>
            <ThemedText style={[styles.stepCircleText, step >= 2 ? styles.stepCircleTextActive : undefined]}>2</ThemedText>
          </ThemedView>
          <ThemedText style={[styles.stepLabel, step >= 2 ? styles.stepLabelActive : undefined]}>Confirmation</ThemedText>
        </ThemedView>
        <ThemedView style={[styles.stepLine, step >= 3 ? styles.stepLineActive : undefined]} />
        <ThemedView style={styles.stepWrapper}>
          <ThemedView style={[styles.stepCircle, step >= 3 ? styles.stepCircleActive : undefined]}>
            <ThemedText style={[styles.stepCircleText, step >= 3 ? styles.stepCircleTextActive : undefined]}>3</ThemedText>
          </ThemedView>
          <ThemedText style={[styles.stepLabel, step >= 3 ? styles.stepLabelActive : undefined]}>Finish</ThemedText>
        </ThemedView>
      </ThemedView>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps='handled'>
        {step === 1 && (
          <ThemedView gap={'six'}>
            {/* User Search */}
            <ThemedView gap={'two'}>
              <FloatingTextInput
                label='* User'
                autoCapitalize='none'
                autoCorrect={false}
                onChangeText={setQueryInput}
                placeholder='Search user id, name, email, phone'
                value={queryInput}
              />

              {usersQuery.isLoading && query !== '' ? <ActivityIndicator color={Palette.accent} style={{ marginTop: mhs(8) }} /> : null}

              {/* Show selected user, or results to pick from */}
              {selectedUser ? (
                <ThemedView style={styles.selectedUserContainer}>
                  <UserCard user={selectedUser} onPress={() => {}} />
                  <Pressable onPress={() => setSelectedUser(null)} style={styles.clearUserBtn}>
                    <ThemedText color={Palette.accent} fontFamily={FontFamily.medium} fontSize={12}>
                      Change
                    </ThemedText>
                  </Pressable>
                </ThemedView>
              ) : query !== '' && users.length > 0 ? (
                <ThemedView gap={'two'}>
                  {users.slice(0, 3).map((u: any) => (
                    <Pressable
                      key={u.id}
                      onPress={() => {
                        setSelectedUser(u);
                        setQueryInput(u.email || u.name || String(u.id));
                      }}>
                      <UserCard user={u} onPress={() => {}} />
                    </Pressable>
                  ))}
                </ThemedView>
              ) : query !== '' && !usersQuery.isLoading && users.length === 0 ? (
                <ThemedText color={Palette.textSecondary} fontSize={13}>
                  No user found.
                </ThemedText>
              ) : null}
            </ThemedView>

            {/* Transaction Type */}
            <ThemedView gap={'two'}>
              <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.regular} fontSize={14}>
                <ThemedText color={Palette.danger} fontFamily={FontFamily.regular} fontSize={14}>
                  *{' '}
                </ThemedText>
                Transaction type
              </ThemedText>
              <SegmentedControl
                activeSegmentBackgroundColor={Palette.accent}
                currentIndex={type === 'plus' ? 0 : 1}
                onChange={index => setType(index === 0 ? 'plus' : 'deduct')}>
                <ThemedText color={type === 'plus' ? '#FFF' : Palette.textPrimary} fontFamily={FontFamily.medium} textAlign='center'>
                  Plus
                </ThemedText>
                <ThemedText color={type === 'deduct' ? '#FFF' : Palette.textPrimary} fontFamily={FontFamily.medium} textAlign='center'>
                  Deduct
                </ThemedText>
              </SegmentedControl>
            </ThemedView>

            {/* Transfer Amount */}
            <FloatingTextInput label='* Transfer amount' keyboardType='numeric' onChangeText={setAmount} placeholder='Enter amount' value={amount} />

            {/* Reason */}
            <FloatingTextInput label='* Reason' onChangeText={setReason} placeholder='Enter reason for this transaction' value={reason} />
          </ThemedView>
        )}
      </ScrollView>
      {step === 1 && <BottomButton disabled={!selectedUser || !amount || !reason} onPress={onNext} title='Next' />}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: mhs(20),
    paddingTop: mhs(24),
    paddingBottom: mhs(40),
  },
  input: {
    borderColor: '#D0D5DD',
    borderRadius: mhs(8),
    borderWidth: 1,
    color: Palette.textPrimary,
    fontFamily: FontFamily.regular,
    fontSize: 14,
    height: mhs(44),
    paddingHorizontal: mhs(12),
  },
  textArea: {
    borderColor: '#D0D5DD',
    borderRadius: mhs(8),
    borderWidth: 1,
    color: Palette.textPrimary,
    fontFamily: FontFamily.regular,
    fontSize: 14,
    height: mhs(100),
    padding: mhs(12),
  },
  segmented: {
    backgroundColor: '#F2F4F7',
    borderRadius: mhs(22),
    height: mhs(44),
    padding: mhs(4),
  },
  segmentButton: {
    alignItems: 'center',
    borderRadius: mhs(18),
    flex: 1,
    justifyContent: 'center',
  },
  segmentButtonSelected: {
    backgroundColor: '#0F9F6E', // Green color from screenshot
  },
  stepperContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: mhs(20),
    paddingVertical: mhs(20),
  },
  stepWrapper: {
    alignItems: 'center',
    gap: mhs(8),
  },
  stepCircle: {
    alignItems: 'center',
    backgroundColor: '#F2F4F7',
    borderRadius: mhs(14),
    height: mhs(28),
    justifyContent: 'center',
    width: mhs(28),
  },
  stepCircleActive: {
    backgroundColor: '#0F9F6E',
  },
  stepCircleText: {
    color: '#98A2B3',
    fontFamily: FontFamily.medium,
    fontSize: 14,
  },
  stepCircleTextActive: {
    color: '#FFFFFF',
  },
  stepLabel: {
    color: '#98A2B3',
    fontFamily: FontFamily.regular,
    fontSize: 12,
  },
  stepLabelActive: {
    color: '#101828',
  },
  stepLine: {
    backgroundColor: '#E4E7EC',
    flex: 1,
    height: 1,
    marginHorizontal: mhs(8),
    marginTop: -mhs(20),
  },
  stepLineActive: {
    backgroundColor: '#0F9F6E',
  },
  selectedUserContainer: {
    position: 'relative',
  },
  clearUserBtn: {
    position: 'absolute',
    right: mhs(12),
    top: mhs(12),
  },
});
