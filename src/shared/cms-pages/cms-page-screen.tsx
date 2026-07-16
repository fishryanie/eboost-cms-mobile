import { type InfiniteData, useInfiniteQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
  BadgeDollarSign,
  CalendarClock,
  CarFront,
  ChevronDown,
  ChevronUp,
  Clock3,
  FileText,
  Gift,
  Megaphone,
  MessageSquareText,
  PanelsTopLeft,
  Pencil,
  Plus,
  ReceiptText,
  Search,
  ShieldCheck,
  TicketPercent,
  UsersRound,
  WalletCards,
  Zap,
  type LucideIcon,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, TextInput } from 'react-native';

import { ThemedText, ThemedView } from 'components/base';
import { AnimatedHeaderFlatList } from 'components/organisms/anmated-header-flatlist';
import { EmptyState } from 'components/ui';
import { LocationListSkeleton } from 'shared/locations/components/location-list-skeleton';
import { FontFamily, Palette } from 'themes';
import { mhs } from 'themes/scaling';

import type { CmsFieldConfig, CmsPageConfig, CmsSectionConfig, CmsValueFormat } from './config';
import { fetchCmsSectionPage, type CmsPage, type CmsRecord } from './service';

const currencyFormatter = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });
const numberFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

type StatusTone = 'danger' | 'muted' | 'success' | 'warning';

const statusColors: Record<StatusTone, string> = {
  danger: '#D92D20',
  muted: '#7B8794',
  success: '#0B9B55',
  warning: '#D97706',
};

function getPathValue(record: CmsRecord, path: string): unknown {
  return path.split('.').reduce<unknown>((value, segment) => {
    if (Array.isArray(value)) {
      const index = Number(segment);
      return Number.isInteger(index) ? value[index] : undefined;
    }
    if (!value || typeof value !== 'object') return undefined;
    return (value as Record<string, unknown>)[segment];
  }, record);
}

function firstValue(record: CmsRecord, paths: string[] = []) {
  for (const path of paths) {
    const value = getPathValue(record, path);
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return undefined;
}

function getRecordId(record: CmsRecord) {
  if (record.id !== undefined && record.id !== null && record.id !== '') return record.id;
  const iri = String(record.iriId || record['@id'] || '');
  return iri.split('/').filter(Boolean).at(-1);
}

function stripMarkup(value: string) {
  return value
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function readableValue(value: unknown): string {
  if (value === undefined || value === null || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'string') return stripMarkup(value);
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value))
    return (
      value
        .map(readableValue)
        .filter(item => item !== '—')
        .join(', ') || '—'
    );
  if (typeof value === 'object') {
    const candidate = value as Record<string, unknown>;
    return readableValue(candidate.name ?? candidate.title ?? candidate.code ?? candidate.label ?? candidate.id);
  }
  return String(value);
}

function toDate(value: unknown) {
  if (typeof value === 'number') return new Date(value < 10_000_000_000 ? value * 1000 : value);
  const numericValue = typeof value === 'string' && /^\d{10,13}$/.test(value) ? Number(value) : undefined;
  if (numericValue !== undefined) return new Date(numericValue < 10_000_000_000 ? numericValue * 1000 : numericValue);
  return new Date(String(value));
}

function formatValue(value: unknown, format: CmsValueFormat = 'text') {
  if (value === undefined || value === null || value === '') return '—';
  if (format === 'currency') {
    const number = Number(value);
    return Number.isFinite(number) ? `${currencyFormatter.format(number)} đ` : readableValue(value);
  }
  if (format === 'number') {
    const number = Number(value);
    return Number.isFinite(number) ? numberFormatter.format(number) : readableValue(value);
  }
  if (format === 'energy') {
    const number = Number(value);
    if (!Number.isFinite(number)) return readableValue(value);
    return `${numberFormatter.format(number >= 1000 ? number / 1000 : number)} ${number >= 1000 ? 'kWh' : 'Wh'}`;
  }
  if (format === 'date' || format === 'dateTime') {
    const date = toDate(value);
    if (Number.isNaN(date.getTime())) return readableValue(value);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      hour: format === 'dateTime' ? '2-digit' : undefined,
      minute: format === 'dateTime' ? '2-digit' : undefined,
      month: 'short',
      year: 'numeric',
    });
  }
  return readableValue(value);
}

