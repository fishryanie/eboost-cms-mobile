import { type ComponentProps, type FC, type FunctionComponent, type JSX, memo, type ReactElement, type ReactNode } from 'react';
import { ThemedView } from 'components/base';

import type { IPanelStackProps } from '../types';
import { PanelLayer } from './panel-layer';

const PanelStack: FC<IPanelStackProps> & FunctionComponent<IPanelStackProps> = memo<IPanelStackProps & ComponentProps<typeof PanelStack>>(
  ({
    colors,
    direction,
    items,
    onMeasure,
    renderPopupBody,
    view,
  }: IPanelStackProps & ComponentProps<typeof PanelStack>): (ReactNode & ReactElement & JSX.Element) | null => {
    return (
      <ThemedView flex={1} overflow='hidden' width='100%'>
        {items.map(item => (
          <PanelLayer
            key={item.key}
            active={view === item.key}
            colors={colors}
            direction={direction}
            onLayout={onMeasure}
            renderPopupBody={renderPopupBody}
            route={item.route}
            view={item.key}
          />
        ))}
      </ThemedView>
    );
  },
);

PanelStack.displayName = 'PanelStack';

export { PanelStack };
