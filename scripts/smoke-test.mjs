// Headless smoke test: traces 我 (l5, char index 5) stroke-perfectly,
// verifies star display, and captures landscape + home screenshots.
// Usage: node scripts/smoke-test.mjs
import { readFile } from 'node:fs/promises';
import puppeteer from 'puppeteer-core';

const BASE = process.argv[2] ?? 'http://127.0.0.1:8812';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'shell',
  args: ['--force-device-scale-factor=1'],
});
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('PAGE ERROR:', e.message));
await page.setViewport({ width: 1180, height: 760, hasTouch: true });

// --- landscape lesson ---
await page.goto(`${BASE}/lesson/l5`, { waitUntil: 'networkidle0' });
await sleep(1200);
await page.screenshot({ path: 'shot-landscape-intro.png' });

// trace the default first char 了

// skip intro → follow mode
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('div,span')].find((d) => d.innerText === '跳過示範');
  (btn?.closest('[role="button"]') ?? btn?.parentElement ?? btn)?.click();
});
await sleep(800);

// trace 了 perfectly along its medians
const data = JSON.parse(await readFile('assets/strokes/4e86.json', 'utf8'));

// first: a deliberately sloppy stroke — start correctly then veer way off.
// Expect: trail wiped, still on stroke 1.
const sloppy = await page.evaluate(async (medians) => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const dot = [...document.querySelectorAll('svg circle')].find(
    (c) => c.getAttribute('fill') === '#BE3B2E',
  );
  const svg = dot?.closest('svg');
  if (!svg) return 'no pad';
  const rect = svg.getBoundingClientRect();
  const size = rect.width;
  const toXY = ([x, y]) => [rect.left + (x / 1024) * size, rect.top + ((900 - y) / 1024) * size];
  const touch = (type, x, y) => {
    const el = document.elementFromPoint(x, y) || svg;
    const t = new Touch({ identifier: 1, target: el, clientX: x, clientY: y, pageX: x, pageY: y });
    el.dispatchEvent(
      new TouchEvent(type, {
        touches: type === 'touchend' ? [] : [t],
        targetTouches: type === 'touchend' ? [] : [t],
        changedTouches: [t],
        bubbles: true,
        cancelable: true,
      }),
    );
  };
  const [sx, sy] = toXY(medians[0][0]);
  touch('touchstart', sx, sy);
  await sleep(60);
  // follow a little, then veer off 200px downward
  const [mx, my] = toXY(medians[0][1]);
  touch('touchmove', (sx + mx) / 2, (sy + my) / 2);
  await sleep(60);
  touch('touchmove', mx, my + 200);
  await sleep(120);
  touch('touchend', mx, my + 200);
  await sleep(300);
  const label =
    [...document.querySelectorAll('div')].find((d) => d.innerText?.startsWith('第 '))?.innerText ??
    '?';
  const hint = [...document.querySelectorAll('div')].find((d) => d.innerText === '寫歪咗，呢筆重新寫')
    ? 'wiped'
    : 'not wiped';
  const inkLeft = [...document.querySelectorAll('svg path')].some(
    (p) => p.getAttribute('stroke') === '#26221C' && p.getAttribute('stroke-width'),
  );
  return { label, hint, inkLeft };
}, data.medians);
console.log('sloppy stroke (want 第 1 筆 + wiped + no ink):', JSON.stringify(sloppy));

const ok = await page.evaluate(async (medians) => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  // locate the trace pad svg (the one with border sibling) — find last svg in a bordered view
  // the trace pad is the only svg with a red start dot (circle fill #BE3B2E)
  const dot = [...document.querySelectorAll('svg circle')].find(
    (c) => c.getAttribute('fill') === '#BE3B2E',
  );
  const svg = dot?.closest('svg');
  if (!svg) return 'no pad found (no red dot)';
  const rect = svg.getBoundingClientRect();
  const size = rect.width;
  const toXY = ([x, y]) => [rect.left + (x / 1024) * size, rect.top + ((900 - y) / 1024) * size];

  const touch = (type, x, y, id = 1) => {
    const t = new Touch({
      identifier: id,
      target: document.elementFromPoint(x, y) || svg,
      clientX: x,
      clientY: y,
      pageX: x,
      pageY: y,
      screenX: x,
      screenY: y,
    });
    document.elementFromPoint(x, y)?.dispatchEvent(
      new TouchEvent(type, {
        touches: type === 'touchend' ? [] : [t],
        targetTouches: type === 'touchend' ? [] : [t],
        changedTouches: [t],
        bubbles: true,
        cancelable: true,
      }),
    );
  };

  const log = [];
  for (let m = 0; m < medians.length; m++) {
    const med = medians[m];
    const pts = med.map(toXY);
    const [sx, sy] = pts[0];
    touch('touchstart', sx, sy);
    for (let i = 1; i < pts.length; i++) {
      const [px, py] = pts[i - 1];
      const [cx, cy] = pts[i];
      const steps = Math.max(2, Math.ceil(Math.hypot(cx - px, cy - py) / 6));
      for (let s = 1; s <= steps; s++) {
        touch('touchmove', px + ((cx - px) * s) / steps, py + ((cy - py) * s) / steps);
        await sleep(4);
      }
    }
    touch('touchend', pts[pts.length - 1][0], pts[pts.length - 1][1]);
    await sleep(500);
    const label =
      [...document.querySelectorAll('div')].find((d) => d.innerText?.startsWith('第 '))?.innerText ??
      '(no label)';
    log.push(`stroke ${m + 1}: ${label}`);
  }
  return log;
}, data.medians);
console.log('trace result:', ok);

