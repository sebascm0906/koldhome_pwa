import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('protected layout is explicitly force-dynamic', async () => {
  const layout = await readFile(new URL('../app/(protected)/layout.tsx', import.meta.url), 'utf8');

  assert.match(layout, /export const dynamic = ['"]force-dynamic['"]/);
});

test('account actions rethrow Next control-flow errors before fallback handling', async () => {
  const accountActions = await readFile(new URL('../lib/actions/account.ts', import.meta.url), 'utf8');

  assert.match(accountActions, /unstable_rethrow\(error\)/);
});
