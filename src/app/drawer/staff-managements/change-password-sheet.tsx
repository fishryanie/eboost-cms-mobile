import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff, Key, AlertCircle, Copy, Check } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';
import * as Clipboard from 'expo-clipboard';

import { ThemedText, ThemedView } from 'components/base';
import { AppButton } from 'components/ui';
import { FontFamily, Palette } from 'themes';
import { mhs } from 'themes/scaling';
import { staffKeys, updateStaffPassword, type StaffMember } from './staff-data';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Request failed. Please try again.';
}

export function ChangePasswordSheet({ member, onClose, visible }: { member: StaffMember | null; onClose: () => void; visible: boolean }) {
  const ref = useRef<BottomSheetModal>(null);
  const isPresented = useRef(false);
  const queryClient = useQueryClient();
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      setPassword('');
      setStep(1);
      ref.current?.present();
      isPresented.current = true;
      return;
    }
    if (isPresented.current) {
      ref.current?.dismiss();
      isPresented.current = false;
    }
  }, [member, visible]);

  const handleClose = () => {
    isPresented.current = false;
    onClose();
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!member) throw new Error('Missing staff account.');
      if (password.length < 6) throw new Error('Password must be at least 6 characters.');
      return updateStaffPassword(member.id, password);
    },
    onError: error => Alert.alert('Change Password', getErrorMessage(error)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: staffKeys.all });
      setStep(3); // Success step
    },
  });

  const renderBackdrop = useCallback((props: any) => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />, []);

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let pass = '';
    for (let i = 0; i < 12; i++) {
      pass += chars[Math.floor(Math.random() * chars.length)];
    }
    // Ensure at least one uppercase, one lowercase, one number, one special char
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    const lower = 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    const num = '0123456789'[Math.floor(Math.random() * 10)];
    const special = '!@#$%^&*'[Math.floor(Math.random() * 8)];
    pass = pass.slice(0, 8) + upper + lower + num + special;
    // shuffle
    pass = pass
      .split('')
      .sort(() => 0.5 - Math.random())
      .join('');
    setPassword(pass);
  };

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(password);
    Alert.alert('Copied', 'Password copied to clipboard.');
  };

  return (
    <BottomSheetModal
      backdropComponent={renderBackdrop}
      enableDynamicSizing
      keyboardBehavior='interactive'
      keyboardBlurBehavior='restore'
      onDismiss={handleClose}
      ref={ref}>
      <BottomSheetScrollView contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps='handled'>
        <ThemedView alignItems='center' flexDirection='row' gap={'three'}>
          <ThemedView flex={1} gap={'half'}>
            <ThemedText color={Palette.accent} fontFamily={FontFamily.bold} fontSize={12} lineHeight={16} textTransform='uppercase'>
              Staff managements
            </ThemedText>
            <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={22} lineHeight={28}>
              Change Password
            </ThemedText>
          </ThemedView>
        </ThemedView>

        {step === 1 && (
          <>
            <ThemedView style={styles.inputContainer}>
              <BottomSheetTextInput
                onChangeText={setPassword}
                placeholder='New password'
                placeholderTextColor={Palette.textTertiary}
                secureTextEntry={!isPasswordVisible}
                style={styles.inputWithIcon}
                value={password}
              />
              <Pressable onPress={() => setIsPasswordVisible(v => !v)} style={styles.eyeIcon}>
                {isPasswordVisible ? <EyeOff color={Palette.textTertiary} size={20} /> : <Eye color={Palette.textTertiary} size={20} />}
              </Pressable>
            </ThemedView>
            <Pressable accessibilityRole='button' onPress={generatePassword} style={({ pressed }) => [styles.generateButton, pressed && styles.pressed]}>
              <Key color={Palette.accent} size={16} />
              <ThemedText color={Palette.accent} fontFamily={FontFamily.semibold} fontSize={14} lineHeight={20}>
                Generate secure password
              </ThemedText>
            </Pressable>
            <AppButton
              block
              label='Next'
              onPress={() => {
                if (password.length < 6) {
                  Alert.alert('Error', 'Password must be at least 6 characters.');
                  return;
                }
                setStep(2);
              }}
            />
          </>
        )}

        {step === 2 && member && (
          <ThemedView gap={'three'}>
            <ThemedView style={styles.alertBox}>
              <AlertCircle color='#F59E0B' size={20} />
              <ThemedText color={'#B45309'} fontFamily={FontFamily.medium} fontSize={14} lineHeight={20}>
                Please double check information before confirming.
              </ThemedText>
            </ThemedView>

            <ThemedView backgroundColor={Palette.surfaceMuted} borderRadius={'large'} gap={'one'} padding={'three'}>
              <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={15} lineHeight={20} numberOfLines={1}>
                {member.name || member.username}
              </ThemedText>
              <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={13} lineHeight={18} numberOfLines={1}>
                {member.email}
              </ThemedText>
              <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={13} lineHeight={18} numberOfLines={1}>
                ID: {member.id}
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.passwordBox}>
              <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={14} lineHeight={20}>
                New password will be:
              </ThemedText>
              <ThemedView alignItems='center' flexDirection='row' gap={'two'}>
                <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={18} lineHeight={24}>
                  {password}
                </ThemedText>
                <Pressable hitSlop={12} onPress={copyToClipboard} style={({ pressed }) => [pressed && styles.pressed]}>
                  <Copy color={Palette.accent} size={18} />
                </Pressable>
              </ThemedView>
            </ThemedView>

            <ThemedView style={styles.notesBox}>
              {[
                'Please copy and save this password safely before confirming.',
                'The system will update the password immediately after confirmation.',
                'The user will need the new password to log in.',
              ].map((note, index) => (
                <ThemedView key={index} flexDirection='row' gap={'two'}>
                  <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.bold} fontSize={14} lineHeight={20}>
                    •
                  </ThemedText>
                  <ThemedText color={Palette.textSecondary} flex={1} fontFamily={FontFamily.medium} fontSize={14} lineHeight={20}>
                    {note}
                  </ThemedText>
                </ThemedView>
              ))}
            </ThemedView>

            <ThemedView flexDirection='row' gap={'three'}>
              <AppButton buttonColor={Palette.surfaceMuted} label='Back' onPress={() => setStep(1)} style={{ flex: 1 }} textColor={Palette.textPrimary} />
              <AppButton
                icon={<Check color='#FFFFFF' size={18} />}
                label='Save'
                loading={mutation.isPending}
                onPress={() => mutation.mutate()}
                style={{ flex: 1 }}
              />
            </ThemedView>
          </ThemedView>
        )}

        {step === 3 && (
          <ThemedView alignItems='center' gap={'four'} paddingVertical={'four'}>
            <ThemedView alignItems='center' backgroundColor='#E8F4EF' borderRadius={'pill'} height={64} justifyContent='center' width={64}>
              <Check color={Palette.accent} size={32} />
            </ThemedView>
            <ThemedView alignItems='center' gap={'two'}>
              <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={20} lineHeight={28}>
                Password Changed!
              </ThemedText>
              <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={15} lineHeight={22} textAlign='center'>
                The password for {member?.name || member?.username} has been successfully updated.
              </ThemedText>
            </ThemedView>
            <AppButton block label='Back to list admin' onPress={handleClose} />
          </ThemedView>
        )}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  alertBox: {
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
    borderRadius: mhs(8),
    borderWidth: 1,
    flexDirection: 'row',
    gap: mhs(8),
    padding: mhs(12),
  },
  generateButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#E8F4EF',
    borderRadius: mhs(16),
    flexDirection: 'row',
    gap: mhs(6),
    paddingHorizontal: mhs(12),
    paddingVertical: mhs(8),
  },
  input: {
    backgroundColor: Palette.surfaceMuted,
    borderColor: Palette.borderSubtle,
    borderRadius: mhs(16),
    borderWidth: 1,
    color: Palette.textPrimary,
    fontFamily: FontFamily.medium,
    fontSize: 15,
    minHeight: 48,
    paddingHorizontal: mhs(14),
  },
  inputContainer: {
    alignItems: 'center',
    backgroundColor: Palette.surfaceMuted,
    borderColor: Palette.borderSubtle,
    borderRadius: mhs(16),
    borderWidth: 1,
    flexDirection: 'row',
  },
  inputWithIcon: {
    color: Palette.textPrimary,
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: 15,
    minHeight: 48,
    paddingHorizontal: mhs(14),
  },
  eyeIcon: {
    padding: mhs(14),
  },
  notesBox: {
    backgroundColor: Palette.surfaceMuted,
    borderRadius: mhs(12),
    gap: mhs(8),
    padding: mhs(16),
  },
  passwordBox: {
    alignItems: 'center',
    backgroundColor: '#F8FAF9',
    borderColor: '#D1EAE0',
    borderRadius: mhs(12),
    borderStyle: 'dashed',
    borderWidth: 1,
    gap: mhs(8),
    padding: mhs(16),
  },
  pressed: {
    opacity: 0.72,
  },
  sheetContent: {
    gap: mhs(16),
    padding: mhs(16),
    paddingBottom: mhs(34),
  },
});
