import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { clampZoomOffset, getZoomOffsetLimit } from './zoom-bounds';

describe('zoom bounds', () => {
  it('does not allow panning when the image is not zoomed', () => {
    assert.equal(getZoomOffsetLimit({ containerSize: 320, scale: 1 }), 0);
    assert.equal(clampZoomOffset({ containerSize: 320, offset: 80, scale: 1 }), 0);
  });

  it('limits panning to half of the extra scaled size', () => {
    assert.equal(getZoomOffsetLimit({ containerSize: 320, scale: 3 }), 320);
    assert.equal(clampZoomOffset({ containerSize: 320, offset: 500, scale: 3 }), 320);
    assert.equal(clampZoomOffset({ containerSize: 320, offset: -500, scale: 3 }), -320);
  });
});
