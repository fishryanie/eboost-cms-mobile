import { useMutation, useQuery } from '@tanstack/react-query';
import { BottomButton, HeaderTitle, ThemedText, ThemedView } from 'components/base';
import FloatingTextInput from 'components/ui/FloatingTextInput';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { CheckCircle2 } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView } from 'react-native';
import { FontFamily, Palette } from 'themes';
import { mhs } from 'themes/scaling';
import { fetchNotificationTopics, sendPushNotice } from './service';
import { TopicSelectSheet } from './topic-select-sheet';
import type { NotificationImageAsset, PushNoticeMode } from './types';

function ModeOption({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <ThemedView
        alignItems='center'
        backgroundColor={active ? Palette.accent : Palette.surfaceMuted}
        borderRadius={16}
        flexDirection='row'
        gap={'two'}
        justifyContent='center'
        minHeight={42}>
        {active ? <CheckCircle2 color='#FFFFFF' size={16} /> : null}
        <ThemedText color={active ? '#FFFFFF' : Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={14}>
          {label}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export default function PushNoticeScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<PushNoticeMode>('topic');
  const [target, setTarget] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [titleVn, setTitleVn] = useState('');
  const [messageEn, setMessageEn] = useState('');
  const [messageVn, setMessageVn] = useState('');
  const [contentEn, setContentEn] = useState('');
  const [contentVn, setContentVn] = useState('');
  const [image, setImage] = useState<NotificationImageAsset | null>(null);
  const [topicSheetVisible, setTopicSheetVisible] = useState(false);
  const topicsQuery = useQuery({ queryFn: fetchNotificationTopics, queryKey: ['marketing', 'notification-topics'] });
  const mutation = useMutation({ mutationFn: sendPushNotice });
  const canSubmit = useMemo(
    () => Boolean(target.trim() && titleEn.trim() && titleVn.trim() && messageEn.trim() && messageVn.trim()) && !mutation.isPending,
    [messageEn, messageVn, mutation.isPending, target, titleEn, titleVn],
  );
  const topicInputValue = useMemo(() => {
    const selectedTopic = (topicsQuery.data || []).find(topic => topic.topic === target);
    if (!selectedTopic) return target;
    return `${selectedTopic.name} (${selectedTopic.topic})`;
  }, [target, topicsQuery.data]);

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.82 });
    if (!result.canceled) {
      const asset = result.assets[0];
      setImage({ fileName: asset.fileName, mimeType: asset.mimeType, uri: asset.uri });
    }
  }

  async function submit() {
    if (!canSubmit) {
      Alert.alert('Missing information', 'Please fill target, title, and message.');
      return;
    }

    try {
      await mutation.mutateAsync({ contentEn, contentVn, image, messageEn, messageVn, mode, target, titleEn, titleVn });
      Alert.alert('Notice sent', 'Push notice was sent successfully.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (error) {
      Alert.alert('Send failed', error instanceof Error ? error.message : 'Please try again.');
    }
  }

  return (
    <ThemedView backgroundColor={Palette.surfaceBase} flex={1}>
      <HeaderTitle title='Push Notice' />
      <ScrollView contentContainerStyle={{ padding: mhs(16), paddingBottom: 112 }} keyboardShouldPersistTaps='handled'>
        <ThemedView gap={'five'}>
          <ThemedText color={Palette.textSecondary} fontSize={14} lineHeight={20}>
            Send one notification immediately to a selected topic or specific user IDs.
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
                {image ? image.fileName || 'Notification image selected' : 'Upload notification image'}
              </ThemedText>
              <ThemedText color={Palette.textSecondary} fontSize={12} marginTop={4}>
                Optional image sent as image_path/image_url
              </ThemedText>
            </ThemedView>
          </Pressable>
          <ThemedView flexDirection='row' gap={'three'}>
            <ThemedView flex={1}>
              <ModeOption active={mode === 'topic'} label='Topic' onPress={() => setMode('topic')} />
            </ThemedView>
            <ThemedView flex={1}>
              <ModeOption active={mode === 'user'} label='User' onPress={() => setMode('user')} />
            </ThemedView>
          </ThemedView>
          {mode === 'topic' ? (
            <Pressable onPress={() => setTopicSheetVisible(true)}>
              <ThemedView pointerEvents='none'>
                <FloatingTextInput label='* Topic' value={topicInputValue} onChangeText={setTarget} editable={false} placeholder='Select topic' />
              </ThemedView>
            </Pressable>
          ) : (
            <FloatingTextInput label='* User IDs' value={target} onChangeText={setTarget} placeholder='123,456' autoCapitalize='none' />
          )}
          <FloatingTextInput label='* Title (English)' value={titleEn} onChangeText={setTitleEn} />
          <FloatingTextInput label='* Title (Vietnamese)' value={titleVn} onChangeText={setTitleVn} />
          <FloatingTextInput label='* Message (English)' value={messageEn} onChangeText={setMessageEn} multiline style={{ height: 88 }} />
          <FloatingTextInput label='* Message (Vietnamese)' value={messageVn} onChangeText={setMessageVn} multiline style={{ height: 88 }} />
          <FloatingTextInput label='Content (English)' value={contentEn} onChangeText={setContentEn} multiline style={{ height: 104 }} />
          <FloatingTextInput label='Content (Vietnamese)' value={contentVn} onChangeText={setContentVn} multiline style={{ height: 104 }} />
        </ThemedView>
      </ScrollView>
      <BottomButton disabled={!canSubmit} loading={mutation.isPending} onPress={submit} title='Send Notice' />
      <TopicSelectSheet
        loading={topicsQuery.isLoading}
        onClose={() => setTopicSheetVisible(false)}
        onSelect={topic => setTarget(topic.topic)}
        selectedTopic={target}
        topics={topicsQuery.data || []}
        visible={topicSheetVisible}
      />
    </ThemedView>
  );
}
