import express from 'express';
import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const statuses = ['pending', 'running', 'done', 'cancelled', 'approval'];
const now = () => new Date().toISOString();
const id = () => randomUUID();
function fail(message, status = 400) { throw Object.assign(new Error(message), { status }); }
function text(value, label, max = 500) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) fail(`${label} måste innehålla 1–${max} tecken.`);
  return value.trim();
}

export function createApp({ database = '.garon/garon.sqlite', env = process.env, fetchImpl = fetch } = {}) {
  if (database !== ':memory:') mkdirSync(dirname(resolve(database)), { recursive: true });
  const db = new DatabaseSync(database);
  db.exec(`PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS entities (id TEXT PRIMARY KEY, kind TEXT NOT NULL, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY CHECK(id=1), data TEXT NOT NULL);
    INSERT OR IGNORE INTO settings VALUES (1, '{"budget":10,"name":"Dahir"}');`);
  const all = kind => db.prepare('SELECT data FROM entities WHERE kind=? ORDER BY rowid DESC').all(kind).map(row => JSON.parse(row.data));
  const get = (kind, key) => all(kind).find(row => row.id === key) || fail('Posten finns inte längre.', 404);
  const put = (kind, item) => { db.prepare('INSERT INTO entities VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET data=excluded.data').run(item.id, kind, JSON.stringify(item)); return item; };
  const remove = key => db.prepare('DELETE FROM entities WHERE id=?').run(key);
  const settings = () => JSON.parse(db.prepare('SELECT data FROM settings WHERE id=1').get().data);
  const activity = (title, detail, type = 'info') => put('activity', { id: id(), title, detail, type, createdAt: now() });
  const provider = env.OPENAI_API_KEY ? 'openai' : env.ANTHROPIC_API_KEY ? 'anthropic' : null;
  const defaultModel = provider === 'openai' ? 'gpt-4.1-mini' : 'claude-sonnet-4-20250514';
  const model = (provider === 'openai' ? env.OPENAI_MODEL : env.ANTHROPIC_MODEL) || defaultModel;
  // Conservative reservation: known models only, one request at a time, monthly UTC budget.
  const rates = { 'gpt-4.1-mini': [0.4, 1.6], 'claude-sonnet-4-20250514': [3, 15] };
  const used = () => all('usage').filter(row => row.createdAt.slice(0, 7) === now().slice(0, 7)).reduce((sum, row) => sum + row.cost, 0);
  let chatBusy = false;
  const app = express();
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'same-origin');
    if (req.path.startsWith('/api') && !['GET', 'HEAD'].includes(req.method)) {
      if (req.get('sec-fetch-site') === 'cross-site') return res.status(403).json({ error: 'Begäran från en annan webbplats nekades.' });
      const origin = req.get('origin');
      if (origin) {
        let host;
        try { host = new URL(origin).host; } catch { return res.status(403).json({ error: 'Ogiltigt ursprung.' }); }
        const allowed = new Set([req.get('host'), 'localhost:5173', '127.0.0.1:5173']);
        if (!allowed.has(host)) return res.status(403).json({ error: 'Begäran från en annan webbplats nekades.' });
      }
      if (!req.is('application/json')) return res.status(415).json({ error: 'Begäran måste vara JSON.' });
    }
    next();
  });
  app.use(express.json({ limit: '128kb' }));
  app.get('/api/health', (_req, res) => res.json({ ok: true, storage: 'sqlite' }));
  app.get('/api/state', (_req, res) => res.json({
    tasks: all('task'), agents: all('agent'), notes: all('note'), activity: all('activity').slice(0, 200),
    messages: all('message').reverse(), usage: all('usage'), settings: settings(),
    ai: { provider, model: provider ? model : null, configured: Boolean(provider), pricingSupported: Boolean(rates[model]), spent: used(), busy: chatBusy },
  }));
  app.post('/api/tasks', (req, res) => {
    const title = text(req.body.title, 'Uppdragets namn', 160);
    const description = typeof req.body.description === 'string' ? req.body.description.trim().slice(0, 3000) : '';
    const priority = req.body.priority || 'normal';
    if (!['low', 'normal', 'high'].includes(priority)) fail('Ogiltig prioritet.');
    if (req.body.agentId) get('agent', req.body.agentId);
    const task = put('task', { id: id(), title, description, priority, agentId: req.body.agentId || null, status: req.body.requiresApproval ? 'approval' : 'pending', createdAt: now(), updatedAt: now() });
    activity('Nytt uppdrag', title, task.status === 'approval' ? 'warning' : 'info');
    res.status(201).json(task);
  });
  app.patch('/api/tasks/:id', (req, res) => {
    const task = get('task', req.params.id);
    if (req.body.status !== undefined) {
      if (!statuses.includes(req.body.status) || req.body.status === 'approval') fail('Ogiltig uppdragsstatus.');
      if (task.status === 'approval') fail('Uppdraget måste godkännas eller avslås först.');
      task.status = req.body.status;
    }
    if (req.body.title !== undefined) task.title = text(req.body.title, 'Uppdragets namn', 160);
    if (req.body.description !== undefined) {
      if (typeof req.body.description !== 'string' || req.body.description.length > 3000) fail('Beskrivningen får innehålla högst 3 000 tecken.');
      task.description = req.body.description.trim();
    }
    task.updatedAt = now();
    put('task', task);
    activity('Uppdrag uppdaterat', task.title, task.status === 'done' ? 'success' : 'info');
    res.json(task);
  });
  app.post('/api/tasks/:id/decision', (req, res) => {
    const task = get('task', req.params.id);
    if (task.status !== 'approval') fail('Uppdraget väntar inte på godkännande.', 409);
    if (!['approve', 'reject'].includes(req.body.decision)) fail('Välj godkänn eller avslå.');
    task.status = req.body.decision === 'approve' ? 'pending' : 'cancelled';
    task.updatedAt = now();
    put('task', task);
    activity(req.body.decision === 'approve' ? 'Uppdrag godkänt' : 'Uppdrag avslaget', task.title, req.body.decision === 'approve' ? 'success' : 'warning');
    res.json(task);
  });
  app.delete('/api/tasks/:id', (req, res) => { const task = get('task', req.params.id); remove(task.id); activity('Uppdrag borttaget', task.title); res.json({ ok: true }); });
  app.post('/api/agents', (req, res) => {
    const agent = put('agent', { id: id(), name: text(req.body.name, 'Agentens namn', 80), role: text(req.body.role, 'Agentens roll', 500), enabled: true, createdAt: now() });
    activity('Agentkonfiguration skapad', agent.name);
    res.status(201).json(agent);
  });
  app.patch('/api/agents/:id', (req, res) => { const agent = get('agent', req.params.id); if (typeof req.body.enabled !== 'boolean') fail('Ange om agenten är aktiverad.'); agent.enabled = req.body.enabled; put('agent', agent); activity(agent.enabled ? 'Agentkonfiguration aktiverad' : 'Agentkonfiguration pausad', agent.name); res.json(agent); });
  app.post('/api/notes', (req, res) => { const note = put('note', { id: id(), title: text(req.body.title, 'Rubrik', 160), content: text(req.body.content, 'Anteckning', 10000), createdAt: now() }); activity('Minne sparat', note.title, 'success'); res.status(201).json(note); });
  app.delete('/api/notes/:id', (req, res) => { const note = get('note', req.params.id); remove(note.id); activity('Minne borttaget', note.title); res.json({ ok: true }); });
  app.patch('/api/settings', (req, res) => {
    const next = settings();
    if (req.body.budget !== undefined) { if (typeof req.body.budget !== 'number' || !Number.isFinite(req.body.budget) || req.body.budget < 0 || req.body.budget > 10000) fail('Budgeten måste vara mellan 0 och 10 000 USD.'); next.budget = req.body.budget; }
    if (req.body.name !== undefined) next.name = text(req.body.name, 'Ditt namn', 60);
    db.prepare('UPDATE settings SET data=? WHERE id=1').run(JSON.stringify(next));
    res.json(next);
  });
  app.get('/api/export', (_req, res) => { res.setHeader('Content-Disposition', 'attachment; filename="garon-export.json"'); res.json({ exportedAt: now(), tasks: all('task'), agents: all('agent'), notes: all('note'), messages: all('message').reverse(), activity: all('activity'), usage: all('usage'), settings: settings() }); });
  app.post('/api/chat', async (req, res) => {
    const message = text(req.body.message, 'Meddelandet', 6000);
    if (!provider) fail('Ingen AI-modell är ansluten. Lägg till OPENAI_API_KEY eller ANTHROPIC_API_KEY i .env och starta om servern.', 503);
    if (!rates[model]) fail('Modellens pris saknas. Välj standardmodellen för att behålla budgetkontrollen.', 400);
    if (chatBusy) fail('GARON svarar redan. Vänta tills svaret är klart.', 409);
    const history = all('message').reverse().slice(-12).map(({ role, content }) => ({ role, content }));
    const system = 'Du är GARON, Dahirs personliga AI-assistent. Svara på enkel svenska. Du kan diskutera och planera, men har inga verktyg för att utföra åtgärder. Påstå aldrig att du startat agenter, skapat uppdrag, läst minne eller ändrat data. Användaren gör det via gränssnittet. Ange tydligt dina begränsningar.';
    const messages = [...history, { role: 'user', content: message }];
    const [inputRate, outputRate] = rates[model];
    // UTF-8 bytes upper-bound ordinary text tokens; reserve output plus protocol overhead.
    const inputBound = messages.reduce((sum, item) => sum + Buffer.byteLength(item.content) + 100, Buffer.byteLength(system) + 1000);
    const reserve = (inputBound * inputRate + 1024 * outputRate) / 1e6;
    if (used() + reserve > settings().budget) fail('Månadsbudgeten räcker inte för ett nytt svar. Justera budgeten under Inställningar.', 402);
    chatBusy = true;
    const usage = put('usage', { id: id(), createdAt: now(), model, cost: reserve, estimated: true, inputTokens: 0, outputTokens: 0 });
    try {
      const isOpenAI = provider === 'openai';
      const response = await fetchImpl(isOpenAI ? 'https://api.openai.com/v1/chat/completions' : 'https://api.anthropic.com/v1/messages', {
        method: 'POST', signal: AbortSignal.timeout(60000),
        headers: isOpenAI ? { 'Content-Type': 'application/json', Authorization: `Bearer ${env.OPENAI_API_KEY}` } : { 'Content-Type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify(isOpenAI ? { model, max_tokens: 1024, messages: [{ role: 'system', content: system }, ...messages] } : { model, max_tokens: 1024, system, messages }),
      });
      if (!response.ok) fail(`AI-leverantören svarade med fel ${response.status}. Kontrollera anslutning och API-nyckel.`, 502);
      const result = await response.json();
      const answer = isOpenAI ? result.choices?.[0]?.message?.content : result.content?.filter(item => item.type === 'text').map(item => item.text).join('\n');
      if (!answer) fail('AI-leverantören gav inget textsvar.', 502);
      const inputTokens = isOpenAI ? result.usage?.prompt_tokens : result.usage?.input_tokens;
      const outputTokens = isOpenAI ? result.usage?.completion_tokens : result.usage?.output_tokens;
      if (Number.isFinite(inputTokens) && Number.isFinite(outputTokens)) put('usage', { ...usage, inputTokens, outputTokens, cost: (inputTokens * inputRate + outputTokens * outputRate) / 1e6, estimated: false });
      put('message', { id: id(), role: 'user', content: message, createdAt: now() });
      const reply = put('message', { id: id(), role: 'assistant', content: answer, createdAt: now() });
      activity('GARON har svarat', 'Ett AI-svar har sparats.', 'success');
      res.json(reply);
    } catch (error) {
      // Keep the reservation on uncertain failures: a timed-out provider may have billed us.
      if (error.status) throw error;
      fail('Kunde inte nå AI-leverantören. Kontrollera nätverket. En kostnadsreservation sparades eftersom anropet kan ha debiterats.', 502);
    } finally { chatBusy = false; }
  });
  app.use('/api', (_req, res) => res.status(404).json({ error: 'API-sökvägen finns inte.' }));
  app.use(express.static(resolve('dist')));
  app.get('/{*path}', (_req, res, next) => res.sendFile(resolve('dist/index.html'), error => error && next(error)));
  app.use((error, _req, res, _next) => res.status(error.status || 500).json({ error: error.status ? error.message : 'Ett oväntat serverfel uppstod.' }));
  return { app, close: () => db.close() };
}
