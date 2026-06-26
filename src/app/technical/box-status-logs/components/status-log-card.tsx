import { AlertCircle, Cable, Clock, Zap } from 'lucide-react-native';

import { ThemedText, ThemedView } from 'components/base';
import { FontFamily, Palette } from 'themes';

import { StatusPill, formatShortTime, screenHorizontalPadding } from 'components/technical/common';

const STATUS_COLORS: Record<string, string> = {
  Available: '#52c41a',
  Ready: '#1677ff',
  Charging: '#13c2c2',
  ChargeFull: '#52c41a',
  Unplugged: '#8c8c8c',
  NoPower: '#fa541c',
  NoFuse: '#eb2f96',
  NoRelay: '#722ed1',
  OverCurrent: '#fa8c16',
  TotalOverCurrent: '#f5222d',
  OverMoney: '#faad14',
  OverTime: '#2f54eb',
  RelayBroken: '#ff85c0',
  StoppedFromApp: '#a0d911',
  EmergencyStop: '#ff4d4f',
  Preparing: '#faad14',
  Finishing: '#eb2f96',
  SuspendedEV: '#1677ff',
  SuspendedEVSE: '#2f54eb',
  Reserved: '#722ed1',
  Unavailable: '#fa8c16',
  Faulted: '#ff4d4f',
};

const OCPPErrorCodeMap: Record<string, string> = {
  A0108: 'Nhấn Emergency Stop',
  A0112: 'Cảm biến cửa',
  A0113: 'Cảnh báo mở nắp bất thường',
  A0302: 'Lỗi giao tiếp ocpp và pcba',
  A1303: 'Lỗi tiếp địa',
  A0401: 'Lỗi giao tiếp',
  A0413: 'InputOverVoltage',
  A0416: 'Sai thứ tự lắp đặt',
  A0902: 'Lỗi Contactor',
  B0415: 'Không tìm thấy module',
  B0418: 'N/A',
  B2004: 'Lỗi điện áp CP',
  C0402: 'Module mất kết nối',
  D0209: 'Lỗi hiển thị',
};

function formatStatus(value: StatusLogRecord['status'], vehicle: TechnicalVehicle) {
  if (value === undefined || value === null || value === '') return '-';
  if (vehicle === 'car') return String(value);

  const bikeStatus: Record<number, string> = {
    0: 'Available',
    1: 'Ready',
    2: 'Charging',
    3: 'ChargeFull',
    4: 'Unplugged',
    5: 'NoPower',
    6: 'NoFuse',
    7: 'NoRelay',
    8: 'OverCurrent',
    9: 'TotalOverCurrent',
    10: 'OverMoney',
    11: 'OverTime',
    12: 'RelayBroken',
    13: 'StoppedFromApp',
    14: 'EmergencyStop',
  };

  return bikeStatus[Number(value)] || String(value);
}

