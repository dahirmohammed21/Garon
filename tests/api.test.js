import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../server/app.js';

async function fixture(options = {}) {
  const { app, close } = createApp({ database: ':memory:', env: {}, ...options });
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  return {
    async call(path, data, method = data === undefined ? 'GET' : 'POST', headers = {}) {
      const response = await fetch(`${base}/api${path}`, { method, headers: { 'Content-Type': 'application/json', ...headers }, ...(data === undefined ? {} : { body: JSON.stringify(data) }) });
      return { status: response.status, data: await response.json() };
    },
    async close() { await new Promise(resolve => server.close(resolve)); close(); },
  };
}

test('uppdrag, beslut, agentroll och minne fungerar tillsammans', async t => {
  const f = await fixture(); t.after(() => f.close());
  assert.equal((await f.call('/state')).data.tasks.length, 0);
  const agent = await f.call('/agents', { name: 'Research', role: 'Undersöka idéer' });
  assert.equal(agent.status, 201);
  const created = await f.call('/tasks', { title: 'Undersök en idé', description: 'Skriv en plan', agentId: agent.data.id, requiresApproval: true });
  assert.equal(created.data.status, 'approval');
  assert.equal((await f.call(`/tasks/${created.data.id}`, { status: 'running' }, 'PATCH')).status, 400);
  assert.equal((await f.call(`/tasks/${created.data.id}/decision`, { decision: 'approve' })).data.status, 'pending');
  assert.equal((await f.call(`/tasks/${created.data.id}/decision`, { decision: 'approve' })).status, 409);
  assert.equal((await f.call(`/tasks/${created.data.id}`, { status: 'done', description: '' }, 'PATCH')).data.status, 'done');
  const rejected = await f.call('/tasks', { title: 'Avslå detta', requiresApproval: true });
  assert.equal((await f.call(`/tasks/${rejected.data.id}/decision`, { decision: 'reject' })).data.status, 'cancelled');
  const note = await f.call('/notes', { title: 'Projektidé', content: 'Kunskap som ska finnas kvar.' });
  assert.equal(note.status, 201);
  assert.equal((await f.call('/state')).data.notes[0].content, 'Kunskap som ska finnas kvar.');
  assert.equal((await f.call(`/agents/${agent.data.id}`, { enabled: false }, 'PATCH')).data.enabled, false);
  const exported = await f.call('/export');
  assert.equal(exported.data.tasks.length, 2);
  assert.ok(exported.data.activity.length >= 6);
  assert.equal((await f.call(`/notes/${note.data.id}`, {}, 'DELETE')).status, 200);
  assert.equal((await f.call(`/tasks/${created.data.id}`, {}, 'DELETE')).status, 200);
});

test('validering och främmande webbplatser blockeras', async t => {
  const f = await fixture(); t.after(() => f.close());
  assert.equal((await f.call('/tasks', { title: '   ' })).status, 400);
  assert.equal((await f.call('/tasks', { title: 'Test', priority: 'root' })).status, 400);
  assert.equal((await f.call('/tasks', { title: 'Test', agentId: 'missing' })).status, 404);
  assert.equal((await f.call('/settings', { budget: -1 }, 'PATCH')).status, 400);
  assert.equal((await f.call('/settings', { budget: '100' }, 'PATCH')).status, 400);
  assert.equal((await f.call('/tasks', { title: 'Främmande' }, 'POST', { Origin: 'https://evil.example' })).status, 403);
  assert.equal((await f.call('/tasks', { title: 'Främmande' }, 'POST', { 'Sec-Fetch-Site': 'cross-site' })).status, 403);
  assert.equal((await f.call('/chat', { message: 'Hej' })).status, 503);
});

test('SQLite-data finns kvar efter omstart', async t => {
  const dir = mkdtempSync(join(tmpdir(), 'garon-test-')); const database = join(dir, 'test.sqlite');
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const first = await fixture({ database });
  await first.call('/tasks', { title: 'Beständigt uppdrag' });
  await first.call('/settings', { budget: 4, name: 'Dahir' }, 'PATCH');
  await first.close();
  const second = await fixture({ database }); t.after(() => second.close());
  const state = (await second.call('/state')).data;
  assert.equal(state.tasks[0].title, 'Beständigt uppdrag');
  assert.equal(state.settings.budget, 4);
});

test('AI-anrop sparar verkligt svar och användning, budgeten spärrar nästa anrop', async t => {
  let calls = 0;
  const f = await fixture({ env: { OPENAI_API_KEY: 'test-only' }, fetchImpl: async (url, options) => {
    calls++;
    assert.equal(url, 'https://api.openai.com/v1/chat/completions');
    const body = JSON.parse(options.body);
    assert.equal(body.messages.at(-1).content, 'Hej GARON');
    return Response.json({ choices: [{ message: { content: 'Hej Dahir! Vad vill du planera?' } }], usage: { prompt_tokens: 100, completion_tokens: 20 } });
  } }); t.after(() => f.close());
  assert.equal((await f.call('/chat', { message: 'Hej GARON' })).status, 200);
  const state = (await f.call('/state')).data;
  assert.equal(state.messages.length, 2);
  assert.equal(state.messages[1].role, 'assistant');
  assert.equal(state.usage[0].estimated, false);
  assert.ok(Math.abs(state.ai.spent - 0.000072) < 1e-12);
  await f.call('/settings', { budget: 0 }, 'PATCH');
  assert.equal((await f.call('/chat', { message: 'Får inte skickas' })).status, 402);
  assert.equal(calls, 1);
  assert.ok(!JSON.stringify(state).includes('test-only'));
});

test('Anthropic-format och osäkra anrop hanteras utan simulerade svar', async t => {
  let options;
  const f = await fixture({ env: { ANTHROPIC_API_KEY: 'test-only' }, fetchImpl: async (_url, config) => {
    options = JSON.parse(config.body);
    return Response.json({ content: [{ type: 'text', text: 'En riktig testrespons' }], usage: { input_tokens: 80, output_tokens: 20 } });
  } }); t.after(() => f.close());
  assert.equal((await f.call('/chat', { message: 'Hej' })).data.content, 'En riktig testrespons');
  assert.equal(options.model, 'claude-sonnet-4-20250514');
  assert.ok(options.system.includes('inga verktyg'));
  const broken = await fixture({ env: { OPENAI_API_KEY: 'test-only' }, fetchImpl: async () => { throw new Error('Network'); } }); t.after(() => broken.close());
  assert.equal((await broken.call('/chat', { message: 'Hej' })).status, 502);
  const state = (await broken.call('/state')).data;
  assert.equal(state.messages.length, 0);
  assert.equal(state.usage[0].estimated, true);
  assert.ok(state.ai.spent > 0);
});
