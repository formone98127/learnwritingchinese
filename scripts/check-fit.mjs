// Verifies every screen fits its viewport (no vertical overflow).
// Usage: node scripts/check-fit.mjs [baseUrl]
import puppeteer from 'puppeteer-core';

const BASE = process.argv[2] ?? 'http://127.0.0.1:8819';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const VIEWPORTS = [
  { name: 'phone-portrait', width: 390, height: 844 },
  { name: 'phone-small', width: 360, height: 640 },
  { name: 'phone-landscape', width: 844, height: 390 },
  { name: 'ipad-portrait', width: 820, height: 1180 },
  { name: 'ipad-landscape', width: 1180, height: 820 },
];

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'shell',
  args: ['--force-device-scale-factor=1'],
});

const check = async (page, label) => {
  const r = await page.evaluate(() => {
    const vh = window.innerHeight;
    let maxBottom = 0;
    let worst = '';
    for (const el of document.querySelectorAll('body *')) {
      const b = el.getBoundingClientRect();
      if (b.height === 0) continue;
      if (b.bottom > maxBottom) {
        maxBottom = b.bottom;
        worst = (el.innerText || el.tagName).slice(0, 30).replace(/\n/g, ' ');
      }
    }
    return { vh, maxBottom: Math.round(maxBottom), overflow: Math.round(maxBottom - vh), worst };
  });
  const ok = r.overflow <= 1;
  console.log(
    `${ok ? 'OK ' : 'OVERFLOW'} ${label}: bottom=${r.maxBottom} vh=${r.vh}` +
      (ok ? '' : ` (+${r.overflow}px, worst: ${r.worst})`),
  );
  return ok;
};

let allOk = true;
for (const vp of VIEWPORTS) {
  const page = await browser.newPage();
  await page.setViewport({ ...vp, hasTouch: true });

  // lesson: intro (demo + 口訣 + trace)
  await page.goto(`${BASE}/lesson/l6`, { waitUntil: 'networkidle0' });
  await sleep(1400);
  allOk &= await check(page, `${vp.name} lesson-intro`);

  // lesson: follow phase
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('div,span')].find((d) => d.innerText === '跳過示範');
    (btn?.closest('[role="button"]') ?? btn?.parentElement ?? btn)?.click();
  });
  await sleep(600);
  allOk &= await check(page, `${vp.name} lesson-follow`);

  // lesson: test mode
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('div,span')].find((d) => d.innerText === '學習');
    btn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await sleep(600);
  allOk &= await check(page, `${vp.name} lesson-test`);

  // dictionary page
  await page.goto(`${BASE}/char/${encodeURIComponent('霜')}`, { waitUntil: 'networkidle0' });
  await sleep(1200);
  allOk &= await check(page, `${vp.name} dict-霜`);

  await page.close();
}
await browser.close();
console.log(allOk ? 'ALL FIT' : 'SOME SCREENS OVERFLOW');
