import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Check, ImagePlus, Plus, Trash2 } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable } from 'react-native';

import { BottomButton, Switch, ThemedText, ThemedView } from 'components/base';
import AnimatedHeaderScrollViewComponent from 'components/organisms/animated-header-scrollview';
import FloatingTextInput from 'components/ui/FloatingTextInput';
import { EmptyState } from 'components/ui';
import { FontFamily, Palette } from 'themes';

import type { CmsEditorFieldConfig, CmsEditorOption, CmsPageConfig, CmsPageKey, CmsSectionConfig } from './config';
import { cmsPageConfigs } from './config';
import { deleteCmsRecord, fetchCmsCollectionRecords, fetchCmsRecord, saveCmsRecord, uploadCmsImage } from './service';
import type { CmsRecord } from './service';

type EditorMode = 'create' | 'update';
type DraftValue = boolean | number | string;
type DraftValues = Record<string, DraftValue>;
type ImageAsset = { fileName?: string | null; mimeType?: string | null; uri: string };

type ScheduleDraft = {
  activationFee: string;
  chargingFee: string;
  currentDirection: string;
  endTime: string;
  id?: number | string;
  key: string;
  parkingFee: string;
  startTime: string;
  weekday: string;
};

function getPathValue(record: CmsRecord | undefined, path: string): unknown {
  return path.split('.').reduce<unknown>((value, segment) => {
    if (!value || typeof value !== 'object') return undefined;
    return (value as Record<string, unknown>)[segment];
  }, record);
}

