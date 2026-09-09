/* Run against a local production server with:
   npm exec --yes --package=playwright -- node scripts/display-browser-check.cjs */
const path = require('node:path');
const assert = require('node:assert/strict');
const fs = require('node:fs');
let playwright;
for (const directory of (process.env.PATH || '').split(path.delimiter)) {
  try { playwright = require(require.resolve('playwright', { paths: [path.dirname(directory)] })); break; } catch {}
}
if (!playwright) throw new Error('Run through npm exec --package=playwright');

(async () => {
  const browser = await playwright.chromium.launch({ channel: 'msedge', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, timezoneId: 'UTC' });
    await context.route(/googleapis\.com|firebaseio\.com|openweathermap\.org/, route => route.abort());
    await context.route('**/api/weather/current*', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }));
    await context.addInitScript(() => {
      if (!localStorage.getItem('judi.display.timetables.v1')) {
        const times = { fajrStart: '05:00', fajrJamaat: '05:30', sunrise: '06:30', dhuhrStart: '12:00',
          dhuhrJamaat: '13:00', asrStart: '15:00', asrJamaat: '16:00', maghrib: '18:30', ishaStart: '20:00', ishaJamaat: '21:00' };
        localStorage.setItem('judi.display.timetables.v1', JSON.stringify({
          '09/09/2026': { times, savedAt: Date.now() }, '10/09/2026': { times, savedAt: Date.now() },
        }));
      }
    });
    const page = await context.newPage();
    const errors = [];
    const waitNormal = async () => {
      await page.locator('#app').waitFor({ state: 'visible', timeout: 40_000 });
      await page.waitForFunction(() => {
        const app = document.getElementById('app');
        return app && !document.querySelector('.display-downtime-screen') &&
          getComputedStyle(app).filter === 'none' && getComputedStyle(app).opacity === '1';
      });
    };
    page.on('pageerror', error => errors.push(error.message));
    await page.clock.install({ time: new Date('2026-09-09T09:00:00Z') });
    await page.goto('http://localhost:3100/display', { waitUntil: 'domcontentloaded' });
    await page.locator('#app').waitFor({ state: 'visible', timeout: 40_000 }).catch(async error => {
      console.log(JSON.stringify({ body: await page.locator('body').innerText(), errors,
        state: await page.evaluate(() => ({ now: new Date().toISOString(), cache: localStorage.getItem('judi.display.timetables.v1') })) }));
      throw error;
    });
    assert.equal(await page.locator('html').evaluate(el => el.classList.contains('dark')), false);
    await page.keyboard.press('1');
    await page.locator('#app').waitFor({ state: 'detached', timeout: 10_000 });
    await page.locator('.display-downtime-screen').getByText(/10:00/).first().waitFor({ state: 'visible' });
    assert.match(await page.locator('.display-downtime-screen').innerText(), /10:00/);
    await page.keyboard.press('0');
    await waitNormal();
    await page.keyboard.press('3');
    await page.locator('[data-display-busy="prayer"]').waitFor({ state: 'visible' });
    await page.keyboard.press('1');
    await page.locator('#app').waitFor({ state: 'detached' });
    await page.keyboard.press('0');
    await waitNormal();
    assert.equal(await page.locator('[data-display-busy="prayer"]').count(), 0, 'preview must not replay after remount');
    await page.waitForFunction(async () => {
      const cache = await caches.open('judi-display-v1');
      return !!(await cache.match('/display')) && (await cache.keys()).length > 5;
    }, { timeout: 30_000 });
    await page.screenshot({ path: path.resolve(__dirname, '../docs/audits/2026-09-09/display-recovery-browser.png') });
    await page.clock.fastForward('14:00:00');
    await page.locator('#app').waitFor({ state: 'detached', timeout: 10_000 });
    await page.locator('.display-downtime-screen').getByText(/Thursday/).first().waitFor({ state: 'visible' });
    assert.match(await page.locator('.display-downtime-screen').innerText(), /Thursday/);
    await page.clock.fastForward('06:00:00');
    await waitNormal();
    assert.equal(await page.locator('text=Prayer Times Unavailable').count(), 0);
    await context.setOffline(true);
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30_000 });
    await waitNormal();
    assert.equal(await page.locator('text=Prayer Times Unavailable').count(), 0);
    assert.deepEqual(errors, []);
    const results = { browser: 'Edge', timezone: 'UTC', resolution: '1920x1080',
      passed: ['cached startup during outage', 'London clock on UTC device', 'both mode transitions',
        'manual return to automatic', 'preview does not replay', 'simulated midnight and next-day opening',
        'offline production reload'], pageErrors: errors };
    fs.writeFileSync(path.resolve(__dirname, '../docs/audits/2026-09-09/display-browser-results.json'), JSON.stringify(results, null, 2) + '\n');
    console.log(JSON.stringify(results, null, 2));
    await context.close();
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
