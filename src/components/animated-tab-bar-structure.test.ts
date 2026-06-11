import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const projectRoot = process.cwd();

test('animated tab bar implementation lives in components without demo popup content', () => {
  assert.equal(existsSync(join(projectRoot, 'src/motion-tabs')), false);
  assert.equal(existsSync(join(projectRoot, 'src/components/animated-tab-bar/index.tsx')), true);

  const source = readFileSync(join(projectRoot, 'src/components/animated-tab-bar/index.tsx'), 'utf8');

  assert.match(source, /export \{ AnimatedTabBar \}/);
  assert.doesNotMatch(source, /Walter Isaacson|Atomic Habits|Deep Work|Sleep timer|Fiction|Self-help/);
});