function firstValue(record: CmsRecord | undefined, paths: string[]) {
  for (const path of paths) {
    const value = getPathValue(record, path);
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return undefined;
}

function recordIri(record: CmsRecord | undefined, endpoint: string) {
  return String(record?.iriId || record?.['@id'] || (record?.id ? `/${endpoint}/${record.id}` : ''));
}

function recordId(record: CmsRecord | undefined) {
  if (record?.id !== undefined && record.id !== null && record.id !== '') return record.id;
  const iri = String(record?.iriId || record?.['@id'] || '');
  return iri.split('/').filter(Boolean).at(-1);
}

function valueToDraft(value: unknown): DraftValue {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return String(value);
  if (value && typeof value === 'object') {
    const candidate = value as CmsRecord;
    return String(candidate.iriId || candidate['@id'] || candidate.id || candidate.name || '');
  }
  return value === undefined || value === null ? '' : String(value);
}

function numericValue(value: DraftValue) {
  const normalized = String(value).replace(/,/g, '').trim();
  if (!normalized) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeUserIri(value: DraftValue) {
  const text = String(value).trim();
  if (!text) return null;
  if (text.startsWith('/api/users/')) return text;
  if (text.startsWith('api/users/')) return `/${text}`;
  return `/api/users/${text}`;
}

function isVisible(field: CmsEditorFieldConfig, values: DraftValues) {
  if (!field.visibleWhen) return true;
  const currentValue = String(values[field.visibleWhen.key]);
  if (field.visibleWhen.notValue !== undefined) return currentValue !== String(field.visibleWhen.notValue);
  return currentValue === String(field.visibleWhen.value);
}

function getInitialValues(fields: CmsEditorFieldConfig[], record?: CmsRecord, variant?: string) {
  const values = fields.reduce<DraftValues>((next, field) => {
    const fallbackPaths = field.key === 'userGroup' ? ['user_group'] : field.key === 'userLevel' ? ['user_level'] : [];
    const rawValue = firstValue(record, [field.key, ...fallbackPaths]);
    next[field.key] = valueToDraft(rawValue ?? field.defaultValue ?? (field.type === 'boolean' ? false : ''));
    return next;
  }, {});

  if (variant === 'reservation-policy' && record) {
    if (firstValue(record, ['user'])) values.targetType = 'user';
    else if (firstValue(record, ['userGroup', 'user_group'])) values.targetType = 'user-group';
    else if (firstValue(record, ['userLevel', 'user_level'])) values.targetType = 'user-level';
    else values.targetType = 'all';
  }

  return values;
}

function buildPayload(fields: CmsEditorFieldConfig[], values: DraftValues, variant?: string) {
  const payload = fields.reduce<Record<string, unknown>>((next, field) => {
    if (field.type === 'image' || !isVisible(field, values)) return next;
    const value = values[field.key];
    if (field.type === 'boolean') next[field.key] = Boolean(value);
    else if (field.type === 'currency' || field.type === 'number') next[field.key] = numericValue(value);
    else if (field.type === 'select' && field.options) {
      next[field.key] = field.options.find(option => String(option.value) === String(value))?.value ?? String(value ?? '').trim();
    } else next[field.key] = String(value ?? '').trim();
    return next;
  }, {});

  if (variant === 'reservation-policy') {
    const targetType = String(values.targetType || 'all');
    delete payload.targetType;
    payload.user = targetType === 'user' ? normalizeUserIri(values.user) : null;
    payload.userGroup = targetType === 'user-group' ? values.userGroup || null : null;
    payload.userLevel = targetType === 'user-level' ? values.userLevel || null : null;
  }

  if ('version' in payload && payload.version === '') payload.version = null;
  if ('userType' in payload) payload.userType = numericValue(values.userType) ?? 0;
  return payload;
}

function validateFields(fields: CmsEditorFieldConfig[], values: DraftValues) {
  return fields.find(field => field.required && isVisible(field, values) && String(values[field.key] ?? '').trim() === '');
}

function singularLabel(label: string) {
  if (label === 'Policies') return 'Policy';
  if (label === 'FAQs') return 'FAQ';
  if (label === 'Popup Ads') return 'Popup Ad';
  if (label.endsWith('ies')) return `${label.slice(0, -3)}y`;
  if (label.endsWith('s')) return label.slice(0, -1);
  return label;
}

export function CmsEditorPage({ id, mode, pageKey, sectionKey }: { id?: string; mode: EditorMode; pageKey: CmsPageKey; sectionKey: string }) {
  const config: CmsPageConfig = cmsPageConfigs[pageKey];
  const section = config?.sections.find(item => item.key === sectionKey);

  if (!config || !section?.editor) {
    return <UnavailableEditor />;
  }

  if (section.editor.variant === 'tariff' || section.editor.variant === 'opening-hours') {
    return <ScheduleProfileEditor config={config} id={id} mode={mode} section={section} />;
  }

  return <GenericCmsEditor config={config} id={id} mode={mode} section={section} />;
}

function GenericCmsEditor({ config, id, mode, section }: { config: CmsPageConfig; id?: string; mode: EditorMode; section: CmsSectionConfig }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const editor = section.editor!;
  const fields = useMemo(() => editor.fields || [], [editor.fields]);
  const recordQuery = useQuery({
    enabled: mode === 'update',
    queryFn: () => fetchCmsRecord(section.endpoint, id, section.params),
    queryKey: ['cms-editor-record', section.endpoint, id, section.params],
  });
  const [values, setValues] = useState<DraftValues>(() => getInitialValues(fields, undefined, editor.variant));
  const [image, setImage] = useState<ImageAsset>();

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (mode === 'create') {
        setValues(getInitialValues(fields, undefined, editor.variant));
        setImage(undefined);
      } else if (recordQuery.data) {
        setValues(getInitialValues(fields, recordQuery.data, editor.variant));
        setImage(undefined);
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [editor.variant, fields, mode, recordQuery.data]);

  const mutation = useMutation({
    mutationFn: async () => {
      const missingField = validateFields(fields, values);
      if (missingField) throw new Error(`${missingField.label} is required.`);

      const payload = buildPayload(fields, values, editor.variant);
      if (image && editor.imageUpload?.target === 'temporary') {
        const upload = await uploadCmsImage({ asset: image, folder: editor.imageUpload.folder, targetId: 0 });
        payload[editor.imageUpload.resultKey || 'imageUrl'] = upload.results?.[0]?.media?.url || upload.file_path || null;
      }

      const response = await saveCmsRecord({
        data: payload,
        endpoint: section.endpoint,
        id: mode === 'update' ? id : undefined,
        method: mode === 'create' ? editor.createMethod || 'POST' : editor.updateMethod || 'PATCH',
      });

      if (image && editor.imageUpload && editor.imageUpload.target !== 'temporary') {
        const targetId = recordId(response) || id;
        if (!targetId) throw new Error('The record was saved, but its image could not be linked because the API returned no ID.');
        await uploadCmsImage({ asset: image, folder: editor.imageUpload.folder, targetId });
      }

      return response;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cms-page', section.endpoint] });
      Alert.alert(mode === 'create' ? 'Created' : 'Changes saved', `${section.label} ${mode === 'create' ? 'was created' : 'was updated'} successfully.`, [
        { text: 'Done', onPress: () => router.back() },
      ]);
    },
  });

  const groupedFields = useMemo(() => {
    const groups = new Map<string, CmsEditorFieldConfig[]>();
    fields.forEach(field => {
      const name = field.group || 'Details';
      groups.set(name, [...(groups.get(name) || []), field]);
    });
    return [...groups.entries()];
  }, [fields]);

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo access needed', 'Allow photo access to choose an image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.82 });
    if (!result.canceled) {
      const asset = result.assets[0];
      setImage({ fileName: asset.fileName, mimeType: asset.mimeType, uri: asset.uri });
    }
  }

  function submit() {
    mutation.reset();
    mutation.mutate();
  }

  const entityLabel = editor.entityLabel || singularLabel(section.label);
  const title = `${mode === 'create' ? 'Create' : 'Edit'} ${entityLabel}`;
  const initialImage = String(firstValue(recordQuery.data, section.imagePaths || ['imageUrl']) || '');

  if (recordQuery.isLoading) return <EditorLoading />;
  if (recordQuery.isError) return <EditorError message={recordQuery.error.message} onRetry={() => recordQuery.refetch()} />;

  return (
    <ThemedView backgroundColor={Palette.surfaceBase} flex={1}>
      <AnimatedHeaderScrollViewComponent
        canGoBack
        contentContainerStyle={{ backgroundColor: Palette.surfaceBase, gap: 24, paddingHorizontal: 18, paddingBottom: 128 }}
        largeHeaderTitleStyle={{ color: Palette.textPrimary, fontFamily: FontFamily.semibold, fontSize: 34 }}
        largeTitle={title}
        onBack={() => router.back()}
        showsVerticalScrollIndicator={false}
        smallHeaderTitleStyle={{ color: Palette.textPrimary, fontFamily: FontFamily.semibold }}
        subtitle={config.title}>
        <EditorIntro entityLabel={entityLabel} mode={mode} />

        {groupedFields.map(([group, groupFields]) => {
          const visibleFields = groupFields.filter(field => isVisible(field, values));
          if (!visibleFields.length) return null;
          return (
            <EditorSection key={group} title={group}>
              {visibleFields.map(field => (
                <EditorField
                  accentColor={config.accentColor}
                  field={field}
                  imageUri={image?.uri || initialImage}
                  key={field.key}
                  onChange={value => setValues(current => ({ ...current, [field.key]: value }))}
                  onPickImage={pickImage}
                  value={values[field.key]}
                />
              ))}
            </EditorSection>
          );
        })}

        {mutation.isError ? <InlineError message={mutation.error.message} /> : null}
      </AnimatedHeaderScrollViewComponent>
      <BottomButton
        btnColor={config.accentColor}
        disabled={mutation.isPending}
        loading={mutation.isPending}
        onPress={submit}
        title={mode === 'create' ? 'Create' : 'Save Changes'}
      />
    </ThemedView>
  );
}

