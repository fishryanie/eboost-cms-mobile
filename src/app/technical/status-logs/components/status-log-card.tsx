import { Activity, CircleAlert, CircleCheck, TriangleAlert } from 'lucide-react-native';

import { ThemedText, ThemedView } from 'components/base';
import { FontFamily, Palette } from 'themes';

const OCPP_ERROR_CODE_LABELS: Record<string, string> = {
  A0108: 'Nhấn Emergency Stop',
  A0112: 'Cảm biến cửa',
  A0113: 'Cảnh báo mở nắp bất thường',
  A0302: 'Lỗi giao tiếp OCPP và PCBA',
  A0401: 'Lỗi giao tiếp',
  A0413: 'InputOverVoltage',
  A0416: 'Sai thứ tự lắp đặt',
  A0902: 'Lỗi Contactor',
  A1303: 'Lỗi tiếp địa',
  B0415: 'Không tìm thấy module',
  B0418: 'N/A',
  B2004: 'Lỗi điện áp CP',
  C0402: 'Module mất kết nối',
  D0209: 'Lỗi hiển thị',
};

type StatusTone = 'active' | 'danger' | 'neutral' | 'success' | 'warning';

const DANGER_STATUSES = new Set(['EmergencyStop', 'Faulted', 'NoFuse', 'NoPower', 'NoRelay', 'RelayBroken', 'TotalOverCurrent']);
const WARNING_STATUSES = new Set(['Finishing', 'OverCurrent', 'OverMoney', 'OverTime', 'Preparing', 'Unavailable']);
const SUCCESS_STATUSES = new Set(['Available', 'ChargeFull']);
const ACTIVE_STATUSES = new Set(['Charging', 'Ready', 'Reserved', 'StoppedFromApp', 'SuspendedEV', 'SuspendedEVSE']);

