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
    assert.match(source, /selectedChargerKey/);
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

  it('uses the sheet top inset instead of changing header height during gestures', () => {
    assert.match(source, /const \{ bottom, top \} = useSafeAreaInsets\(\)/);
    assert.match(source, /topInset=\{top\}/);
    assert.match(source, /paddingTop: Spacing\.two/);
    assert.match(source, /style=\{\[styles\.stickyHeader, headerPadding\]\}/);
    assert.doesNotMatch(source, /sheetIndex/);
    assert.doesNotMatch(source, /onChange=\{setSheetIndex\}/);
  });

  it('renders charger identity with only the unique id bold and station on the next line', () => {
    assert.match(source, /<ThemedText fontFamily=\{FontFamily\.bold\}>\{item\.uniqueId\}<\/ThemedText> \/ \{item\.vendorId\}/);
    assert.match(source, /fontFamily=\{FontFamily\.bold\}>\{item\.uniqueId\}/);
    assert.match(source, /\{item\.stationName \|\| 'No station assigned'\}/);
    assert.doesNotMatch(source, /const chargerIdentity/);
    assert.doesNotMatch(source, /<ThemedText[^>]*fontFamily=\{FontFamily\.bold\}[^>]*>\s*\{item\.vendorId\}/);
  });

  it('uses a stable unique list key when charger ids repeat', () => {
    assert.match(source, /function getUtilityChargerListKey\(charger: UtilityCharger, index: number\)/);
    assert.match(source, /function getUtilityChargerSelectionKey\(charger: UtilityCharger\)/);
    assert.match(source, /keyExtractor=\{\(charger, index\) => getUtilityChargerListKey\(charger, index\)\}/);
    assert.doesNotMatch(source, /keyExtractor=\{charger => String\(charger\.id\)\}/);
    assert.doesNotMatch(source, /item\.id === selectedChargerId/);
  });

  it('supports unlock mode through the shared charger action sheet', () => {
    assert.match(source, /mode\?: 'reset' \| 'trigger' \| 'unlock'/);
    assert.match(source, /requestUnlockBox/);
    assert.match(source, /Unlock Charger/);
    assert.match(source, /submitUnlock/);
  });
});
