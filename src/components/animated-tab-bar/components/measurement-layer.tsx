import { memo, type ComponentProps, type FC, type FunctionComponent, type JSX, type ReactElement, type ReactNode } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
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
      <View pointerEvents='none' style={{ left: -10000, opacity: 0, position: 'absolute', top: -10000 }}>
        {items.map(item => (
          <View
            key={item.key}
            onLayout={(event: LayoutChangeEvent) => {
              const { width, height } = event.nativeEvent.layout;
              onMeasure(item.key, Math.ceil(width), Math.ceil(height));
            }}>
            <PopupBody colors={colors} onClose={() => undefined} route={item.route} view={item.key} />
          </View>
        ))}
      </View>
    );
  },
);

MeasurementLayer.displayName = 'MeasurementLayer';

export { MeasurementLayer };