function ScheduleProfileEditor({ config, id, mode, section }: { config: CmsPageConfig; id?: string; mode: EditorMode; section: CmsSectionConfig }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isTariff = section.editor?.variant === 'tariff';
  const scheduleKey = isTariff ? 'portFeeSchedules' : 'stationOpenTimes';
  const scheduleEndpoint = isTariff ? 'api/port_fee_schedules' : 'api/station_open_times';
  const recordQuery = useQuery({
    enabled: mode === 'update' && Boolean(id),
    queryFn: () => fetchCmsRecord(section.endpoint, id),
    queryKey: ['cms-editor-record', section.endpoint, id],
  });
  const weekdaysQuery = useQuery({
    queryFn: () => fetchCmsCollectionRecords('api/weekdays'),
    queryKey: ['cms-editor-lookup', 'api/weekdays'],
  });
  const directionsQuery = useQuery({
    enabled: isTariff,
    queryFn: () => fetchCmsCollectionRecords('api/current_directions'),
    queryKey: ['cms-editor-lookup', 'api/current_directions'],
  });
  const [name, setName] = useState('');
  const [nameVn, setNameVn] = useState('');
  const [schedules, setSchedules] = useState<ScheduleDraft[]>([]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (mode === 'create') {
        setName('');
        setNameVn('');
        setSchedules([]);
        return;
      }
      if (!recordQuery.data) return;
      setName(String(recordQuery.data.name || ''));
      setNameVn(String(recordQuery.data.nameVn || ''));
      const records = getPathValue(recordQuery.data, scheduleKey);
      setSchedules(Array.isArray(records) ? records.map((record, index) => toScheduleDraft(record as CmsRecord, index)) : []);
    });
    return () => cancelAnimationFrame(frame);
  }, [mode, recordQuery.data, scheduleKey]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!name.trim() || !nameVn.trim()) throw new Error('English and Vietnamese profile names are required.');
      if (!schedules.length) throw new Error('Add at least one schedule.');
      const invalidSchedule = schedules.find(item => !item.weekday || !item.startTime || !item.endTime || (isTariff && !item.currentDirection));
      if (invalidSchedule) throw new Error('Every schedule needs a weekday, start time, end time, and direction where applicable.');

      const profile = await saveCmsRecord({
        data: { name: name.trim(), nameVn: nameVn.trim() },
        endpoint: section.endpoint,
        id: mode === 'update' ? id : undefined,
        method: mode === 'create' ? 'POST' : 'PATCH',
      });
      const profileIri = recordIri(profile, section.endpoint) || recordIri(recordQuery.data, section.endpoint);
      if (!profileIri) throw new Error('The API did not return a profile identifier.');

      const originalRecords = getPathValue(recordQuery.data, scheduleKey);
      const originalIds = Array.isArray(originalRecords) ? originalRecords.map(item => String(recordId(item as CmsRecord) || '')).filter(Boolean) : [];
      const currentIds = schedules.map(item => String(item.id || '')).filter(Boolean);
      const removedIds = originalIds.filter(originalId => !currentIds.includes(originalId));
      const operations = schedules.map(item =>
        saveCmsRecord({
          data: schedulePayload(item, isTariff, profileIri),
          endpoint: scheduleEndpoint,
          id: item.id,
          method: item.id ? 'PATCH' : 'POST',
        }),
      );
      await Promise.all([...operations, ...removedIds.map(removedId => deleteCmsRecord(scheduleEndpoint, removedId))]);
      return profile;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['cms-page', section.endpoint] }),
        queryClient.invalidateQueries({ queryKey: ['cms-editor-record', section.endpoint, id] }),
      ]);
      Alert.alert(mode === 'create' ? 'Profile created' : 'Profile updated', 'The profile and all schedules were saved successfully.', [
        { text: 'Done', onPress: () => router.back() },
      ]);
    },
  });

  function addSchedule() {
    setSchedules(current => [
      ...current,
      {
        activationFee: '0',
        chargingFee: '0',
        currentDirection: '',
        endTime: '17:00',
        key: `new-${Date.now()}-${current.length}`,
        parkingFee: '0',
        startTime: '08:00',
        weekday: '',
      },
    ]);
  }

  function updateSchedule(key: string, patch: Partial<ScheduleDraft>) {
    setSchedules(current => current.map(item => (item.key === key ? { ...item, ...patch } : item)));
  }

  if (recordQuery.isLoading || weekdaysQuery.isLoading || directionsQuery.isLoading) return <EditorLoading />;
  if (recordQuery.isError) return <EditorError message={recordQuery.error.message} onRetry={() => recordQuery.refetch()} />;

  const title = `${mode === 'create' ? 'Create' : 'Edit'} ${isTariff ? 'Tariff' : 'Opening Hours'}`;

  return (
    <ThemedView backgroundColor={Palette.surfaceBase} flex={1}>
      <AnimatedHeaderScrollViewComponent
        canGoBack
        contentContainerStyle={{ backgroundColor: Palette.surfaceBase, gap: 24, paddingHorizontal: 18, paddingBottom: 128 }}
        largeHeaderTitleStyle={{ color: Palette.textPrimary, fontFamily: FontFamily.semibold, fontSize: 34 }}
        largeTitle={title}
        onBack={() => router.back()}
        showsVerticalScrollIndicator={false}
        smallHeaderTitleStyle={{ color: Palette.textPrimary, fontFamily: FontFamily.semibold }}
        subtitle={isTariff ? 'Port profile and fee schedules' : 'Profile and weekly opening times'}>
        <EditorSection title='Profile details'>
          <FloatingTextInput accentColor={config.accentColor} label='* Name (English)' onChangeText={setName} value={name} />
          <FloatingTextInput accentColor={config.accentColor} label='* Name (Vietnamese)' onChangeText={setNameVn} value={nameVn} />
        </EditorSection>

        <ThemedView backgroundColor='transparent' gap={'three'}>
          <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' justifyContent='space-between'>
            <ThemedView backgroundColor='transparent' flex={1} gap={3}>
              <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={12} letterSpacing={0.5} textTransform='uppercase'>
                Schedules
              </ThemedText>
              <ThemedText color={Palette.textTertiary} fontSize={12} lineHeight={16}>
                {schedules.length} {schedules.length === 1 ? 'time slot' : 'time slots'}
              </ThemedText>
            </ThemedView>
            <Pressable accessibilityLabel='Add schedule' accessibilityRole='button' onPress={addSchedule}>
              <ThemedView
                alignItems='center'
                backgroundColor={config.accentColor}
                borderRadius={'pill'}
                flexDirection='row'
                gap={'two'}
                minHeight={38}
                paddingHorizontal={'three'}>
                <Plus color='#FFFFFF' size={16} />
                <ThemedText color='#FFFFFF' fontFamily={FontFamily.semibold} fontSize={12}>
                  Add slot
                </ThemedText>
              </ThemedView>
            </Pressable>
          </ThemedView>

          {schedules.length ? (
            schedules.map((schedule, index) => (
              <ScheduleCard
                accentColor={config.accentColor}
                directions={directionsQuery.data || []}
                index={index}
                isTariff={isTariff}
                key={schedule.key}
                onChange={patch => updateSchedule(schedule.key, patch)}
                onRemove={() => setSchedules(current => current.filter(item => item.key !== schedule.key))}
                schedule={schedule}
                weekdays={weekdaysQuery.data || []}
              />
            ))
          ) : (
            <ThemedView
              alignItems='center'
              backgroundColor={Palette.surfaceMuted}
              borderColor={Palette.borderSubtle}
              borderCurve='continuous'
              borderRadius={18}
              borderWidth={1}
              gap={'two'}
              padding={'five'}>
              <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={14}>
                No schedule yet
              </ThemedText>
              <ThemedText color={Palette.textSecondary} fontSize={12} lineHeight={17} textAlign='center'>
                Add the first weekday and time range for this profile.
              </ThemedText>
            </ThemedView>
          )}
        </ThemedView>

        {mutation.isError ? <InlineError message={mutation.error.message} /> : null}
      </AnimatedHeaderScrollViewComponent>
      <BottomButton
        btnColor={config.accentColor}
        disabled={mutation.isPending}
        loading={mutation.isPending}
        onPress={() => mutation.mutate()}
        title={mode === 'create' ? 'Create Profile' : 'Save Changes'}
      />
    </ThemedView>
  );
}

