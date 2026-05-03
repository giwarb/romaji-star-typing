import { mkdirSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import type { Browser } from '@playwright/test';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const port = 4174;
const url = `http://127.0.0.1:${port}`;
const server = spawn(
  process.execPath,
  ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', String(port)],
  {
    cwd: root,
    stdio: 'ignore',
  },
);
let browser: Browser | undefined;

try {
  await waitForServer(url);
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(url);
  await page.waitForFunction(() => Boolean(window.__GAME_HARNESS__));
  const snapshot = await page.evaluate(() => window.__GAME_HARNESS__.snapshot());

  mkdirSync(`${root}/artifacts/browser`, { recursive: true });
  await page.screenshot({ path: `${root}/artifacts/browser/current.png`, fullPage: true });
  writeFileSync(
    `${root}/artifacts/browser/current.json`,
    `${JSON.stringify({ capturedAt: new Date().toISOString(), snapshot }, null, 2)}\n`,
  );
  console.log('Browser artifact written to artifacts/browser/current.png');
} finally {
  if (browser) {
    await browser.close();
  }
  server.kill();
}

async function waitForServer(targetUrl: string): Promise<void> {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(targetUrl);
      if (response.ok) {
        return;
      }
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  throw new Error(`Timed out waiting for ${targetUrl}`);
}