let starsVisible = false;
for (let i = 0; i < 8 && !starsVisible; i++) {
  await sleep(250);
  starsVisible = await page.evaluate(
    () =>
      document.body.innerText.includes('下一個字') || document.body.innerText.includes('完成關卡'),
  );
}
console.log('charDone reached:', starsVisible);
await page.screenshot({ path: 'shot-landscape-stars.png' });

// --- test mode: no demo, no guides ---
await page.goto(`${BASE}/lesson/l5`, { waitUntil: 'networkidle0' });
await sleep(1200);
const toggled = await page.evaluate(() => {
  const btn = [...document.querySelectorAll('div,span')].find((d) => d.innerText === '學習');
  if (!btn) return false;
  btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  return true;
});
await sleep(800);
const modeLabel = await page.evaluate(
  () => [...document.querySelectorAll('div,span')].find((d) => d.innerText === '測試') != null,
);
console.log('toggle clicked:', toggled, '| now in 測試:', modeLabel);
const guideCheck = await page.evaluate(() => {
  const dots = [...document.querySelectorAll('svg circle')].filter(
    (c) => c.getAttribute('fill') === '#BE3B2E',
  );
  const dashes = [...document.querySelectorAll('svg path')].filter((p) =>
    (p.getAttribute('stroke-dasharray') ?? '').includes('2 14'),
  );
  const locate = (el) => {
    const svg = el.closest('svg');
    const r = svg?.getBoundingClientRect();
    return r ? `${Math.round(r.width)}px@(${Math.round(r.left)},${Math.round(r.top)})` : '?';
  };
  return {
    dots: dots.map(locate),
    dashes: dashes.map(locate),
    label: document.body.innerText.includes('測試'),
  };
});
console.log('test mode guides (want redDots=0, dashed=0):', JSON.stringify(guideCheck));
await page.screenshot({ path: 'shot-test-mode.png' });
const ok2 = await page.evaluate(async (medians) => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const svgs = [...document.querySelectorAll('svg')].filter((s) => {
    const r = s.getBoundingClientRect();
    return r.width > 400;
  });
  const svg = svgs.sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0];
  if (!svg) return 'no big svg';
  const rect = svg.getBoundingClientRect();
  const size = rect.width;
  const toXY = ([x, y]) => [rect.left + (x / 1024) * size, rect.top + ((900 - y) / 1024) * size];
  const touch = (type, x, y) => {
    const el = document.elementFromPoint(x, y) || svg;
    const t = new Touch({
      identifier: 1,
      target: el,
      clientX: x,
      clientY: y,
      pageX: x,
      pageY: y,
    });
    el.dispatchEvent(
      new TouchEvent(type, {
        touches: type === 'touchend' ? [] : [t],
        targetTouches: type === 'touchend' ? [] : [t],
        changedTouches: [t],
        bubbles: true,
        cancelable: true,
      }),
    );
  };
  for (const med of medians) {
    const pts = med.map(toXY);
    const [sx, sy] = pts[0];
    touch('touchstart', sx, sy);
    for (let i = 1; i < pts.length; i++) {
      const [px, py] = pts[i - 1];
      const [cx, cy] = pts[i];
      const steps = Math.max(2, Math.ceil(Math.hypot(cx - px, cy - py) / 6));
      for (let s = 1; s <= steps; s++) {
        touch('touchmove', px + ((cx - px) * s) / steps, py + ((cy - py) * s) / steps);
        await sleep(4);
      }
    }
    touch('touchend', pts[pts.length - 1][0], pts[pts.length - 1][1]);
    await sleep(500);
  }
  return 'ok';
}, data.medians);
await sleep(1200);
const testDone = await page.evaluate(() => document.body.innerText.includes('測試'));
console.log('test mode trace:', ok2, '| still on lesson (stars or next char):', testDone);
await page.screenshot({ path: 'shot-test-mode-done.png' });

// --- stroke formula (口訣) on lesson page ---
await page.goto(`${BASE}/lesson/l5`, { waitUntil: 'networkidle0' });
await sleep(1200);
const formula = await page.evaluate(() => {
  const txt = document.body.innerText;
  // 了's rule: 由上而下; 口訣 label must be present
  return { label: txt.includes('口訣'), rule: txt.includes('由上而下') };
});
console.log('stroke rules 口訣 (want label+rule):', JSON.stringify(formula));

// --- dictionary search on home ---
await page.goto(`${BASE}/`, { waitUntil: 'networkidle0' });
await sleep(900);
const search = await page.evaluate(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const input = document.querySelector('input, textarea');
  if (!input) return 'no input';
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(input, 'ngo');
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await sleep(400);
  const chips = [...document.querySelectorAll('div')].filter(
    (d) => d.children.length === 2 && d.innerText.includes('ngo5'),
  );
  const target = chips.find((d) => d.innerText.startsWith('我'));
  if (!target) return 'no 我 chip';
  target.click();
  await sleep(900);
  const txt = document.body.innerText;
  return {
    onDictPage: txt.includes('查字典'),
    charShown: txt.includes('ngo5'),
    rules: txt.includes('由左而右') && txt.includes('後寫點'), // 我's 口訣
    strokes: (txt.match(/共 (\d+) 筆/) ?? [])[1],
  };
});
console.log('dict search ngo → 我 page:', JSON.stringify(search));
await page.screenshot({ path: 'shot-dict.png' });

// portrait check
await page.setViewport({ width: 420, height: 900, hasTouch: true });
await sleep(500);
await page.screenshot({ path: 'shot-portrait.png' });

// home with star counts
await page.goto(`${BASE}/`, { waitUntil: 'networkidle0' });
await sleep(800);
await page.screenshot({ path: 'shot-home.png' });

await browser.close();
console.log('done');