function getStatusMeta(record: CmsRecord, paths: string[] = []): { label: string; tone: StatusTone } | undefined {
  for (const path of paths) {
    const value = getPathValue(record, path);
    if (value === undefined || value === null || value === '') continue;
    if (path === 'deletedAt') return { label: 'Archived', tone: 'muted' };
    if (typeof value === 'boolean') return value ? { label: 'Active', tone: 'success' } : { label: 'Inactive', tone: 'muted' };

    const label = readableValue(value);
    const normalized = label.toLowerCase();
    if (/fail|error|cancel|block|reject|expired/.test(normalized)) return { label, tone: 'danger' };
    if (/pending|overdue|wait|process|charging|upcoming/.test(normalized)) return { label, tone: 'warning' };
    if (/success|finish|complete|active|enabled|done|paid/.test(normalized)) return { label, tone: 'success' };
    return { label, tone: 'muted' };
  }
  return undefined;
}

function getSectionIcon(section: CmsSectionConfig): LucideIcon {
  const endpoint = section.endpoint;
  if (section.variant === 'tariff') return BadgeDollarSign;
  if (section.variant === 'opening-hours') return Clock3;
  if (section.variant === 'brand') return CarFront;
  if (endpoint.includes('reservation')) return CalendarClock;
  if (endpoint.includes('momo') || endpoint.includes('ale_pay')) return WalletCards;
  if (endpoint.includes('charge_histories')) return Zap;
  if (endpoint.includes('faq') || endpoint.includes('static_contents')) return FileText;
  if (endpoint.includes('promotion')) return TicketPercent;
  if (endpoint.includes('money_top_up')) return Gift;
  if (endpoint.includes('referral')) return UsersRound;
  if (endpoint.includes('notification')) return MessageSquareText;
  if (endpoint.includes('advertisement')) return Megaphone;
  if (endpoint === 'api/events') return PanelsTopLeft;
  if (endpoint.includes('subscription')) return ShieldCheck;
  return ReceiptText;
}

function getRecordKey(record: CmsRecord, index: number, section: CmsSectionConfig) {
  return `${section.key}-${String(getRecordId(record) ?? firstValue(record, section.titlePaths) ?? index)}`;
}

function getPreviewText(record: CmsRecord, section: CmsSectionConfig) {
  if (section.variant === 'tariff') {
    const schedules = getPathValue(record, 'portFeeSchedules');
    if (!Array.isArray(schedules) || !schedules.length) return 'No fee schedule configured';
    const schedule = schedules[0] as CmsRecord;
    return [
      readableValue(firstValue(schedule, ['weekday.name', 'weekday.nameVn'])),
      readableValue(firstValue(schedule, ['currentDirection.type'])),
      `${readableValue(schedule.startTime)}–${readableValue(schedule.endTime)}`,
    ]
      .filter(value => value !== '—')
      .join('  ·  ');
  }

  if (section.variant === 'opening-hours') {
    const schedules = getPathValue(record, 'stationOpenTimes');
    if (!Array.isArray(schedules) || !schedules.length) return 'No opening schedule configured';
    const schedule = schedules[0] as CmsRecord;
    return `${readableValue(firstValue(schedule, ['weekday.name', 'weekday.nameVn']))}  ·  ${readableValue(schedule.startTime)}–${readableValue(schedule.endTime)}`;
  }

  if (section.variant === 'brand') {
    const models = getPathValue(record, 'brandModels');
    const modelCount = Array.isArray(models) ? models.length : Number(getPathValue(record, 'numberOfModels')) || 0;
    const outletCount = Number(getPathValue(record, 'numberOfOutlets')) || 0;
    return `${modelCount} ${modelCount === 1 ? 'model' : 'models'}  ·  ${outletCount} ${outletCount === 1 ? 'outlet' : 'outlets'}`;
  }

  const fieldPreviews = section.fields
    .slice(0, 2)
    .map(field => {
      const value = formatValue(firstValue(record, field.paths), field.format);
      return value === '—' ? undefined : `${field.label} ${value}`;
    })
    .filter((value): value is string => Boolean(value));

  if (fieldPreviews.length) return fieldPreviews.join('  ·  ');
  return readableValue(firstValue(record, section.subtitlePaths));
}