function toScheduleDraft(record: CmsRecord, index: number): ScheduleDraft {
  const id = recordId(record);
  return {
    activationFee: String(record.activationFee ?? 0),
    chargingFee: String(record.chargingFee ?? 0),
    currentDirection: String(firstValue(record, ['currentDirection.iriId', 'currentDirection.@id', 'currentDirection']) || ''),
    endTime: String(record.endTime || ''),
    id,
    key: `existing-${String(id ?? index)}`,
    parkingFee: String(record.parkingFee ?? 0),
    startTime: String(record.startTime || ''),
    weekday: String(firstValue(record, ['weekday.iriId', 'weekday.@id', 'weekday']) || ''),
  };
}

function schedulePayload(schedule: ScheduleDraft, isTariff: boolean, profileIri: string) {
  const payload: Record<string, unknown> = {
    endTime: schedule.endTime.trim(),
    startTime: schedule.startTime.trim(),
    weekday: schedule.weekday,
  };
  if (!schedule.id) payload[isTariff ? 'portProfile' : 'stationOpenProfile'] = profileIri;
  if (isTariff) {
    payload.currentDirection = schedule.currentDirection;
    payload.activationFee = numericValue(schedule.activationFee) || 0;
    payload.chargingFee = numericValue(schedule.chargingFee) || 0;
    payload.parkingFee = numericValue(schedule.parkingFee) || 0;
  }
  return payload;
}

