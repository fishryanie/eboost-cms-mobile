import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const source = readFileSync(new URL('./FloatingTextInput.tsx', import.meta.url), 'utf8');

describe('FloatingTextInput structure', () => {
  it('does not push input text downward after the label floats', () => {
    assert.doesNotMatch(source, /isFloating && styles\.floatingInput/);
    assert.doesNotMatch(source, /\bfloatingInput:/);
  });
});
