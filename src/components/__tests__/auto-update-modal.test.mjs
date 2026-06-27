import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const source = readFileSync(new URL('../auto-update-modal.tsx', import.meta.url), 'utf8');

describe('AutoUpdateModal update flow', () => {
  it('does not re-check for updates after the modal changes state', () => {
    assert.doesNotMatch(source, /}, \[modalState\]\);/);
  });

  it('does not show the update prompt while an update is already pending', () => {
    assert.match(source, /pendingUpdateRef\.current/);
    assert.match(source, /update\.isAvailable[\s\S]*!pendingUpdateRef\.current/);
  });

  it('does not show the update prompt again after the user chooses later', () => {
    assert.match(source, /dismissedUpdateRef\.current/);
    assert.match(source, /dismissedUpdateRef\.current = true/);
    assert.match(source, /!dismissedUpdateRef\.current/);
  });

  it('keeps the progress UI visible for a minimum duration', () => {
    assert.match(source, /MIN_DOWNLOAD_PROGRESS_MS/);
    assert.match(source, /Promise\.all\(\[Updates\.fetchUpdateAsync\(\), waitForMinimumProgressDuration\(\)\]\)/);
  });
});
