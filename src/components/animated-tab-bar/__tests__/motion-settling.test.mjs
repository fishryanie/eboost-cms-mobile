import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const source = readFileSync(new URL('../hooks.ts', import.meta.url), 'utf8');

describe('animated tab bar motion', () => {
  it('does not start nested springs while timing values are updating', () => {
    assert.doesNotMatch(source, /withSpring/);
  });
});
