import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getDisplayImageUrl } from './image-url';

describe('getDisplayImageUrl', () => {
  it('keeps absolute image URLs unchanged', () => {
    assert.equal(getDisplayImageUrl('https://cdn.example.test/avatar.png'), 'https://cdn.example.test/avatar.png');
  });

  it('prefixes core API base URL for relative upload paths', () => {
    assert.equal(
      getDisplayImageUrl('/uploads/users/avatar.png', {
        core: 'https://core.example.test/',
      }),
      'https://core.example.test/uploads/users/avatar.png',
    );
  });

  it('returns an empty string when no image path is present', () => {
    assert.equal(getDisplayImageUrl(null, { core: 'https://core.example.test' }), '');
  });
});
