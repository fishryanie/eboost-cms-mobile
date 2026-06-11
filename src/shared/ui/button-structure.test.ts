import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const projectRoot = process.cwd();

test('shared button exposes the scale animated implementation used by login', () => {
  const buttonSource = readFileSync(join(projectRoot, 'src/shared/ui/button.tsx'), 'utf8');
  const loginSource = readFileSync(join(projectRoot, 'src/app/login.tsx'), 'utf8');

  assert.match(buttonSource, /export function ScaleAnimatedButton/);
  assert.match(buttonSource, /useSharedValue/);
  assert.match(buttonSource, /useAnimatedStyle/);
  assert.match(buttonSource, /withTiming/);
  assert.match(buttonSource, /ActivityIndicator/);
  assert.match(buttonSource, /base: \{(?:(?!\n  block:)[\s\S])*alignSelf: 'stretch'/);
  assert.match(loginSource, /<AppButton[\s\S]*label='Sign in'/);
  assert.doesNotMatch(loginSource, /styles\.signInButton/);
  assert.doesNotMatch(loginSource, /styles\.biometricButton/);
});
