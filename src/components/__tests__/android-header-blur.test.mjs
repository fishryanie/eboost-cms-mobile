import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const homeHeaderSource = readFileSync(new URL('../home-header.tsx', import.meta.url), 'utf8');
const animatedScrollHeaderSource = readFileSync(new URL('../organisms/animated-header-scrollview/index.tsx', import.meta.url), 'utf8');
const animatedFlatListHeaderSource = readFileSync(new URL('../organisms/anmated-header-flatlist/index.tsx', import.meta.url), 'utf8');

describe('Android header blur backgrounds', () => {
  it('uses Android blur support instead of the transparent default fallback', () => {
    for (const source of [homeHeaderSource, animatedScrollHeaderSource, animatedFlatListHeaderSource]) {
      assert.match(source, /blurMethod=['"]dimezisBlurViewSdk31Plus['"]/);
    }
  });

  it('keeps the visible header scrim opaque enough to cover scrolled content', () => {
    assert.match(homeHeaderSource, /rgba\(255,255,255,0\.96\)/);
    assert.match(homeHeaderSource, /rgba\(255,255,255,0\.92\)/);

    for (const source of [animatedScrollHeaderSource, animatedFlatListHeaderSource]) {
      assert.match(source, /rgba\(255,255,255,0\.98\)/);
      assert.match(source, /rgba\(255,255,255,0\.94\)/);
    }
  });
});
