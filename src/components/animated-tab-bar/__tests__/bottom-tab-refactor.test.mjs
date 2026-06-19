import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const src = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const read = path => readFileSync(resolve(src, path), 'utf8');

describe('bottom tab contract', () => {
  it('keeps tab order, labels, icons, and route names', () => {
    const source = read('components/app-tabs.tsx');
    const rows = [...source.matchAll(/icon: '([^']+)', label: '([^']+)', name: '([^']+)'/g)].map(match => match.slice(1));

    assert.deepEqual(rows, [
      ['technical', 'Technical', 'technical/index'],
      ['operation', 'Operation', 'operation/index'],
      ['marketing', 'Marketing', 'marketing/index'],
    ]);
    assert.match(source, /detachInactiveScreens=\{Platform\.OS !== 'ios'\}/);
    assert.match(source, /animation: 'shift'/);
  });

  it('keeps every popup label and destination', () => {
    const target = 'components/animated-tab-bar/popup.tsx';
    const legacy = 'components/animated-tab-bar/components/popup-body.tsx';
    const source = read(existsSync(resolve(src, target)) ? target : legacy);

    for (const value of ['Chargers', 'Meter Hourly', 'Status Logs', 'Energy Differ', 'chargers', 'meter-hourly', 'status-logs', 'energy-differ']) {
      assert.ok(source.includes(value), `missing popup contract value: ${value}`);
    }
    assert.match(source, /cmsMobileSections/);
    assert.match(source, /router\.push/);
  });

  it('uses only the target implementation files', () => {
    assert.ok(existsSync(resolve(src, 'components/animated-tab-bar/popup.tsx')));
    for (const path of ['components', 'hooks', 'motion.ts', 'styles.ts', 'types.ts']) {
      assert.equal(existsSync(resolve(src, `components/animated-tab-bar/${path}`)), false, `${path} should be removed`);
    }
  });

  it('does not update toolbar state when its measured size is unchanged', () => {
    const source = read('components/animated-tab-bar/index.tsx');
    assert.match(source, /current\.h === h && current\.w === w \? current/);
  });
});