export function CmsPageScreen({ config, editorPathname, onBack }: { config: CmsPageConfig; editorPathname?: string; onBack: () => void }) {
  const router = useRouter();
  const [activeSectionKey, setActiveSectionKey] = useState(config.sections[0].key);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const activeSection = config.sections.find(section => section.key === activeSectionKey) || config.sections[0];

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const query = useInfiniteQuery<CmsPage, Error, InfiniteData<CmsPage>, readonly unknown[], number>({
    getNextPageParam: lastPage => lastPage.nextPage,
    initialPageParam: 1,
    queryFn: ({ pageParam }) => fetchCmsSectionPage({ page: pageParam, search, section: activeSection }),
    queryKey: ['cms-page', activeSection.endpoint, activeSection.key, search, activeSection.params],
  });

  const items = useMemo(() => query.data?.pages.flatMap(page => page.items) || [], [query.data]);
  const totalItems = query.data?.pages[0]?.totalItems || 0;
  const loadMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
  }, [query]);
  const createEditor = editorPathname && activeSection.editor && activeSection.editor.create !== false;
  const actionButton = createEditor ? (
    <HeaderActionButton
      accentColor={config.accentColor}
      label={`Create ${activeSection.label}`}
      onPress={() => router.push({ pathname: editorPathname, params: { mode: 'create', section: activeSection.key } } as never)}
    />
  ) : config.action ? (
    <HeaderActionButton accentColor={config.accentColor} label={config.action.label} onPress={() => router.push(config.action!.href as never)} />
  ) : undefined;

  return (
    <ThemedView flex={1} backgroundColor={Palette.surfaceBase}>
      <AnimatedHeaderFlatList
        canGoBack
        contentContainerStyle={{ paddingBottom: 120 }}
        data={items}
        keyboardShouldPersistTaps='handled'
        keyExtractor={(item, index) => getRecordKey(item, index, activeSection)}
        largeHeaderTitleStyle={{ fontFamily: FontFamily.bold, fontSize: 36, letterSpacing: -0.7, lineHeight: 42 }}
        largeRightComponent={actionButton}
        largeTitle={config.title}
        ListEmptyComponent={
          query.isLoading ? (
            <LocationListSkeleton />
          ) : query.isError ? (
            <ThemedView gap={'four'} paddingHorizontal={'four'} paddingTop={'five'}>
              <EmptyState
                message={query.error instanceof Error ? query.error.message : 'The list could not be loaded.'}
                title={`${activeSection.label} unavailable`}
              />
              <RetryButton onPress={() => query.refetch()} />
            </ThemedView>
          ) : (
            <ThemedView paddingHorizontal={'four'} paddingTop={'five'}>
              <EmptyState
                message={search ? 'Try a different keyword or clear the search.' : 'No records were returned by the CMS.'}
                title={`No ${activeSection.label.toLowerCase()} found`}
              />
            </ThemedView>
          )
        }
        ListFooterComponent={
          query.isFetchingNextPage ? (
            <ThemedView alignSelf='center' borderRadius={'pill'} height={16} loading marginVertical={24} width={112} />
          ) : query.isFetchNextPageError ? (
            <RetryButton label='Retry loading more' onPress={() => query.fetchNextPage()} />
          ) : null
        }
        ListHeaderComponent={
          config.sections.length > 1 ? (
            <ThemedView paddingBottom={'two'} paddingHorizontal={12}>
              <ScrollView contentContainerStyle={{ gap: mhs(8) }} horizontal showsHorizontalScrollIndicator={false}>
                {config.sections.map(section => (
                  <SectionChip
                    active={section.key === activeSection.key}
                    key={section.key}
                    label={section.label}
                    onPress={() => {
                      setActiveSectionKey(section.key);
                      setSearchInput('');
                      setSearch('');
                    }}
                  />
                ))}
              </ScrollView>
            </ThemedView>
          ) : null
        }
        onBack={onBack}
        onEndReached={loadMore}
        onEndReachedThreshold={0.45}
        refreshControl={
          <RefreshControl onRefresh={() => query.refetch()} refreshing={query.isRefetching && !query.isFetchingNextPage} tintColor={config.accentColor} />
        }
        renderItem={({ item, index }) => (
          <CmsRecordRow
            accentColor={config.accentColor}
            index={index}
            onEdit={
              !editorPathname || activeSection.editor?.update === false
                ? undefined
                : activeSection.editor
                  ? () =>
                      router.push({
                        pathname: editorPathname,
                        params: { id: String(getRecordId(item) ?? ''), mode: 'update', section: activeSection.key },
                      } as never)
                  : undefined
            }
            record={item}
            section={activeSection}
          />
        )}
        rightComponent={actionButton}
        searchBar={
          activeSection.searchParam ? (
            <ThemedView justifyContent='center'>
              <ThemedView left={14} pointerEvents='none' position='absolute' zIndex={1}>
                <Search color={Palette.textTertiary} size={17} />
              </ThemedView>
              <TextInput
                autoCapitalize='none'
                autoCorrect={false}
                onChangeText={setSearchInput}
                placeholder={`Search ${activeSection.label}`}
                placeholderTextColor={Palette.textTertiary}
                returnKeyType='search'
                style={{
                  backgroundColor: Palette.surfaceRaised,
                  borderColor: Palette.borderSubtle,
                  borderRadius: mhs(21),
                  borderWidth: 1,
                  color: Palette.textPrimary,
                  fontFamily: FontFamily.medium,
                  fontSize: 14,
                  minHeight: 44,
                  paddingLeft: mhs(40),
                  paddingRight: mhs(14),
                }}
                value={searchInput}
              />
            </ThemedView>
          ) : undefined
        }
        showsVerticalScrollIndicator={false}
        smallHeaderTitleStyle={{ fontFamily: FontFamily.semibold }}
        subtitle={`${totalItems.toLocaleString()} ${totalItems === 1 ? 'record' : 'records'}`}
      />
    </ThemedView>
  );
}

