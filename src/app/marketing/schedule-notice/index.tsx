import { useMutation } from '@tanstack/react-query';
import { BottomButton, HeaderTitle, ThemedText, ThemedView } from 'components/base';
import FloatingTextInput from 'components/ui/FloatingTextInput';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import { Palette } from 'themes';
import { mhs } from 'themes/scaling';
import { scheduleNotice } from './service';

export default function ScheduleNoticeScreen() {
  const router = useRouter();
  const [templateName, setTemplateName] = useState('');
  const [nameVn, setNameVn] = useState('');
  const [target, setTarget] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [titleVn, setTitleVn] = useState('');
  const [messageEn, setMessageEn] = useState('');
  const [messageVn, setMessageVn] = useState('');
  const [contentEn, setContentEn] = useState('');
  const [contentVn, setContentVn] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionVn, setDescriptionVn] = useState('');
  const [version, setVersion] = useState('');
  const mutation = useMutation({ mutationFn: scheduleNotice });
  const canSubmit = useMemo(
    () =>
      Boolean(
        templateName.trim() &&
        nameVn.trim() &&
        target.trim() &&
        scheduledAt.trim() &&
        titleEn.trim() &&
        titleVn.trim() &&
        messageEn.trim() &&
        messageVn.trim() &&
        contentEn.trim() &&
        contentVn.trim(),
      ) && !mutation.isPending,
    [contentEn, contentVn, messageEn, messageVn, mutation.isPending, nameVn, scheduledAt, target, templateName, titleEn, titleVn],
  );

  async function submit() {
    if (!canSubmit) {
      Alert.alert('Missing information', 'Please fill schedule, recipient, title, and message.');
      return;
    }

    try {
      await mutation.mutateAsync({
        contentEn,
        contentVn,
        description,
        descriptionVn,
        messageEn,
        messageVn,
        nameVn,
        scheduledAt,
        target,
        templateName,
        titleEn,
        titleVn,
        version,
      });
      Alert.alert('Notice scheduled', 'Schedule notice was created successfully.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (error) {
      Alert.alert('Schedule failed', error instanceof Error ? error.message : 'Please try again.');
    }
  }

  return (
    <ThemedView backgroundColor={Palette.surfaceBase} flex={1}>
      <HeaderTitle title='Schedule Notice' />
      <ScrollView contentContainerStyle={{ padding: mhs(16), paddingBottom: 112 }} keyboardShouldPersistTaps='handled'>
        <ThemedView gap={'four'}>
          <ThemedText color={Palette.textSecondary} fontSize={14} lineHeight={20}>
            Create a notification template and schedule its delivery.
          </ThemedText>
          <FloatingTextInput label='* Name (English)' value={templateName} onChangeText={setTemplateName} />
          <FloatingTextInput label='* Name (Vietnamese)' value={nameVn} onChangeText={setNameVn} />
          <FloatingTextInput label='* Recipient Topic/User IDs' value={target} onChangeText={setTarget} placeholder='global or 123,456' autoCapitalize='none' />
          <FloatingTextInput label='* Scheduled At' value={scheduledAt} onChangeText={setScheduledAt} placeholder='DD-MM-YYYY HH:mm:ss' />
          <FloatingTextInput label='* Title (English)' value={titleEn} onChangeText={setTitleEn} />
          <FloatingTextInput label='* Title (Vietnamese)' value={titleVn} onChangeText={setTitleVn} />
          <FloatingTextInput label='* Message (English)' value={messageEn} onChangeText={setMessageEn} multiline style={{ height: 88 }} />
          <FloatingTextInput label='* Message (Vietnamese)' value={messageVn} onChangeText={setMessageVn} multiline style={{ height: 88 }} />
          <FloatingTextInput label='Description (English)' value={description} onChangeText={setDescription} multiline style={{ height: 88 }} />
          <FloatingTextInput label='Description (Vietnamese)' value={descriptionVn} onChangeText={setDescriptionVn} multiline style={{ height: 88 }} />
          <FloatingTextInput label='Version' value={version} onChangeText={setVersion} />
          <FloatingTextInput label='* Content (English)' value={contentEn} onChangeText={setContentEn} multiline style={{ height: 104 }} />
          <FloatingTextInput label='* Content (Vietnamese)' value={contentVn} onChangeText={setContentVn} multiline style={{ height: 104 }} />
        </ThemedView>
      </ScrollView>
      <BottomButton disabled={!canSubmit} loading={mutation.isPending} onPress={submit} title='Schedule Notice' />
    </ThemedView>
  );
}
