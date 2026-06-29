import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const source = readFileSync(new URL('../index.tsx', import.meta.url), 'utf8');
const headerSource = readFileSync(new URL('../../../home-header.tsx', import.meta.url), 'utf8');

describe('ScrollableSearch panel integration', () => {
  it('exposes a themed search panel for the home header overlay', () => {
    assert.match(source, /SearchPanel/);
    assert.match(source, /SearchInput/);
    assert.match(source, /ThemedView/);
    assert.match(source, /ThemedText/);
    assert.doesNotMatch(source, /backgroundColor: "#0A0A0A"/);
  });

  it('renders searchable rows and an empty state', () => {
    assert.match(source, /filteredItems/);
    assert.match(source, /No results found/);
    assert.match(source, /onSelect/);
  });

  it('opens scrollable search from the home header search icon', () => {
    assert.match(headerSource, /searchOpen/);
    assert.match(headerSource, /ScrollableSearch\.SearchPanel/);
    assert.match(headerSource, /accessibilityLabel='Search'/);
    assert.match(headerSource, /onPress=\{\(\) => setSearchOpen\(true\)\}/);
  });
});