function HeaderActionButton({ accentColor, label, onPress }: { accentColor: string; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityLabel={label} accessibilityRole='button' onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.72 : 1 })}>
      <ThemedView alignItems='center' backgroundColor={accentColor} borderRadius={'pill'} height={40} justifyContent='center' width={40}>
        <Plus color='#FFFFFF' size={20} strokeWidth={2.4} />
      </ThemedView>
    </Pressable>
  );
}

function SectionChip({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole='button'
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: 'center',
        backgroundColor: active ? Palette.surfaceMuted : Palette.surfaceBase,
        borderColor: active ? Palette.border : Palette.borderSubtle,
        borderRadius: mhs(16),
        borderWidth: 1,
        justifyContent: 'center',
        minHeight: 32,
        opacity: pressed ? 0.72 : 1,
        paddingHorizontal: mhs(12),
      })}>
      <ThemedText color={active ? Palette.textPrimary : Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={12} lineHeight={16}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function CmsRecordRow({
  accentColor,
  index,
  onEdit,
  record,
  section,
}: {
  accentColor: string;
  index: number;
  onEdit?: () => void;
  record: CmsRecord;
  section: CmsSectionConfig;
}) {
  const [expanded, setExpanded] = useState(false);
  const Icon = getSectionIcon(section);
  const recordId = getRecordId(record);
  const rawTitle = firstValue(record, section.titlePaths);
  const rawSubtitle = firstValue(record, section.subtitlePaths);
  const title = readableValue(rawTitle) === '—' ? `${section.label} #${String(recordId ?? index + 1)}` : readableValue(rawTitle);
  const subtitle = rawSubtitle === undefined ? undefined : readableValue(rawSubtitle);
  const imageUrl = readableValue(firstValue(record, section.imagePaths));
  const status = getStatusMeta(record, section.statusPaths);
  const preview = getPreviewText(record, section);
  const hasDetails = section.fields.length > 0 || ['brand', 'opening-hours', 'tariff'].includes(section.variant || '');

  return (
    <ThemedView backgroundColor={Palette.surfaceBase} overflow='hidden'>
      <Pressable
        accessibilityRole={hasDetails ? 'button' : undefined}
        onPress={() => hasDetails && setExpanded(value => !value)}
        style={({ pressed }) => ({ opacity: pressed && hasDetails ? 0.7 : 1 })}>
        <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={12} minHeight={104} paddingLeft={12}>
          <RecordMedia accentColor={accentColor} icon={Icon} imageUrl={imageUrl} title={title} />

          <ThemedView
            backgroundColor='transparent'
            borderBottomColor='#E6EAE8'
            borderBottomWidth={StyleSheet.hairlineWidth}
            flex={1}
            gap={5}
            justifyContent='center'
            minHeight={104}
            minWidth={0}
            paddingRight={12}
            paddingVertical={10}>
            <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={'two'} justifyContent='space-between'>
              <ThemedText
                color={accentColor}
                flex={1}
                fontFamily={FontFamily.semibold}
                fontSize={9}
                letterSpacing={0.7}
                lineHeight={12}
                numberOfLines={1}
                textTransform='uppercase'>
                {section.label} {recordId !== undefined ? `· #${recordId}` : ''}
              </ThemedText>
              {status ? <StatusPill label={status.label} tone={status.tone} /> : null}
              {onEdit ? (
                <Pressable
                  accessibilityLabel={`Edit ${title}`}
                  accessibilityRole='button'
                  hitSlop={8}
                  onPress={event => {
                    event.stopPropagation();
                    onEdit();
                  }}>
                  <ThemedView alignItems='center' backgroundColor={`${accentColor}12`} borderRadius={'pill'} height={26} justifyContent='center' width={26}>
                    <Pencil color={accentColor} size={13} strokeWidth={2.1} />
                  </ThemedView>
                </Pressable>
              ) : null}
              {hasDetails ? expanded ? <ChevronUp color={Palette.textTertiary} size={17} /> : <ChevronDown color={Palette.textTertiary} size={17} /> : null}
            </ThemedView>

            <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={15} lineHeight={20} numberOfLines={expanded ? 4 : 2} selectable>
              {title}
            </ThemedText>

            {!expanded ? (
              <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={11} lineHeight={15} numberOfLines={2}>
                {preview !== '—' ? preview : subtitle || 'No additional details'}
              </ThemedText>
            ) : (
              <ExpandedDetails accentColor={accentColor} record={record} section={section} subtitle={subtitle} />
            )}
          </ThemedView>
        </ThemedView>
      </Pressable>
    </ThemedView>
  );
}

function RecordMedia({ accentColor, icon: Icon, imageUrl, title }: { accentColor: string; icon: LucideIcon; imageUrl: string; title: string }) {
  if (imageUrl !== '—') {
    return (
      <Image
        accessibilityLabel={title}
        contentFit='cover'
        source={{ uri: imageUrl }}
        style={{ backgroundColor: Palette.surfaceMuted, borderRadius: 16, height: 64, width: 64 }}
        transition={150}
      />
    );
  }

  return (
    <ThemedView
      alignItems='center'
      backgroundColor={`${accentColor}0D`}
      borderColor={`${accentColor}24`}
      borderCurve='continuous'
      borderRadius={16}
      borderWidth={1}
      height={64}
      justifyContent='center'
      width={64}>
      <Icon color={accentColor} size={25} strokeWidth={1.8} />
    </ThemedView>
  );
}

function ExpandedDetails({ accentColor, record, section, subtitle }: { accentColor: string; record: CmsRecord; section: CmsSectionConfig; subtitle?: string }) {
  return (
    <ThemedView backgroundColor='transparent' gap={'two'} paddingTop={4}>
      {subtitle && subtitle !== '—' ? (
        <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={11} lineHeight={16} selectable>
          {subtitle}
        </ThemedText>
      ) : null}
      {section.variant === 'tariff' ? <TariffDetails accentColor={accentColor} record={record} /> : null}
      {section.variant === 'opening-hours' ? <OpeningHoursDetails accentColor={accentColor} record={record} /> : null}
      {section.variant === 'brand' ? <BrandModelsDetails accentColor={accentColor} record={record} /> : null}
      {section.fields.map(field => (
        <DetailLine field={field} key={field.label} record={record} />
      ))}
    </ThemedView>
  );
}

function DetailLine({ field, record }: { field: CmsFieldConfig; record: CmsRecord }) {
  const value = formatValue(firstValue(record, field.paths), field.format);
  if (value === '—') return null;

  return (
    <ThemedView alignItems='flex-start' backgroundColor='transparent' flexDirection='row' gap={'three'} justifyContent='space-between'>
      <ThemedText color={Palette.textTertiary} flexShrink={0} fontFamily={FontFamily.medium} fontSize={10} lineHeight={15}>
        {field.label}
      </ThemedText>
      <ThemedText color={Palette.textPrimary} flex={1} fontFamily={FontFamily.semibold} fontSize={11} lineHeight={16} selectable textAlign='right'>
        {value}
      </ThemedText>
    </ThemedView>
  );
}

function TariffDetails({ accentColor, record }: { accentColor: string; record: CmsRecord }) {
  const schedules = getPathValue(record, 'portFeeSchedules');
  if (!Array.isArray(schedules) || !schedules.length) return null;

  return (
    <ThemedView backgroundColor='transparent' gap={'two'} paddingBottom={2}>
      {schedules.map((item, index) => {
        const schedule = item as CmsRecord;
        return (
          <ThemedView
            backgroundColor='transparent'
            borderTopColor={index ? Palette.borderSubtle : 'transparent'}
            borderTopWidth={index ? StyleSheet.hairlineWidth : 0}
            gap={3}
            key={String(schedule.id ?? index)}
            paddingTop={index ? 'two' : 0}>
            <ThemedView alignItems='center' backgroundColor='transparent' flexDirection='row' gap={'two'} justifyContent='space-between'>
              <ThemedText color={accentColor} flex={1} fontFamily={FontFamily.semibold} fontSize={10} lineHeight={15}>
                {readableValue(firstValue(schedule, ['weekday.name', 'weekday.nameVn']))} · {readableValue(firstValue(schedule, ['currentDirection.type']))}
              </ThemedText>
              <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={10} lineHeight={15}>
                {readableValue(schedule.startTime)}–{readableValue(schedule.endTime)}
              </ThemedText>
            </ThemedView>
            <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={10} lineHeight={15}>
              Min {formatValue(schedule.activationFee, 'currency')} · Charge {formatValue(schedule.chargingFee, 'currency')} · Park{' '}
              {formatValue(schedule.parkingFee, 'currency')}
            </ThemedText>
          </ThemedView>
        );
      })}
    </ThemedView>
  );
}

function OpeningHoursDetails({ accentColor, record }: { accentColor: string; record: CmsRecord }) {
  const schedules = getPathValue(record, 'stationOpenTimes');
  if (!Array.isArray(schedules) || !schedules.length) return null;

  return (
    <ThemedView backgroundColor='transparent' gap={4}>
      {schedules.map((item, index) => {
        const schedule = item as CmsRecord;
        return (
          <ThemedView
            alignItems='center'
            backgroundColor='transparent'
            flexDirection='row'
            gap={'three'}
            justifyContent='space-between'
            key={String(schedule.id ?? index)}>
            <ThemedText color={accentColor} flex={1} fontFamily={FontFamily.semibold} fontSize={10} lineHeight={15}>
              {readableValue(firstValue(schedule, ['weekday.name', 'weekday.nameVn']))}
            </ThemedText>
            <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={10} lineHeight={15}>
              {readableValue(schedule.startTime)}–{readableValue(schedule.endTime)}
            </ThemedText>
          </ThemedView>
        );
      })}
    </ThemedView>
  );
}

function BrandModelsDetails({ accentColor, record }: { accentColor: string; record: CmsRecord }) {
  const models = getPathValue(record, 'brandModels');
  if (!Array.isArray(models) || !models.length) return null;

  return (
    <ThemedView backgroundColor='transparent' flexDirection='row' flexWrap='wrap' gap={'two'}>
      {models.map((item, index) => {
        const model = item as CmsRecord;
        return (
          <ThemedView backgroundColor={`${accentColor}0D`} borderRadius={'pill'} key={String(model.id ?? index)} paddingHorizontal={'two'} paddingVertical={3}>
            <ThemedText color={accentColor} fontFamily={FontFamily.semibold} fontSize={9} lineHeight={13}>
              {readableValue(model.name)}
              {model.vehicleType ? ` · ${readableValue(model.vehicleType)}` : ''}
            </ThemedText>
          </ThemedView>
        );
      })}
    </ThemedView>
  );
}

function StatusPill({ label, tone }: { label: string; tone: StatusTone }) {
  return (
    <ThemedView
      alignSelf='flex-start'
      backgroundColor={statusColors[tone]}
      borderRadius={'pill'}
      maxWidth={94}
      minHeight={21}
      paddingHorizontal={8}
      paddingVertical={3}>
      <ThemedText color='#FFFFFF' fontFamily={FontFamily.semibold} fontSize={9} lineHeight={12} numberOfLines={1}>
        {label}
      </ThemedText>
    </ThemedView>
  );
}

function RetryButton({ label = 'Retry', onPress }: { label?: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole='button' onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      <ThemedView alignItems='center' paddingVertical={'four'}>
        <ThemedText color={Palette.accent} fontFamily={FontFamily.bold} fontSize={14} lineHeight={20}>
          {label}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}
