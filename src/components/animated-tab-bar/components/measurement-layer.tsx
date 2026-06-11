import { memo, type ComponentProps, type FC, type FunctionComponent, type JSX, type ReactElement, type ReactNode } from 'react';
import { type LayoutChangeEvent } from 'react-native';
import { ThemedView } from 'components/base';

import type { IMeasurementLayerProps } from '../types';

const MeasurementLayer: FC<IMeasurementLayerProps> & FunctionComponent<IMeasurementLayerProps> = memo<
  IMeasurementLayerProps & ComponentProps<typeof MeasurementLayer>
>(
  ({
    colors,
    items,
    onMeasure,
    renderPopupBody,
  }: IMeasurementLayerProps & ComponentProps<typeof MeasurementLayer>): (ReactNode & ReactElement & JSX.Element) | null => {
    const PopupBody = renderPopupBody;

    return (
      <ThemedView pointerEvents='none' left={-10000} opacity={0} position='absolute' top={-10000}>
        {items.map(item => (
          <ThemedView
            key={item.key}
            onLayout={(event: LayoutChangeEvent) => {
              const { width, height } = event.nativeEvent.layout;
              onMeasure(item.key, Math.ceil(width), Math.ceil(height));
            }}>
            <PopupBody colors={colors} route={item.route} view={item.key} />
          </ThemedView>
        ))}
      </ThemedView>
    );
  },
);

MeasurementLayer.displayName = 'MeasurementLayer';

export { MeasurementLayer };