function ScheduleCard({
  accentColor,
  directions,
  index,
  isTariff,
  onChange,
  onRemove,
  schedule,
  weekdays,
}: {
  accentColor: string;
  directions: CmsRecord[];
  index: number;
  isTariff: boolean;
  onChange: (patch: Partial<ScheduleDraft>) => void;
  onRemove: () => void;
  schedule: ScheduleDraft;
  weekdays: CmsRecord[];
}) {
  return (
    <ThemedView
      backgroundColor={Palette.surfaceMuted}
      borderColor={Palette.borderSubtle}
      borderCurve='continuous'
      borderRadius={18}
      borderWidth={1}
      gap={'four'}
      padding={'four'}>
      <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' justifyContent='space-between'>
        <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={14}>
          Slot {index + 1}
        </ThemedText>
        <Pressable accessibilityLabel={`Remove slot ${index + 1}`} accessibilityRole='button' hitSlop={8} onPress={onRemove}>
          <Trash2 color={Palette.danger} size={18} />
        </Pressable>
      </ThemedView>

      <OptionChips
        accentColor={accentColor}
        label='Weekday'
        onChange={value => onChange({ weekday: String(value) })}
        options={weekdays.map(item => ({ label: String(firstValue(item, ['name', 'nameVn']) || item.id), value: recordIri(item, 'api/weekdays') }))}
        value={schedule.weekday}
      />
      {isTariff ? (
        <OptionChips
          accentColor={accentColor}
          label='Current direction'
          onChange={value => onChange({ currentDirection: String(value) })}
          options={directions.map(item => ({ label: String(firstValue(item, ['type', 'name']) || item.id), value: recordIri(item, 'api/current_directions') }))}
          value={schedule.currentDirection}
        />
      ) : null}

      <ThemedView backgroundColor='transparent' flexDirection='row' gap={'three'}>
        <FloatingTextInput
          accentColor={accentColor}
          label='* Start time'
          onChangeText={startTime => onChange({ startTime })}
          placeholder='08:00'
          style={{ flex: 1 }}
          value={schedule.startTime}
        />
        <FloatingTextInput
          accentColor={accentColor}
          label='* End time'
          onChangeText={endTime => onChange({ endTime })}
          placeholder='17:00'
          style={{ flex: 1 }}
          value={schedule.endTime}
        />
      </ThemedView>

      {isTariff ? (
        <ThemedView backgroundColor='transparent' gap={'three'}>
          <FloatingTextInput
            accentColor={accentColor}
            isMoney
            label='Activation fee'
            onChangeText={activationFee => onChange({ activationFee })}
            value={schedule.activationFee}
          />
          <FloatingTextInput
            accentColor={accentColor}
            isMoney
            label='Charging fee'
            onChangeText={chargingFee => onChange({ chargingFee })}
            value={schedule.chargingFee}
          />
          <FloatingTextInput
            accentColor={accentColor}
            isMoney
            label='Parking fee'
            onChangeText={parkingFee => onChange({ parkingFee })}
            value={schedule.parkingFee}
          />
        </ThemedView>
      ) : null}
    </ThemedView>
  );
}

