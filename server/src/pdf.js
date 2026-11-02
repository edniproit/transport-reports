import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

// PDF друкує встановлений Chrome/Edge: розмітка аркуша одна для перегляду й файлу.
const CANDIDATES = [
  process.env.BROWSER_PATH,
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);

// credentials — { username, password } для сторінки, захищеної Basic-авторизацією.
export async function renderPdf(url, credentials) {
  const executablePath = CANDIDATES.find((p) => existsSync(p));
  if (!executablePath) throw new Error('Не знайдено Chrome або Edge для створення PDF. Вкажіть шлях у змінній BROWSER_PATH.');

  // Окремий тимчасовий профіль, щоб не чіпати відкритий у користувача браузер.
  const userDataDir = await mkdtemp(path.join(os.tmpdir(), 'report-pdf-'));
  const browser = await puppeteer.launch({
    executablePath,
    userDataDir,
    headless: true,
    // У контейнері Chromium працює від root і має мало спільної пам'яті.
    args: process.env.BROWSER_NO_SANDBOX ? ['--no-sandbox', '--disable-dev-shm-usage'] : [],
  });
  try {
    const page = await browser.newPage();
    if (credentials) await page.authenticate(credentials);
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.waitForSelector('.sheet', { timeout: 15000 });
    await page.evaluate(() => document.fonts.ready);
    return Buffer.from(await page.pdf({ preferCSSPageSize: true, printBackground: true }));
  } finally {
    await browser.close();
    await rm(userDataDir, { recursive: true, force: true });
  }
}
