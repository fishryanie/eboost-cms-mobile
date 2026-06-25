import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, it } from 'node:test';

const projectRoot = new URL('../../../..', import.meta.url).pathname;

function collectFiles(dir) {
  return readdirSync(dir).flatMap(entry => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return collectFiles(path);
    return /\.(tsx|ts)$/.test(path) ? [path] : [];
  });
}

describe('screen loading states', () => {
  it('uses ThemedView loading instead of screen-level ActivityIndicator', () => {
    const screenFiles = collectFiles(join(projectRoot, 'app'));
    const helperFiles = [
      join(projectRoot, 'components/technical/list-ui.tsx'),
      join(projectRoot, 'components/technical/charging-profile-chart.tsx'),
    ];

    const offenders = [...screenFiles, ...helperFiles].filter(path => readFileSync(path, 'utf8').includes('ActivityIndicator'));

    assert.deepEqual(
      offenders.map(path => relative(projectRoot, path)).sort(),
      [],
    );
  });
});
