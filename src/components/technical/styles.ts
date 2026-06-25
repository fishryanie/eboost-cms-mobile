import { StyleSheet } from 'react-native';
import { FontFamily, Palette } from 'themes';
import { mhs } from 'themes/scaling';
import { screenHorizontalPadding } from './common';

export const styles = StyleSheet.create({
  issueNavButton: {
    alignItems: 'center',
    height: 34,
    justifyContent: 'center',
    marginLeft: -6,
    width: 34,
  },
  content: {
    gap: mhs(12),
    paddingBottom: 120,
    paddingTop: mhs(8),
  },
  connectorStrip: {
    backgroundColor: '#F8FAFC',
    borderColor: '#EEF2F6',
    borderRadius: mhs(12),
    borderWidth: 1,
    minHeight: 42,
    paddingHorizontal: mhs(8),
    paddingVertical: mhs(8),
  },
  connectorPanelWarning: {
    backgroundColor: Palette.dangerSurface,
    borderColor: '#F5B5AE',
  },
  connectorRetryButton: {
    alignItems: 'center',
    backgroundColor: Palette.surfaceRaised,
    borderColor: '#F5B5AE',
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 28,
    justifyContent: 'center',
    paddingHorizontal: mhs(8),
  },
  connectorTotal: {
    fontVariant: ['tabular-nums'],
  },
  circularProgressCenter: {
    height: 42,
    position: 'absolute',
    width: 42,
  },
  circularProgressWrap: {
    height: 64,
    width: 64,
  },
  compactStat: {
    backgroundColor: '#F8FAFC',
    borderColor: '#EEF2F6',
    borderRadius: mhs(12),
    borderWidth: 1,
    gap: 2,
    minHeight: 44,
    paddingHorizontal: mhs(8),
    paddingVertical: mhs(4),
  },
  dashboardSection: {
    marginTop: mhs(4),
  },
  domainApiMeta: {
    textAlign: 'right',
    width: 76,
  },
  domainApiRow: {
    minHeight: 42,
  },
  domainApiTrack: {
    backgroundColor: '#EEF2F6',
    borderRadius: 999,
    flex: 1,
    height: 6,
    overflow: 'hidden',
  },
  domainDivider: {
    backgroundColor: '#EEF2F6',
    height: 1,
  },
  domainDot: {
    borderRadius: 999,
    height: 7,
    width: 7,
  },
  domainDonutCenter: {
    height: 48,
    position: 'absolute',
    width: 48,
  },
  domainDonutWrap: {
    height: 82,
    width: 82,
  },
  domainReadiness: {
    fontVariant: ['tabular-nums'],
  },
  domainRouteIndex: {
    textAlign: 'center',
    width: 14,
  },
  domainRoutePercent: {
    textAlign: 'right',
    width: 38,
  },
  itemCard: {
    alignItems: 'center',
    backgroundColor: Palette.surfaceRaised,
    borderColor: Palette.borderSubtle,
    borderRadius: mhs(16),
    borderWidth: 1,
    flexDirection: 'row',
    gap: mhs(12),
    marginHorizontal: screenHorizontalPadding,
    minHeight: 64,
    paddingHorizontal: mhs(12),
    paddingVertical: mhs(8),
  },
  itemCardWarning: {
    backgroundColor: Palette.dangerSurface,
    borderColor: '#F5B5AE',
  },
  issueCard: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderBottomColor: '#EEF2F6',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: mhs(12),
    minHeight: 58,
    paddingVertical: mhs(8),
  },
  issueFilterChip: {
    alignItems: 'center',
    backgroundColor: Palette.surfaceRaised,
    borderColor: '#EEF2F6',
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 30,
    justifyContent: 'center',
    paddingHorizontal: mhs(12),
  },
  issueFilterChipActive: {
    backgroundColor: '#E8F7EF',
    borderColor: '#D8F0E3',
  },
  issueHeader: {
    backgroundColor: Palette.surfaceBase,
  },
  issueLargeTitleContainer: {
    marginHorizontal: -screenHorizontalPadding,
  },
  issueAge: {
    textAlign: 'right',
    width: 54,
  },
  issueListContent: {
    paddingBottom: 40,
    paddingHorizontal: screenHorizontalPadding,
  },
  issueSearchInput: {
    color: Palette.textPrimary,
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: 13,
    minHeight: 40,
    paddingVertical: 0,
  },
  issueSearchWrap: {
    backgroundColor: '#F6F8FA',
    borderRadius: 999,
    minHeight: 42,
    paddingHorizontal: mhs(12),
  },
  issueSegmentedControl: {
    gap: mhs(8),
  },
  issueVehicleRail: {
    borderRadius: 999,
    height: 34,
    width: 3,
  },
  networkMarker: {
    borderRadius: 999,
    height: 7,
    width: 7,
  },
  networkFlatBlock: {
    gap: mhs(8),
  },
  networkReadyValue: {
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
  },
  overviewButton: {
    alignItems: 'center',
    backgroundColor: '#E8F7EF',
    borderRadius: 999,
    minHeight: 32,
    justifyContent: 'center',
    paddingHorizontal: mhs(12),
  },
  pressed: {
    opacity: 0.72,
  },
  progressTrack: {
    backgroundColor: '#EEF2F6',
    borderRadius: 999,
    height: 6,
  },

  searchInput: {
    color: Palette.textPrimary,
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: 14,
    minHeight: 42,
    paddingVertical: 0,
  },
  searchWrap: {
    backgroundColor: Palette.surfaceMuted,
    borderColor: Palette.borderSubtle,
    borderRadius: mhs(21),
    borderWidth: 1,
    minHeight: 44,
    paddingHorizontal: mhs(12),
  },
  sectionAction: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  serviceGrid: {
    rowGap: mhs(16),
    width: '100%',
  },
  serviceIconSurface: {
    alignItems: 'center',
    backgroundColor: Palette.antiFlashWhite,
    borderRadius: mhs(16),
    height: mhs(56),
    justifyContent: 'center',
    width: mhs(56),
  },
  serviceShortcut: {
    alignItems: 'center',
    gap: mhs(6),
    minHeight: 88,
    justifyContent: 'flex-start',
    paddingHorizontal: mhs(4),
  },
  serviceRow: {
    width: '100%',
  },
  signalChip: {
    backgroundColor: Palette.surfaceMuted,
    borderRadius: mhs(12),
    gap: 1,
    maxWidth: 118,
    minHeight: 44,
    paddingHorizontal: mhs(8),
    paddingVertical: mhs(4),
    width: 108,
  },
  signalRow: {
    gap: mhs(8),
  },
  signalStrip: {
    backgroundColor: Palette.surfaceRaised,
    borderColor: Palette.borderSubtle,
    borderRadius: mhs(16),
    borderWidth: 1,
    minHeight: 86,
    padding: mhs(12),
  },
  statusMetadataLine: {
    columnGap: 0,
    rowGap: 1,
  },
  vehicleChip: {
    alignItems: 'center',
    backgroundColor: Palette.surfaceMuted,
    borderColor: Palette.borderSubtle,
    borderRadius: mhs(16),
    borderWidth: 1,
    flex: 1,
    minHeight: 36,
    justifyContent: 'center',
  },
  vehicleChipActive: {
    backgroundColor: Palette.accent,
    borderColor: Palette.accent,
  },
  vehicleInlineMeta: {
    columnGap: 0,
    rowGap: 1,
  },
  vehicleNetworkLane: {
    backgroundColor: 'transparent',
    borderTopColor: '#EEF2F6',
    borderTopWidth: 1,
    gap: mhs(8),
    paddingTop: mhs(8),
  },
  vehicleNetworkLaneFirst: {
    borderTopWidth: 0,
    paddingTop: 0,
  },
  vehicleProgressColumn: {
    width: 64,
  },
});
