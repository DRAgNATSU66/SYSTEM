// Screenshot every route in demo mode for the pixel-diff gate.
// Usage: node scripts/shots.mjs <outDir>
/* global process */
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const OUT = path.resolve(process.argv[2] || '.shots/current');
const PORT = Number(process.env.SHOTS_PORT || 5199);
const ROUTES = ['/', '/command', '/habits', '/workout', '/study', '/nutrition', '/sleep', '/mood', '/goals',
  '/sidehustles', '/social', '/duels', '/leaderboard', '/history', '/calendar', '/shop', '/settings'];
const VIEWPORTS = { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } };
const FROZEN = new Date('2026-10-14T10:30:00Z');
const FREEZE_CSS = '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important;will-change:auto!important}'
  // Animated GIFs (shop logos) ignore reduced-motion and vary frame to frame; hide, keep layout.
  + 'img[src*=".gif"]{visibility:hidden!important}'
  // .content-area is height:100vh + overflow-y:auto, so fullPage would only capture the viewport; un-clip it.
  + 'html,body,#root,.app-layout,.content-area{height:auto!important;min-height:0!important;max-height:none!important}.content-area{overflow-y:visible!important}html{scroll-behavior:auto!important}'
  // Defensive only: the live app currently renders no <canvas> (ParticleBackground/GlobeStats are unimported), so this fixes no observed variance. Guards against a future per-frame canvas.
  + 'canvas{visibility:hidden!important}';

process.env.VITE_DEMO_MODE = 'true';
const server = await createServer({ server: { port: PORT, strictPort: true }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--font-render-hinting=none', '--disable-gpu', '--disable-lcd-text', '--disable-font-subpixel-positioning', '--force-color-profile=srgb'] });
const errors = {};

try {
  for (const [vp, viewport] of Object.entries(VIEWPORTS)) {
    await mkdir(path.join(OUT, vp), { recursive: true });
    const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: 'reduce', timezoneId: 'UTC', locale: 'en-US' });
    const page = await ctx.newPage();
    // Playwright's clock.* freezes timers/rAF-visible time and leaves framer-motion stuck at opacity 0,
    // so shift Date only: Date.now() = FROZEN + elapsed (performance.now keeps ticking).
    await page.addInitScript((frozen) => {
      const RealDate = Date;
      const t0 = performance.now();
      const now = () => frozen + (performance.now() - t0);
      class FakeDate extends RealDate {
        constructor(...a) { super(...(a.length ? a : [now()])); }
        static now() { return now(); }
      }
      globalThis.Date = FakeDate;
      // Deterministic Math.random (mulberry32) so greetings, shop picks etc. are stable.
      let seed = 0x5eed1234;
      Math.random = () => {
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
      // userStore generates the Cipher ID with crypto.getRandomValues; route it through the same PRNG.
      crypto.getRandomValues = (arr) => {
        for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
        return arr;
      };
    }, FROZEN.getTime());
    // Mobile: sidebar defaults to open (uiStore, persisted); seed it closed so shots show the page.
    if (vp === 'mobile') {
      await page.addInitScript(() => {
        localStorage.setItem('antigravity-ui-store', JSON.stringify({ state: { sidebarOpen: false, theme: 'dark', offlineMode: false, cloudSync: true }, version: 0 }));
      });
    }
    let current = '';
    page.on('pageerror', (e) => (errors[`${vp}${current}`] ??= []).push(String(e.message || e)));
    // Warm-up: first navigation in a cold context/dev server (vite transforms, web fonts) renders differently.
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    for (const route of ROUTES) {
      current = route;
      await page.goto(`http://localhost:${PORT}${route}`, { waitUntil: 'networkidle' });
      await page.addStyleTag({ content: FREEZE_CSS });
      // Remote web fonts / images: wait until all are settled before the final settle delay.
      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; }))));
      });
      // Reset any scroll (autofocus / smooth-scroll residue) so every capture starts from the top.
      await page.evaluate(() => { document.activeElement?.blur?.(); window.scrollTo(0, 0); });
      await page.waitForTimeout(2000);
      const slug = route === '/' ? 'dashboard' : route.slice(1);
      await page.screenshot({ path: path.join(OUT, vp, `${slug}.png`), fullPage: true });
    }
    await ctx.close();
  }
} finally {
  await browser.close();
  await server.close();
}

await writeFile(path.join(OUT, 'errors.json'), JSON.stringify(errors, null, 2));
const n = Object.keys(errors).length;
console.log(`shots → ${OUT} (${n} route(s) with page errors)`);
process.exit(n ? 1 : 0);
