import { useMutation } from '@tanstack/react-query';
import { BottomButton, HeaderTitle, ThemedText, ThemedView } from 'components/base';
import FloatingTextInput from 'components/ui/FloatingTextInput';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView } from 'react-native';
import { FontFamily, Palette } from 'themes';
import { mhs } from 'themes/scaling';
import { createNoticeDraft } from './service';
import type { NotificationImageAsset } from './types';

export default function NoticeDraftsScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [nameVn, setNameVn] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [titleVn, setTitleVn] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionVn, setDescriptionVn] = useState('');
  const [messageEn, setMessageEn] = useState('');
  const [messageVn, setMessageVn] = useState('');
  const [contentEn, setContentEn] = useState('');
  const [contentVn, setContentVn] = useState('');
  const [version, setVersion] = useState('');
  const [image, setImage] = useState<NotificationImageAsset | null>(null);
  const mutation = useMutation({ mutationFn: createNoticeDraft });
  const canSubmit = useMemo(
    () =>
      Boolean(
        name.trim() && nameVn.trim() && titleEn.trim() && titleVn.trim() && messageEn.trim() && messageVn.trim() && contentEn.trim() && contentVn.trim(),
      ) && !mutation.isPending,
    [contentEn, contentVn, messageEn, messageVn, mutation.isPending, name, nameVn, titleEn, titleVn],
  );

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.82 });
    if (!result.canceled) {
      const asset = result.assets[0];
      setImage({ fileName: asset.fileName, mimeType: asset.mimeType, uri: asset.uri });
    }
  }

  async function submit() {
    if (!canSubmit) {
      Alert.alert('Missing information', 'Please fill draft name, title, and message.');
      return;
    }

    try {
      await mutation.mutateAsync({ contentEn, contentVn, description, descriptionVn, image, messageEn, messageVn, name, nameVn, titleEn, titleVn, version });
      Alert.alert('Draft saved', 'Notice draft was saved successfully.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (error) {
      Alert.alert('Save failed', error instanceof Error ? error.message : 'Please try again.');
    }
  }

  return (
    <ThemedView backgroundColor={Palette.surfaceBase} flex={1}>
      <HeaderTitle title='Notice Drafts' />
      <ScrollView contentContainerStyle={{ padding: mhs(16), paddingBottom: 112 }} keyboardShouldPersistTaps='handled'>
        <ThemedView gap={'four'}>
          <ThemedText color={Palette.textSecondary} fontSize={14} lineHeight={20}>
            Save a reusable notice message template.
          </ThemedText>
          <Pressable onPress={pickImage}>
            <ThemedView
              alignItems='center'
              backgroundColor={Palette.surfaceMuted}
              borderColor={Palette.borderSubtle}
              borderRadius={18}
              borderStyle='dashed'
              borderWidth={1}
              minHeight={78}
              justifyContent='center'
              padding={'four'}>
              <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={14}>
                {image ? image.fileName || 'Notification image selected' : 'Upload template image'}
              </ThemedText>
            </ThemedView>
          </Pressable>
          <FloatingTextInput label='* Name (English)' value={name} onChangeText={setName} />
          <FloatingTextInput label='* Name (Vietnamese)' value={nameVn} onChangeText={setNameVn} />
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
      <BottomButton disabled={!canSubmit} loading={mutation.isPending} onPress={submit} title='Save Draft' />
    </ThemedView>
  );
}
