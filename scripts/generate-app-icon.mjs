/**
 * Generate app icons featuring 筆 on brand paper/ink colors.
 * Usage: node scripts/generate-app-icon.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '../assets/images');
const CHROME =
  process.env.CHROME_PATH ??
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const PAPER = '#F6F0E4';
const INK = '#26221C';
const VERMILLION = '#BE3B2E';
const CHAR = '筆';

function iconHtml({ size, bg, fg, rule = false, fontScale = 0.72 }) {
  const fontSize = Math.round(size * fontScale);
  const ruleHtml = rule
    ? `<div style="position:absolute;bottom:${Math.round(size * 0.18)}px;left:50%;transform:translateX(-50%);width:${Math.round(size * 0.22)}px;height:${Math.max(2, Math.round(size * 0.012))}px;background:${VERMILLION};border-radius:999px"></div>`
    : '';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@700&display=swap" rel="stylesheet"/>
<style>*{margin:0;padding:0}html,body{width:${size}px;height:${size}px;overflow:hidden}
body{background:${bg};display:flex;align-items:center;justify-content:center;position:relative}
span{font-family:'Noto Serif TC',serif;font-weight:700;font-size:${fontSize}px;line-height:1;color:${fg};transform:translateY(${Math.round(size * 0.02)}px)}</style></head>
<body><span>${CHAR}</span>${ruleHtml}</body></html>`;
}

async function render(browser, html, outPath, size, transparent = false) {
  const page = await browser.newPage();
  await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 200));
  await page.screenshot({
    path: outPath,
    type: 'png',
    omitBackground: transparent,
  });
  await page.close();
  console.log('wrote', outPath);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--font-render-hinting=none'],
  });

  const specs = [
    {
      file: 'icon.png',
      size: 1024,
      html: iconHtml({ size: 1024, bg: PAPER, fg: INK, rule: true, fontScale: 0.68 }),
    },
    {
      file: 'splash-icon.png',
      size: 512,
      html: iconHtml({ size: 512, bg: PAPER, fg: INK, rule: true, fontScale: 0.68 }),
    },
    {
      file: 'android-icon-background.png',
      size: 1024,
      html: `<!DOCTYPE html><html><head><style>html,body{width:1024px;height:1024px;background:${PAPER}}</style></head><body></body></html>`,
    },
    {
      file: 'android-icon-foreground.png',
      size: 1024,
      transparent: true,
      html: iconHtml({ size: 1024, bg: 'transparent', fg: INK, rule: true, fontScale: 0.58 }),
    },
    {
      file: 'android-icon-monochrome.png',
      size: 1024,
      transparent: true,
      html: iconHtml({ size: 1024, bg: 'transparent', fg: '#FFFFFF', fontScale: 0.58 }),
    },
    { file: 'favicon.png', size: 48, html: iconHtml({ size: 48, bg: PAPER, fg: INK, fontScale: 0.7 }) },
  ];

  for (const spec of specs) {
    await render(browser, spec.html, path.join(OUT, spec.file), spec.size, spec.transparent);
  }

  const PUBLIC = path.join(__dirname, '../public');
  fs.mkdirSync(PUBLIC, { recursive: true });
  fs.copyFileSync(path.join(OUT, 'favicon.png'), path.join(PUBLIC, 'favicon.png'));
  fs.copyFileSync(path.join(OUT, 'splash-icon.png'), path.join(PUBLIC, 'apple-touch-icon.png'));
  console.log('wrote public/favicon.png + public/apple-touch-icon.png');

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
