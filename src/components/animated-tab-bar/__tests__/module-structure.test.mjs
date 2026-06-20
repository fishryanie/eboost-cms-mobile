import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const directory = new URL('../', import.meta.url);

describe('animated tab bar module structure', () => {
  it('avoids repeating the directory name in the component filename', () => {
    assert.equal(existsSync(new URL('tab-bar.tsx', directory)), true);
    assert.equal(existsSync(new URL('animated-tab-bar.tsx', directory)), false);
    assert.match(readFileSync(new URL('index.tsx', directory), 'utf8'), /from '\.\/tab-bar'/);
  });

  it('keeps popup row content exactly 12px from both edges', () => {
    const popupSource = readFileSync(new URL('popup.tsx', directory), 'utf8');

    assert.doesNotMatch(popupSource, /<ThemedView[^>]*paddingHorizontal=\{12\}[^>]*marginTop=\{8\}[^>]*width='100%'/);
    assert.match(popupSource, /gap: 12,[\s\S]*paddingHorizontal: 12,/);
    assert.match(popupSource, /<ThemedText[^>]*flex=\{1\}/);
  });
});
