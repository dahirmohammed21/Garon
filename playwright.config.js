import { defineConfig } from '@playwright/test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const dataDir = mkdtempSync(join(tmpdir(), 'garon-browser-'));
export default defineConfig({
  testDir: './tests/browser',
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:3101',
    browserName: 'chromium',
    timezoneId: 'Europe/Stockholm',
    launchOptions: { executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] },
    viewport: { width: 1440, height: 1000 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm start',
    url: 'http://127.0.0.1:3101/api/health',
    reuseExistingServer: false,
    env: { PORT: '3101', HOST: '127.0.0.1', GARON_DB: join(dataDir, 'garon.sqlite'), OPENAI_API_KEY: '', ANTHROPIC_API_KEY: '' },
  },
});
