import { Palette } from 'themes';

export type LocationStatusTheme = {
  accent: string;
  border: string;
  label: string;
  tone: string;
};

const statusThemes = {
  default: { accent: '#365C91', border: '#C5D3E6', tone: '#EDF3FA' },
  operating: { accent: Palette.accent, border: '#B9EBCB', tone: '#EAF8EF' },
  temporaryStop: { accent: '#A65A00', border: '#F0C37E', tone: '#FFF4DF' },
  temporaryUninstalled: { accent: '#BD4718', border: '#F3B596', tone: '#FFF0E8' },
  terminated: { accent: '#C52E45', border: '#F0B6C0', tone: '#FDECEF' },
  uninstalled: { accent: '#526173', border: '#C8D0DA', tone: '#F0F3F6' },
} as const;

export function getLocationStatusTheme(location?: LocationRecord): LocationStatusTheme {
  const label = location?.operationStatus?.label?.trim() || (location?.visible === false ? 'Hidden' : 'Operating');
  const normalized = label.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
  let theme: Omit<LocationStatusTheme, 'label'> = statusThemes.default;

  if (/terminated|deleted|archived/.test(normalized)) {
    theme = statusThemes.terminated;
  } else if (/temp(?:orary|orarily)? uninstalled|temporary uninstall/.test(normalized)) {
    theme = statusThemes.temporaryUninstalled;
  } else if (/uninstalled|decommissioned/.test(normalized)) {
    theme = statusThemes.uninstalled;
  } else if (/temp(?:orary|orarily)? stop|suspended|paused/.test(normalized)) {
    theme = statusThemes.temporaryStop;
  } else if (/operating|active|activated/.test(normalized)) {
    theme = statusThemes.operating;
  }

  return { ...theme, label };
}
