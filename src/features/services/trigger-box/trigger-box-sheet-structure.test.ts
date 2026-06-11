import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const source = readFileSync(new URL('./trigger-box-sheet.tsx', import.meta.url), 'utf8');

describe('trigger box sheet structure', () => {
  it('uses Gorhom bottom sheet controls for charger search and selection', () => {
    assert.match(source, /BottomSheetModal/);
    assert.match(source, /BottomSheetTextInput/);
    assert.match(source, /BottomSheetFooter/);
    assert.doesNotMatch(source, /FloatingTextInput/);
    assert.match(source, /selectedChargerId/);
    assert.match(source, /Confirm/);
  });

  it('keeps the title and search sticky while the charger rows scroll', () => {
    assert.match(source, /ListHeaderComponent=/);
    assert.match(source, /stickyHeaderIndices=\{\[0\]\}/);
    assert.match(source, /styles\.stickyHeader/);
    assert.match(source, /<BottomSheetTextInput/);
  });

  it('uses flat list rows and a full-width bottom footer', () => {
    assert.match(source, /bottomInset=\{0\}/);
    assert.match(source, /paddingBottom: bottom/);
    assert.match(source, /styles\.chargerSeparator/);
    assert.doesNotMatch(source, /chargerItemSelected:\s*\{[^}]*backgroundColor/s);
    assert.doesNotMatch(source, /chargerItem:\s*\{[^}]*borderRadius/s);
  });
});
