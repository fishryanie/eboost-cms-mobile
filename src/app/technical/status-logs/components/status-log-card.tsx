import { ThemedText, ThemedView } from 'components/base';
import { FontFamily, Palette } from 'themes';

const STATUS_COLORS: Record<string, string> = {
  Available: '#52C41A',
  ChargeFull: '#52C41A',
  Charging: '#13C2C2',
  EmergencyStop: '#FF4D4F',
  Faulted: '#FF4D4F',
  Finishing: '#EB2F96',
  NoFuse: '#EB2F96',
  NoPower: '#FA541C',
  NoRelay: '#722ED1',
  OverCurrent: '#FA8C16',
  OverMoney: '#FAAD14',
  OverTime: '#2F54EB',
  Preparing: '#FAAD14',
  Ready: '#1677FF',
  RelayBroken: '#FF85C0',
  Reserved: '#722ED1',
  StoppedFromApp: '#A0D911',
  SuspendedEV: '#1677FF',
  SuspendedEVSE: '#2F54EB',
  TotalOverCurrent: '#F5222D',
  Unavailable: '#FA8C16',
  Unplugged: '#8C8C8C',
  default: '#98A2B3',
};

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

export function StatusLogCard({ isLast, item, vehicle }: { isLast?: boolean; item: StatusLogRecord; vehicle: TechnicalVehicle }) {
  const status = formatStatus(item.status, vehicle);
  const color = STATUS_COLORS[status] || STATUS_COLORS.default;
  const errorCode = formatErrorCode(item.errorCode || item.error_code || '');
  const vendorErrorCode = formatErrorCode(item.vendorErrorCode || item.vendor_error_code || '');
  const displayText = vendorErrorCode || errorCode || (item.info && item.info !== 'Normal event' && item.info !== 'NoError' ? item.info : '');
  const isWarning = Boolean(errorCode || vendorErrorCode || displayText || status === 'Faulted' || status === 'NoPower');
  const connectorPrefix = vehicle === 'bike' ? 'O' : 'C';
  const connectorNumber = item.connectorID ?? item.connector_id ?? '-';
  const timestamp = item.timestamp || item.receivedAt;
  const date = timestamp ? new Date(timestamp) : undefined;
  const hasValidDate = Boolean(date && !Number.isNaN(date.getTime()));
  const day = hasValidDate ? date!.getDate().toString() : '--';
  const month = hasValidDate ? (date!.getMonth() + 1).toString() : '';
  const weekDay = hasValidDate ? ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][date!.getDay()] : '---';
  const time = hasValidDate ? date!.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '--:--';

  return (
    <ThemedView flexDirection='row' paddingHorizontal={'four'} width='100%'>
      <ThemedView alignItems='center' marginRight={'three'} width={44}>
        <ThemedText color={Palette.accent} fontFamily={FontFamily.bold} fontSize={16}>
          {day}
          {month ? (
            <ThemedText color={Palette.accent} fontFamily={FontFamily.bold} fontSize={11}>
              /{month}
            </ThemedText>
          ) : null}
        </ThemedText>
        <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.regular} fontSize={10} marginTop={'one'}>
          {time}
        </ThemedText>
        <ThemedText color={Palette.textTertiary} fontFamily={FontFamily.medium} fontSize={11}>
          {weekDay}
        </ThemedText>
      </ThemedView>

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
        {!isLast ? <ThemedView backgroundColor={Palette.borderSubtle} flex={1} marginBottom={-24} marginTop={-8} width={2} /> : null}
      </ThemedView>

      <ThemedView flex={1} paddingBottom={'five'}>
        <ThemedText color={Palette.textPrimary} fontFamily={FontFamily.bold} fontSize={15} selectable>
          {connectorPrefix}
          {connectorNumber}-{status}
        </ThemedText>
        {displayText ? (
          <ThemedText color={isWarning ? Palette.danger : color} fontFamily={FontFamily.regular} fontSize={13} marginTop={'one'} numberOfLines={2} selectable>
            {displayText}
          </ThemedText>
        ) : null}
      </ThemedView>
    </ThemedView>
  );
}