function EditorField({
  accentColor,
  field,
  imageUri,
  onChange,
  onPickImage,
  value,
}: {
  accentColor: string;
  field: CmsEditorFieldConfig;
  imageUri?: string;
  onChange: (value: DraftValue) => void;
  onPickImage: () => void;
  value: DraftValue;
}) {
  if (field.type === 'boolean') {
    return (
      <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={'four'} justifyContent='space-between' minHeight={46}>
        <ThemedView backgroundColor='transparent' flex={1} gap={2}>
          <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.medium} fontSize={14}>
            {field.label}
          </ThemedText>
          {field.help ? (
            <ThemedText color={Palette.textTertiary} fontSize={11} lineHeight={15}>
              {field.help}
            </ThemedText>
          ) : null}
        </ThemedView>
        <Switch accessibilityLabel={field.label} onValueChange={onChange} value={Boolean(value)} />
      </ThemedView>
    );
  }

  if (field.type === 'image') {
    return (
      <Pressable accessibilityLabel={`Choose ${field.label.toLowerCase()}`} accessibilityRole='button' onPress={onPickImage}>
        <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={'three'} minHeight={76}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={{ backgroundColor: Palette.surfaceBase, borderRadius: 14, height: 64, width: 64 }} />
          ) : (
            <ThemedView
              alignItems='center'
              backgroundColor={`${accentColor}12`}
              borderColor={`${accentColor}30`}
              borderRadius={14}
              borderWidth={1}
              height={64}
              justifyContent='center'
              width={64}>
              <ImagePlus color={accentColor} size={24} />
            </ThemedView>
          )}
          <ThemedView backgroundColor='transparent' flex={1} gap={3}>
            <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={14}>
              {field.label}
            </ThemedText>
            <ThemedText color={Palette.textSecondary} fontSize={12} lineHeight={16}>
              {imageUri ? 'Tap to replace image' : 'Choose an image from the photo library'}
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </Pressable>
    );
  }

  if (field.options) {
    return <OptionChips accentColor={accentColor} label={field.label} onChange={onChange} options={field.options} value={value} />;
  }

  if (field.lookup) {
    return <LookupField accentColor={accentColor} field={field} onChange={onChange} value={value} />;
  }

  const multiline = field.type === 'multiline';
  return (
    <ThemedView backgroundColor='transparent' gap={'two'}>
      <FloatingTextInput
        accentColor={accentColor}
        isMoney={field.type === 'currency'}
        keyboardType={field.type === 'number' ? 'numeric' : undefined}
        label={`${field.required ? '* ' : ''}${field.label}`}
        multiline={multiline}
        onChangeText={onChange}
        placeholder={field.placeholder}
        style={multiline ? { height: 92 } : undefined}
        value={String(value ?? '')}
      />
      {field.help ? (
        <ThemedText color={Palette.textTertiary} fontSize={11} lineHeight={15} paddingHorizontal={'two'}>
          {field.help}
        </ThemedText>
      ) : null}
    </ThemedView>
  );
}