export function StatusLogCard({
  item,
  vehicle,
  isTimeline,
  isLast,
}: {
  item: StatusLogRecord;
  vehicle: TechnicalVehicle;
  isTimeline?: boolean;
  isLast?: boolean;
}) {
  const chargerId = item.chargePointID || item.vendor_id || item.box_id || item.boxId || '-';
  const rawErrorCode = item.errorCode || item.error_code || '';
  const parsedErrorCode =
    rawErrorCode === 'NoError' ? '' : OCPPErrorCodeMap[rawErrorCode] ? `${rawErrorCode} - ${OCPPErrorCodeMap[rawErrorCode]}` : rawErrorCode;

  const rawVendorErrorCode = item.vendorErrorCode || item.vendor_error_code || '';
  const vendorErrorCode = OCPPErrorCodeMap[rawVendorErrorCode] ? `${rawVendorErrorCode} - ${OCPPErrorCodeMap[rawVendorErrorCode]}` : rawVendorErrorCode;

  const status = formatStatus(item.status, vehicle);
  const color = STATUS_COLORS[status] || STATUS_COLORS.default;

  let displayText = '';
  if (vendorErrorCode) {
    displayText = vendorErrorCode;
  } else if (parsedErrorCode) {
    displayText = parsedErrorCode;
  } else if (item.info && item.info !== 'Normal event' && item.info !== 'NoError') {
    displayText = item.info;
  }

  const isWarning = !!parsedErrorCode || !!vendorErrorCode || status === 'Faulted' || status === 'NoPower' || !!displayText;
  const textColor = isWarning ? Palette.danger : color;

  const connPrefix = vehicle === 'bike' ? 'O' : 'C';
  const connNumber = item.connectorID ?? item.connector_id ?? '-';
  const connText = `${connPrefix}${connNumber}-${status}`;

  if (isTimeline) {
    const timestamp = item.timestamp || item.receivedAt;
    const date = timestamp ? new Date(timestamp) : new Date();
    const dayStr = !Number.isNaN(date.getTime()) ? date.getDate().toString() : '--';
    const monthStr = !Number.isNaN(date.getTime()) ? (date.getMonth() + 1).toString() : '';
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const textStr = !Number.isNaN(date.getTime()) ? days[date.getDay()] : '---';
    const timeStr = !Number.isNaN(date.getTime()) ? date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '--:--';

    return (
      <ThemedView flexDirection='row' paddingHorizontal={'four'} width='100%'>
        {/* Left Column: Date & Day */}
        <ThemedView alignItems='center' marginRight={'three'} width={44}>
          <ThemedText color={Palette.accent} fontFamily={FontFamily.bold} fontSize={16}>
            {dayStr}
            {monthStr ? (
              <ThemedText color={Palette.accent} fontFamily={FontFamily.bold} fontSize={11}>
                /{monthStr}
              </ThemedText>
            ) : null}
          </ThemedText>
          <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.regular} fontSize={10} marginTop={'one'}>
            {timeStr}
          </ThemedText>
          <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={11}>
            {textStr}
          </ThemedText>
        </ThemedView>

        {/* Middle Column: Dot & Line */}
        <ThemedView alignItems='center' marginRight={'three'} width={24}>
          <ThemedView
            backgroundColor={color}
            borderColor={Palette.surfaceBase}
            borderRadius={7}
            borderWidth={2}
            height={14}
            marginTop={4}
            width={14}
            zIndex={2}
          />
          {!isLast && <ThemedView backgroundColor={Palette.borderSubtle} flex={1} marginBottom={-24} marginTop={-8} width={2} />}
        </ThemedView>

        {/* Right Column: Content */}
        <ThemedView flex={1} paddingBottom={'five'}>
          <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={15}>
            {connText}
          </ThemedText>

          {!!displayText && (
            <ThemedView marginTop={'one'}>
              <ThemedText color={textColor} fontFamily={FontFamily.regular} fontSize={13} numberOfLines={2}>
                {displayText}
              </ThemedText>
            </ThemedView>
          )}
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ThemedView
      backgroundColor={Palette.surfaceBase}
      borderColor={isWarning ? '#FFA39E' : Palette.borderSubtle}
      borderRadius={'large'}
      borderWidth={1}
      boxShadow='0 8px 20px rgba(15, 23, 42, 0.08)'
      gap={'three'}
      marginHorizontal={screenHorizontalPadding}
      padding={'three'}
      width='auto'>
      {/* Top row: Charger ID and Connector */}
      <ThemedView flexDirection='row' gap={'two'} justifyContent='space-between' alignItems='center'>
        <ThemedView flex={1} minWidth={0}>
          <ThemedView alignItems='center' flexDirection='row' gap={'one'}>
            <Cable color={Palette.accent} size={16} />
            <ThemedText color={Palette.textPrimary} flexShrink={1} fontFamily={FontFamily.semibold} fontSize={15} lineHeight={20} numberOfLines={1}>
              {chargerId}
            </ThemedText>
          </ThemedView>
        </ThemedView>

        <ThemedView alignItems='flex-end' minWidth={66}>
          <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={12} lineHeight={16}>
            {connText}
          </ThemedText>
        </ThemedView>
      </ThemedView>

      {/* Middle row: Status Pill and Time */}
      <ThemedView flexDirection='row' flexWrap='wrap' gap={'two'} alignItems='center'>
        <StatusPill label={status} tone={isWarning ? 'danger' : 'neutral'} customColor={color} />
        <ThemedView
          alignItems='center'
          backgroundColor={Palette.surfaceMuted}
          borderColor={Palette.borderSubtle}
          borderRadius={'small'}
          borderWidth={1}
          flexDirection='row'
          gap={'one'}
          paddingHorizontal={'two'}
          paddingVertical={'one'}>
          <Clock color={Palette.textSecondary} size={12} />
          <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.medium} fontSize={11} lineHeight={15}>
            {formatShortTime(item.timestamp || item.receivedAt)}
          </ThemedText>
        </ThemedView>
      </ThemedView>

      {!!displayText && <ThemedView backgroundColor={Palette.borderSubtle} height={1} />}

      {/* Bottom row: Raw log info */}
      {!!displayText && (
        <ThemedView alignItems='flex-start' flexDirection='row' gap={'two'}>
          <ThemedView
            alignItems='center'
            backgroundColor={isWarning ? '#FFF1F0' : Palette.surfaceMuted}
            borderRadius={16}
            height={32}
            justifyContent='center'
            width={32}>
            {isWarning ? <AlertCircle color={Palette.danger} size={16} /> : <Zap color={Palette.textSecondary} size={16} />}
          </ThemedView>
          <ThemedView flex={1} gap={'one'} justifyContent='center' minWidth={0}>
            <ThemedText color={textColor} fontFamily={FontFamily.regular} fontSize={13} lineHeight={18}>
              {displayText}
            </ThemedText>
          </ThemedView>
        </ThemedView>
      )}
    </ThemedView>
  );
}
