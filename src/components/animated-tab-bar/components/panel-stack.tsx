import { type ComponentProps, type FC, type FunctionComponent, type JSX, memo, type ReactElement, type ReactNode } from 'react';
import { View } from 'react-native';

import type { IPanelStackProps } from '../types';
import { PanelLayer } from './panel-layer';

const PanelStack: FC<IPanelStackProps> & FunctionComponent<IPanelStackProps> = memo<IPanelStackProps & ComponentProps<typeof PanelStack>>(
  ({
    colors,
    direction,
    items,
    onClose,
    onMeasure,
    renderPopupBody,
    view,
  }: IPanelStackProps & ComponentProps<typeof PanelStack>): (ReactNode & ReactElement & JSX.Element) | null => {
    return (
      <View style={{ flex: 1, overflow: 'hidden', width: '100%' }}>
        {items.map(item => (
          <PanelLayer
            key={item.key}
            active={view === item.key}
            colors={colors}
            direction={direction}
            onClose={onClose}
            onLayout={onMeasure}
            renderPopupBody={renderPopupBody}
            route={item.route}
            view={item.key}
          />
        ))}
      </View>
    );
  },
);

PanelStack.displayName = 'PanelStack';

export { PanelStack };
