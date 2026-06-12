import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const source = readFileSync(new URL('../../app/(tabs)/home.tsx', import.meta.url), 'utf8');

describe('home screen structure', () => {
  it('temporarily hides the CMS service list below quick services', () => {
    assert.doesNotMatch(source, /ListFooterComponent/);
    assert.doesNotMatch(source, /CmsServiceGrid/);
    assert.doesNotMatch(source, /ServiceChildrenSheet/);
  });

  it('opens the replace meter sheet from the quick service shortcut', () => {
    assert.match(source, /ReplaceMeterSheet/);
    assert.match(source, /setReplaceMeterVisible\(true\)/);
    assert.match(source, /item\.slug === 'replace-meter'/);
    assert.match(source, /replaceMeterVisible \? <ReplaceMeterSheet/);
  });
});
