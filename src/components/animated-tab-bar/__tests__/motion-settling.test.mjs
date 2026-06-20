import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const source = readFileSync(new URL('../hooks.ts', import.meta.url), 'utf8');
const panelSource = readFileSync(new URL('../panel.tsx', import.meta.url), 'utf8');
const popupSource = readFileSync(new URL('../popup.tsx', import.meta.url), 'utf8');

describe('animated tab bar motion', () => {
  it('does not start nested springs while timing values are updating', () => {
    assert.doesNotMatch(source, /withSpring/);
  });

  it('does not replace intrinsic popup measurements with the animated panel width', () => {
    const visiblePanelSource = panelSource.slice(0, panelSource.indexOf('export function MeasurementLayer'));

    assert.doesNotMatch(visiblePanelSource, /onLayout=.*measure/);
  });

  it('keeps the measured toolbar width while the popup is open', () => {
    assert.doesNotMatch(source, /Math\.max\(toolbar\.minW, toolbar\.w, target\.w\)/);
    assert.doesNotMatch(popupSource, /minWidth=/);
  });
});
