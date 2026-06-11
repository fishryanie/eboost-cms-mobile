import { StyleSheet } from 'react-native';

import { ICON_BOX, LABEL_PAD, TAB_HEIGHT } from './motion';

const layoutStyles = StyleSheet.create({
  card: {
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  cardShadow: {
    borderRadius: 28,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
  dock: {
    alignItems: 'center',
    bottom: 0,
    left: 0,
    paddingTop: 8,
    position: 'absolute',
    right: 0,
  },
  measure: {
    left: -10000,
    opacity: 0,
    position: 'absolute',
    top: -10000,
  },
  panelArea: {
    flex: 1,
    overflow: 'hidden',
    width: '100%',
  },
  panelLayer: {
    left: 0,
    position: 'absolute',
    top: 0,
  },
  root: {
    overflow: 'visible',
  },
  toolbarRow: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 2,
    padding: 6,
  },
});

const tabStyles = StyleSheet.create({
  fixedLabel: {
    flexShrink: 0,
  },
  holdCircle: {
    borderRadius: 18,
    height: 36,
    left: (ICON_BOX - 36) / 2,
    position: 'absolute',
    top: (TAB_HEIGHT - 36) / 2,
    width: 36,
  },
  iconBox: {
    height: TAB_HEIGHT,
    width: ICON_BOX,
  },
  iconLayer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  measureLabel: {
    left: -10000,
    opacity: 0,
    position: 'absolute',
    top: -10000,
  },
  tabLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  tabLabelWrap: {
    height: TAB_HEIGHT,
    justifyContent: 'center',
    overflow: 'hidden',
    paddingRight: LABEL_PAD,
  },
  tabMorph: {
    alignItems: 'center',
    borderRadius: TAB_HEIGHT / 2,
    flexDirection: 'row',
    height: TAB_HEIGHT,
    overflow: 'hidden',
  },
});

export { layoutStyles, tabStyles };
