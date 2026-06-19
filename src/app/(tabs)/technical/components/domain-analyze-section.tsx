import Svg, { Circle } from 'react-native-svg';

import { ThemedText, ThemedView } from 'components/base';
import { FontFamily, Palette } from 'themes';

import { SectionTitle, LoadingBlock, RetryBlock } from 'components/technical/list-ui';
import { styles } from 'components/technical/styles';

export function DomainDonut({ segments, total }: { segments: { color: string; value: number }[]; total: number }) {
  const size = 82;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const donutSegments = segments.reduce<{ color: string; dash: number; offset: number }[]>((acc, segment) => {
    const previousOffset = acc.reduce((sum, item) => sum + item.dash, 0);
    const dash = total ? (segment.value / total) * circumference : 0;
    return [...acc, { color: segment.color, dash, offset: previousOffset }];
  }, []);

  return (
    <ThemedView alignItems='center' justifyContent='center' style={styles.domainDonutWrap}>
      <Svg height={size} width={size}>
        <Circle cx={size / 2} cy={size / 2} fill='none' r={radius} stroke='#EEF2F6' strokeWidth={strokeWidth} />
        {donutSegments.map(segment => {
          return (
            <Circle
              cx={size / 2}
              cy={size / 2}
              fill='none'
              key={segment.color}
              r={radius}
              rotation='-90'
              origin={`${size / 2}, ${size / 2}`}
              stroke={segment.color}
              strokeDasharray={`${segment.dash} ${circumference - segment.dash}`}
              strokeDashoffset={-segment.offset}
              strokeLinecap='round'
              strokeWidth={strokeWidth}
            />
          );
        })}
      </Svg>
      <ThemedView alignItems='center' justifyContent='center' style={styles.domainDonutCenter}>
        <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={15} lineHeight={19} style={styles.domainReadiness}>
          {total.toLocaleString()}
        </ThemedText>
        <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={9} lineHeight={12}>
          APIs
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

export function DomainLegendItem({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <ThemedView alignItems='center' flexDirection='row' gap={'one'}>
      <ThemedView backgroundColor={color} style={styles.domainDot} />
      <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={10} lineHeight={14}>
        {label} {value.toLocaleString()}
      </ThemedText>
    </ThemedView>
  );
}

export function DomainApiBarRow({ index, item, percent }: { index: number; item: DomainAnalyzeRecord; percent: number }) {
  const routeStatus = item.working ? (item.is_charging_active ? 'Active' : 'Standby') : 'Silent';
  const color = routeStatus === 'Active' ? Palette.accent : routeStatus === 'Standby' ? '#3867D6' : '#98A2B3';
  const value = Number(item.total_charging || 0);

  return (
    <ThemedView gap={'one'} style={styles.domainApiRow}>
      <ThemedView alignItems='center' flexDirection='row' gap={'two'}>
        <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.bold} fontSize={11} lineHeight={15} style={styles.domainRouteIndex}>
          {index}
        </ThemedText>
        <ThemedView flex={1} minWidth={0}>
          <ThemedText numberOfLines={1} color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={12} lineHeight={17}>
            {item.domain || '-'}
          </ThemedText>
        </ThemedView>
        <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.semibold} fontSize={12} lineHeight={17} style={styles.domainRoutePercent}>
          {percent}%
        </ThemedText>
      </ThemedView>
      <ThemedView alignItems='center' flexDirection='row' gap={'two'}>
        <ThemedView style={styles.domainApiTrack}>
          <ThemedView backgroundColor={color} height='100%' width={`${Math.max(2, Math.min(percent, 100))}%`} />
        </ThemedView>
        <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={10} lineHeight={14} style={styles.domainApiMeta}>
          {value.toLocaleString()} • {routeStatus}
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

export function DomainAnalyzeSection({
  onViewMore,
  query }: {
  onViewMore?: () => void;
  query: { data?: { items: DomainAnalyzeRecord[] }; error: Error | null; isLoading: boolean; refetch: () => void };
}) {
  const items = query.data?.items || [];
  const working = items.filter(item => item.working).length;
  const active = items.filter(item => item.is_charging_active).length;
  const backup = items.filter(item => item.working && !item.is_charging_active).length;
  const offline = Math.max(items.length - working, 0);
  const totalSessions = items.reduce((sum, item) => sum + Number(item.total_charging || 0), 0);
  const readiness = items.length ? Math.round((working / items.length) * 100) : 0;
  const sortedItems = items.slice().sort((a, b) => Number(b.total_charging || 0) - Number(a.total_charging || 0));
  const visibleDomains = sortedItems.slice(0, 5);

  return (
    <ThemedView gap={'three'} style={styles.dashboardSection}>
      <SectionTitle actionLabel='View more' onAction={onViewMore} subtitle='Load routing across active CMS domains.' title='Domain Analyze' />
      {query.isLoading ? (
        <LoadingBlock label='Loading domain analyze' />
      ) : query.error ? (
        <RetryBlock message={query.error.message} onRetry={query.refetch} title='Domain analyze unavailable' />
      ) : (
        <ThemedView gap={'four'}>
          <ThemedView alignItems='center' flexDirection='row' gap={'four'}>
            <DomainDonut
              segments={[
                { color: Palette.accent, value: active },
                { color: '#3867D6', value: backup },
                { color: '#D0D5DD', value: offline },
              ]}
              total={items.length}
            />
            <ThemedView flex={1} gap={'two'} minWidth={0}>
              <ThemedView alignItems='baseline' flexDirection='row' gap={'two'}>
                <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={24} lineHeight={29} style={styles.domainReadiness}>
                  {totalSessions.toLocaleString()}
                </ThemedText>
                <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={11} lineHeight={15}>
                  sessions
                </ThemedText>
              </ThemedView>
              <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.regular} fontSize={11} lineHeight={15}>
                {readiness}% working • {items.length.toLocaleString()} domains
              </ThemedText>
              <ThemedView flexDirection='row' flexWrap='wrap' gap={'two'}>
                <DomainLegendItem color={Palette.accent} label='Active' value={active} />
                <DomainLegendItem color='#3867D6' label='Standby' value={backup} />
                <DomainLegendItem color='#98A2B3' label='Silent' value={offline} />
              </ThemedView>
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.domainDivider} />

          <ThemedView gap={'two'}>
            {visibleDomains.map((item, index) => {
              const share = totalSessions ? Math.round((Number(item.total_charging || 0) / totalSessions) * 100) : 0;
              return <DomainApiBarRow index={index + 1} item={item} key={item.id} percent={share} />;
            })}
          </ThemedView>
        </ThemedView>
      )}
    </ThemedView>
  );
}
