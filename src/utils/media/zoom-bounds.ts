export function getZoomOffsetLimit({ containerSize, scale }: { containerSize: number; scale: number }) {
  'worklet';
  return Math.max(0, (containerSize * scale - containerSize) / 2);
}

export function clampZoomOffset({ containerSize, offset, scale }: { containerSize: number; offset: number; scale: number }) {
  'worklet';
  const limit = getZoomOffsetLimit({ containerSize, scale });
  return Math.min(limit, Math.max(-limit, offset));
}
