import { Check, X } from 'lucide-react-native';
import { memo, useState } from 'react';

import { Switch } from '../switch';
import { DEFAULT_BLOB_COLOR, DEFAULT_ICON_COLOR, DEFAULT_OFF_COLOR, DEFAULT_ON_COLOR, DEFAULT_SIZE, DEFAULT_THRESHOLD } from './const';
import type { IGooeySwitch } from './types';

export const GooeySwitch = memo(function GooeySwitch({
  active,
  onToggle,
  size = DEFAULT_SIZE,
  inactiveColor = DEFAULT_OFF_COLOR,
  activeColor = DEFAULT_ON_COLOR,
  trackColor = DEFAULT_BLOB_COLOR,
  iconTint = DEFAULT_ICON_COLOR,
  toggleThreshold = DEFAULT_THRESHOLD,
  isDisabled = false,
  renderActiveIcon,
  renderInactiveIcon,
  ...props
}: IGooeySwitch) {
  const [internalActive, setInternalActive] = useState(active ?? false);
  const currentActive = active ?? internalActive;

  return (
    <Switch
      {...props}
      activeColor={activeColor}
      disabled={isDisabled}
      inactiveColor={inactiveColor}
      iconColor={iconTint}
      onValueChange={nextValue => {
        if (active === undefined) setInternalActive(nextValue);
        onToggle?.(nextValue);
      }}
      renderActiveIcon={({ color }) => renderActiveIcon?.({ color, size: size * 0.12 }) ?? <Check color={color} size={size * 0.12} strokeWidth={3} />}
      renderInactiveIcon={({ color }) => renderInactiveIcon?.({ color, size: size * 0.1 }) ?? <X color={color} size={size * 0.1} strokeWidth={2.5} />}
      size={size}
      toggleThreshold={toggleThreshold}
      trackColor={trackColor}
      value={currentActive}
    />
  );
});

export default GooeySwitch;
