import assert from 'node:assert/strict';
import test from 'node:test';

import { getUserLoginProvider } from './user-account';
import { getNextUsersPage, parseUsersPage } from './user-pagination';
import { getUserSearchParams } from './user-search';

test('detects social login providers from username prefixes', () => {
  assert.equal(getUserLoginProvider('gg_106562420770462907268'), 'google');
  assert.equal(getUserLoginProvider('a_00112233'), 'apple');
  assert.equal(getUserLoginProvider('user@example.com'), 'normal');
  assert.equal(getUserLoginProvider('eboost-phone'), 'normal');
});

test('detects email searches', () => {
  assert.deepEqual(getUserSearchParams(' user@example.com '), { email: 'user@example.com' });
  assert.deepEqual(getUserSearchParams('nguyenxuanhung'), { email: 'nguyenxuanhung' });
});

test('detects local and country-code phone searches', () => {
  assert.deepEqual(getUserSearchParams('0901105591'), { phoneNumber: '0901105591' });
  assert.deepEqual(getUserSearchParams('84901105591'), { phoneNumber: '84901105591' });
});

test('detects 9 and 10 digit phone searches', () => {
  assert.deepEqual(getUserSearchParams('901105591'), { phoneNumber: '901105591' });
  assert.deepEqual(getUserSearchParams('9011055912'), { phoneNumber: '9011055912' });
});

test('detects numeric IDs outside phone rules', () => {
  assert.deepEqual(getUserSearchParams('3374'), { id: '3374' });
  assert.deepEqual(getUserSearchParams('123456789012'), { id: '123456789012' });
});

test('returns no filter for empty search', () => {
  assert.deepEqual(getUserSearchParams('   '), {});
});

test('parses a Hydra users page', () => {
  const page = parseUsersPage({
    'hydra:member': [{ id: 1 }, { id: 2 }],
    'hydra:totalItems': 5,
    'hydra:view': {
      'hydra:next': '/api/users?itemsPerPage=2&page=2',
    },
  });

  assert.deepEqual(page.items, [{ id: 1 }, { id: 2 }]);
  assert.equal(page.totalItems, 5);
  assert.equal(page.nextPage, 2);
});

test('parses a plain JSON users collection', () => {
  const page = parseUsersPage([{ id: 1 }, { id: 2 }]);

  assert.deepEqual(page.items, [{ id: 1 }, { id: 2 }]);
  assert.equal(page.totalItems, 2);
  assert.equal(page.nextPage, undefined);
});

test('returns no next page at the end of a Hydra collection', () => {
  const page = parseUsersPage({
    'hydra:member': [{ id: 5 }],
    'hydra:totalItems': 5,
    'hydra:view': {},
  });

  assert.equal(page.nextPage, undefined);
  assert.equal(getNextUsersPage(page), undefined);
});