const STATUS_TONES: Record<StatusTone, { accent: string; badge: string; card: string; icon: string }> = {
  active: { accent: '#2563EB', badge: '#E7EFFF', card: Palette.surfaceMuted, icon: '#EAF1FF' },
  danger: { accent: Palette.danger, badge: '#FEE4E2', card: '#FFF7F6', icon: '#FFE9E7' },
  neutral: { accent: Palette.textSecondary, badge: '#EAECF0', card: Palette.surfaceMuted, icon: '#EEF1F4' },
  success: { accent: Palette.accentPressed, badge: '#DFF3E8', card: Palette.surfaceMuted, icon: '#E8F6EE' },
  warning: { accent: '#B54708', badge: '#FEF0C7', card: '#FFFAEB', icon: '#FFF3D6' },
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

function formatErrorCode(errorCode: string) {
  if (!errorCode || errorCode === 'NoError') return '';
  return OCPP_ERROR_CODE_LABELS[errorCode] ? `${errorCode} - ${OCPP_ERROR_CODE_LABELS[errorCode]}` : errorCode;
}

function getStatusTone(status: string, hasError: boolean): StatusTone {
  if (hasError || DANGER_STATUSES.has(status)) return 'danger';
  if (WARNING_STATUSES.has(status)) return 'warning';
  if (SUCCESS_STATUSES.has(status)) return 'success';
  if (ACTIVE_STATUSES.has(status)) return 'active';
  return 'neutral';
}

function StatusIcon({ color, size = 18, tone }: { color: string; size?: number; tone: StatusTone }) {
  if (tone === 'danger') return <CircleAlert color={color} size={size} strokeWidth={2.2} />;
  if (tone === 'warning') return <TriangleAlert color={color} size={size} strokeWidth={2.2} />;
  if (tone === 'success') return <CircleCheck color={color} size={size} strokeWidth={2.2} />;
  return <Activity color={color} size={size} strokeWidth={2.2} />;
}

export function StatusLogCard({ isLast, item, vehicle }: { isLast?: boolean; item: StatusLogRecord; vehicle: TechnicalVehicle }) {
  const status = formatStatus(item.status, vehicle);
  const errorCode = formatErrorCode(item.errorCode || item.error_code || '');
  const vendorErrorCode = formatErrorCode(item.vendorErrorCode || item.vendor_error_code || '');
  const displayText =
    vehicle === 'bike' ? '' : vendorErrorCode || errorCode || (item.info && item.info !== 'Normal event' && item.info !== 'NoError' ? item.info : '');
  const hasError = Boolean(errorCode || vendorErrorCode);
  const tone = getStatusTone(status, hasError);
  const presentation = STATUS_TONES[tone];
  const connectorNumber = item.connectorID ?? item.connector_id ?? '-';
  const boxId = item.chargePointID || item.boxId || item.box_id;
  const chargerId = boxId || (vehicle === 'bike' ? 'Bike charger' : 'Car charger');
  const timestamp = item.timestamp || item.receivedAt;
  const date = timestamp ? new Date(timestamp) : undefined;
  const hasValidDate = Boolean(date && !Number.isNaN(date.getTime()));
  const dateLabel = hasValidDate ? date!.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase() : 'UNKNOWN DATE';
  const weekDay = hasValidDate ? date!.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase() : '---';
  const time = hasValidDate ? date!.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '--:--';

  return (
    <ThemedView flexDirection='row' width='100%'>
      <ThemedView alignItems='center' marginRight={6} width={12}>
        <ThemedView
          backgroundColor={presentation.accent}
          borderColor={Palette.surfaceBase}
          borderRadius={6}
          borderWidth={2}
          height={12}
          marginTop={2}
          width={12}
          zIndex={2}
        />
        {!isLast ? <ThemedView backgroundColor={Palette.border} flex={1} marginBottom={-10} marginTop={-2} width={1} /> : null}
      </ThemedView>

      <ThemedView flex={1} paddingBottom={10}>
        <ThemedView alignItems='center' flexDirection='row' gap={6} paddingBottom={6}>
          <ThemedText color={Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={11} letterSpacing={0.35} selectable>
            {dateLabel}
          </ThemedText>
          <ThemedView backgroundColor={Palette.border} borderRadius={2} height={3} width={3} />
          <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={11} selectable>
            {weekDay} · {time}
          </ThemedText>
        </ThemedView>

        <ThemedView
          backgroundColor={presentation.card}
          borderColor={tone === 'danger' || tone === 'warning' ? presentation.badge : Palette.borderSubtle}
          borderRadius={'small'}
          borderWidth={1}
          overflow='hidden'>
          <ThemedView alignItems='center' flexDirection='row' gap={'two'} paddingHorizontal={'three'} paddingVertical={'two'}>
            <ThemedView alignItems='center' backgroundColor={presentation.icon} borderRadius={9} flexShrink={0} height={30} justifyContent='center' width={30}>
              <StatusIcon color={presentation.accent} size={16} tone={tone} />
            </ThemedView>

            <ThemedView alignItems='center' flex={1} flexDirection='row' gap={6}>
              <ThemedText color={Palette.textPrimary} flex={1} fontFamily={FontFamily.regular} fontSize={14} numberOfLines={1} selectable>
                <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold}>
                  {chargerId}
                </ThemedText>{' '}
                - Slot {connectorNumber}
              </ThemedText>
              <ThemedView
                alignItems='center'
                backgroundColor={presentation.badge}
                borderRadius={'pill'}
                flexDirection='row'
                flexShrink={0}
                gap={3}
                paddingHorizontal={6}
                paddingVertical={2}>
                <StatusIcon color={presentation.accent} size={11} tone={tone} />
                <ThemedText color={presentation.accent} fontFamily={FontFamily.semibold} fontSize={11} lineHeight={15} selectable>
                  {status}
                </ThemedText>
              </ThemedView>
            </ThemedView>
          </ThemedView>

          {displayText ? (
            <ThemedView
              alignItems='center'
              borderColor={tone === 'danger' || tone === 'warning' ? presentation.badge : Palette.borderSubtle}
              borderTopWidth={1}
              flexDirection='row'
              gap={6}
              paddingHorizontal={'three'}
              paddingVertical={7}>
              <StatusIcon color={presentation.accent} size={14} tone={tone} />
              <ThemedText
                color={tone === 'danger' ? presentation.accent : Palette.textSecondary}
                ellipsizeMode='tail'
                flex={1}
                fontFamily={FontFamily.medium}
                fontSize={12}
                lineHeight={17}
                numberOfLines={1}
                selectable>
                {displayText}
              </ThemedText>
            </ThemedView>
          ) : null}
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}