function LookupField({
  accentColor,
  field,
  onChange,
  value,
}: {
  accentColor: string;
  field: CmsEditorFieldConfig;
  onChange: (value: DraftValue) => void;
  value: DraftValue;
}) {
  const lookup = field.lookup!;
  const query = useQuery({
    queryFn: () => fetchCmsCollectionRecords(lookup.endpoint, lookup.params),
    queryKey: ['cms-editor-lookup', lookup.endpoint, lookup.params],
  });
  const options = (query.data || []).map(record => ({
    label: String(firstValue(record, lookup.labelPaths) || record.id || 'Option'),
    value: String(firstValue(record, lookup.valuePaths) || recordIri(record, lookup.endpoint)),
  }));

  if (query.isLoading) {
    return (
      <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={'three'} minHeight={42}>
        <ActivityIndicator color={accentColor} size='small' />
        <ThemedText color={Palette.textSecondary} fontSize={12}>
          Loading {field.label.toLowerCase()}…
        </ThemedText>
      </ThemedView>
    );
  }

  return <OptionChips accentColor={accentColor} label={field.label} onChange={onChange} options={options} value={value} />;
}

function OptionChips({
  accentColor,
  label,
  onChange,
  options,
  value,
}: {
  accentColor: string;
  label: string;
  onChange: (value: DraftValue) => void;
  options: CmsEditorOption[];
  value: DraftValue;
}) {
  return (
    <ThemedView backgroundColor='transparent' gap={'two'}>
      <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={12}>
        {label}
      </ThemedText>
      <ThemedView backgroundColor='transparent' flexDirection='row' flexWrap='wrap' gap={'two'}>
        {options.map(option => {
          const active = String(value) === String(option.value);
          return (
            <Pressable accessibilityRole='button' key={String(option.value)} onPress={() => onChange(option.value)}>
              <ThemedView
                alignItems='center'
                backgroundColor={active ? accentColor : Palette.surfaceBase}
                borderColor={active ? accentColor : Palette.border}
                borderRadius={'pill'}
                borderWidth={1}
                flexDirection='row'
                gap={5}
                minHeight={34}
                paddingHorizontal={'three'}>
                {active ? <Check color='#FFFFFF' size={13} strokeWidth={2.5} /> : null}
                <ThemedText color={active ? '#FFFFFF' : Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={11}>
                  {option.label}
                </ThemedText>
              </ThemedView>
            </Pressable>
          );
        })}
      </ThemedView>
    </ThemedView>
  );
}

function EditorSection({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <ThemedView backgroundColor='transparent' gap={'three'}>
      <ThemedText
        color={Palette.textSecondary}
        fontFamily={FontFamily.semibold}
        fontSize={12}
        letterSpacing={0.5}
        paddingHorizontal={2}
        textTransform='uppercase'>
        {title}
      </ThemedText>
      <ThemedView
        backgroundColor={Palette.surfaceMuted}
        borderColor={Palette.borderSubtle}
        borderCurve='continuous'
        borderRadius={18}
        borderWidth={1}
        gap={'four'}
        padding={'four'}>
        {children}
      </ThemedView>
    </ThemedView>
  );
}

function EditorIntro({ entityLabel, mode }: { entityLabel: string; mode: EditorMode }) {
  return (
    <ThemedView backgroundColor='transparent' gap={3} paddingHorizontal={2}>
      <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={20} lineHeight={26}>
        {mode === 'create' ? `New ${entityLabel.toLowerCase()}` : `Update ${entityLabel.toLowerCase()}`}
      </ThemedText>
      <ThemedText color={Palette.textTertiary} fontSize={12} lineHeight={17}>
        Required fields are marked with an asterisk. Changes are written directly to the CMS after confirmation.
      </ThemedText>
    </ThemedView>
  );
}

function InlineError({ message }: { message: string }) {
  return (
    <ThemedView backgroundColor='#FFF1F0' borderColor='#FFCCC7' borderRadius={16} borderWidth={1} padding={'four'}>
      <ThemedText color='#B42318' fontFamily={FontFamily.semibold} fontSize={12} lineHeight={18} selectable>
        {message}
      </ThemedText>
    </ThemedView>
  );
}

function EditorLoading() {
  return (
    <ThemedView backgroundColor={Palette.surfaceBase} flex={1} gap={'four'} padding={'four'} safePaddingTop>
      <ThemedView borderRadius={18} height={180} loading />
      <ThemedView borderRadius={18} height={280} loading />
    </ThemedView>
  );
}

function EditorError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <ThemedView alignItems='center' backgroundColor={Palette.surfaceBase} flex={1} gap={'four'} justifyContent='center' padding={'four'}>
      <EmptyState message={message} title='Editor unavailable' />
      <Pressable accessibilityRole='button' onPress={onRetry}>
        <ThemedText color={Palette.accent} fontFamily={FontFamily.semibold} fontSize={14}>
          Retry
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

function UnavailableEditor() {
  const router = useRouter();
  return (
    <ThemedView alignItems='center' backgroundColor={Palette.surfaceBase} flex={1} gap={'four'} justifyContent='center' padding={'four'}>
      <EmptyState message='This CMS section does not expose a writable editor.' title='Editor unavailable' />
      <Pressable accessibilityRole='button' onPress={() => router.back()}>
        <ThemedText color={Palette.accent} fontFamily={FontFamily.semibold} fontSize={14}>
          Go back
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}
