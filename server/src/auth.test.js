import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSessionToken, verifySessionToken } from './auth.js';

process.env.APP_PASSWORD = 'test-password';

test('виданий токен сесії проходить перевірку', () => {
  assert.equal(verifySessionToken(createSessionToken()), true);
});

test('підроблений або порожній токен не проходить', () => {
  const [expires] = createSessionToken().split('.');
  assert.equal(verifySessionToken(`${expires}.підробка`), false);
  assert.equal(verifySessionToken(''), false);
  assert.equal(verifySessionToken(null), false);
});

test('прострочений токен не проходить', () => {
  const old = createSessionToken(Date.now() - 31 * 24 * 60 * 60 * 1000);
  assert.equal(verifySessionToken(old), false);
});

test('після зміни пароля старі сесії недійсні', () => {
  const token = createSessionToken();
  process.env.APP_PASSWORD = 'another-password';
  assert.equal(verifySessionToken(token), false);
  process.env.APP_PASSWORD = 'test-password';
});
