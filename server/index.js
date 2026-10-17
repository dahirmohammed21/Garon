import { createApp } from './app.js';
const { app, close } = createApp({ database: process.env.GARON_DB || '.garon/garon.sqlite' });
const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || '127.0.0.1';
const server = app.listen(port, host, () => console.log(`GARON är igång på ${host}:${port}`));
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => server.close(() => { close(); process.exit(0); }));
