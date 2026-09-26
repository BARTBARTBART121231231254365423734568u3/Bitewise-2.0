import assert from 'node:assert/strict';
import { test } from 'node:test';
import { enqueue, loadOutbox, setOutboxOwner, syncOutbox } from '../src/api.ts';

function storage() {
  const data = new Map();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => { data.set(key, String(value)); },
    removeItem: (key) => { data.delete(key); },
  };
}

test('legacy/unowned outbox cannot become another account’s diary entry', async () => {
  globalThis.localStorage = storage();
  localStorage.setItem('bw2_outbox_v1', JSON.stringify([{ id: 'old', kind: 'diary-create', payload: { date: '2026-01-01' } }]));
  assert.deepEqual(loadOutbox(), []);
  setOutboxOwner('other-account');
  assert.deepEqual(loadOutbox(), []);
  assert.equal(localStorage.getItem('bw2_outbox_v1'), null);
});

test('same account retains queue; logout/deletion and switching accounts clear it', async () => {
  globalThis.localStorage = storage();
  let posts = 0;
  globalThis.fetch = async (path) => {
    if (path === '/api/auth/csrf') return { ok: true, json: async () => ({ token: 'test' }) };
    posts += 1;
    return { ok: true, status: 201, json: async () => ({ id: 'entry' }) };
  };
  setOutboxOwner('alice');
  enqueue({ kind: 'diary-create', payload: { date: '2026-01-01', grams: 80 } });
  setOutboxOwner('alice');
  assert.equal(loadOutbox().length, 1);
  setOutboxOwner('bob');
  assert.deepEqual(loadOutbox(), []);
  assert.deepEqual(await syncOutbox(), { done: 0, conflicts: 0, errors: 0 });
  assert.equal(posts, 0);
  enqueue({ kind: 'diary-create', payload: { date: '2026-01-02', grams: 90 } });
  setOutboxOwner(null);
  setOutboxOwner('alice');
  assert.deepEqual(loadOutbox(), []);
  assert.equal(posts, 0);
});
