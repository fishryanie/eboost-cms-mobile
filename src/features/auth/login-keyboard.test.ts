import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { calculateKeyboardAwareScrollY } from './keyboard-avoidance';

describe('LoginScreen keyboard adjustment', () => {
  it('does not combine KeyboardAvoidingView with automatic keyboard insets', () => {
    const source = readFileSync(new URL('../../app/login.tsx', import.meta.url), 'utf8');

    assert.equal(source.includes('KeyboardAvoidingView'), false);
    assert.equal(source.includes("automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}"), true);
  });

  it('scrolls just enough to keep the card 20px above the keyboard', () => {
    const nextScrollY = calculateKeyboardAwareScrollY({
      cardBottomY: 780,
      currentScrollY: 120,
      gap: 20,
      keyboardTopY: 740,
    });

    assert.equal(nextScrollY, 180);
  });

  it('does not scroll when the card already clears the keyboard gap', () => {
    const nextScrollY = calculateKeyboardAwareScrollY({
      cardBottomY: 700,
      currentScrollY: 120,
      gap: 20,
      keyboardTopY: 740,
    });

    assert.equal(nextScrollY, 120);
  });
});
