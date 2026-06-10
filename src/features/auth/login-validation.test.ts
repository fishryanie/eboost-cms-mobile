import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseLoginForm } from './login-validation';

describe('parseLoginForm', () => {
  it('returns field errors for an empty form', () => {
    const result = parseLoginForm({ password: '', username: '' });

    assert.equal(result.success, false);
    assert.deepEqual(result.fieldErrors, {
      password: 'Enter your password.',
      username: 'Enter your email.',
    });
  });

  it('returns an email error when username is not an email address', () => {
    const result = parseLoginForm({ password: 'secret', username: 'admin' });

    assert.equal(result.success, false);
    assert.deepEqual(result.fieldErrors, {
      username: 'Enter a valid email address.',
    });
  });

  it('trims the username when the form is valid', () => {
    const result = parseLoginForm({ password: 'secret', username: ' admin@eboost.vn ' });

    assert.equal(result.success, true);
    assert.deepEqual(result.data, {
      password: 'secret',
      username: 'admin@eboost.vn',
    });
  });
});
