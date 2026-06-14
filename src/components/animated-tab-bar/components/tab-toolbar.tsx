import { type ComponentProps, type FC, type FunctionComponent, type JSX, memo, type ReactElement, type ReactNode } from 'react';
import { View } from 'react-native';

import type { ITabToolbarProps } from '../types';
import { MorphTab } from './morph-tab';

const TabToolbar: FC<ITabToolbarProps> & FunctionComponent<ITabToolbarProps> = memo<ITabToolbarProps & ComponentProps<typeof TabToolbar>>(
  ({
    activeKey,
    colors,
    items,
    onLayout,
    onPress,
    view,
  }: ITabToolbarProps & ComponentProps<typeof TabToolbar>): (ReactNode & ReactElement & JSX.Element) | null => {
    return (
      <View style={{ alignItems: 'center', alignSelf: 'center', flexDirection: 'row', gap: 2, padding: 6 }} onLayout={onLayout}>
        {items.map(item => (
          <MorphTab key={item.key} active={activeKey === item.key || view === item.key} colors={colors} item={item} onPress={() => onPress(item)} />
        ))}
      </View>
    );
  },
);

TabToolbar.displayName = 'TabToolbar';

export { TabToolbar };
