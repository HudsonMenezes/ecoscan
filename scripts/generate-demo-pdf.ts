// Gera o PDF do roteiro da demo (docs/DEMO.md) para enviar à equipe, que não tem acesso ao código:
//   print/roteiro-da-demo.pdf
// Markdown → HTML (marked) → PDF A4 (Chromium do Playwright), com as fontes e o logo do app.
// Uso: npm run demo:pdf   (rode de novo sempre que mudar o DEMO.md)
import { readFile, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { marked } from 'marked';

const root = new URL('../', import.meta.url);
const read = (path: string) => readFile(new URL(path, root));

const markdown = (await read('docs/DEMO.md')).toString('utf8');
// O título vira a capa; o resto do documento segue como está.
const [, title = 'Roteiro da demo', body = markdown] =
  markdown.match(/^# (.+)\r?\n([\s\S]*)$/) ?? [];
const content = await marked.parse(body, { gfm: true });

const font = async (file: string) =>
  `data:font/woff2;base64,${(await read(file)).toString('base64')}`;
const logo = (await read('public/favicon.svg')).toString('utf8');
const today = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date());

const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>${title}</title>
<style>
  @font-face { font-family: 'Bricolage Grotesque'; src: url(${await font('public/fonts/bricolage-grotesque-latin.woff2')}) format('woff2'); font-weight: 200 800; }
  @font-face { font-family: Figtree; src: url(${await font('public/fonts/figtree-latin.woff2')}) format('woff2'); font-weight: 300 900; }
  :root { --forest: #0e5f3a; --soft: #e3efe6; --sprout: #b8e04a; --cream: #f7f3ea; --ink: #1a1a1a; --muted: #4a4a4a; --line: #d8d2c3; }
  * { box-sizing: border-box; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { margin: 0; color: var(--ink); font: 11pt/1.5 Figtree, system-ui, sans-serif; }
  h1, h2, h3 { font-family: 'Bricolage Grotesque', system-ui, sans-serif; color: var(--forest); line-height: 1.15; break-after: avoid; }
  .cover { display: flex; align-items: center; gap: 6mm; padding: 8mm 9mm; border-radius: 5mm; background: var(--forest); color: #fff; margin-bottom: 7mm; }
  .cover svg { width: 18mm; height: 18mm; flex: none; }
  .cover h1 { margin: 0; color: #fff; font-size: 26pt; }
  .cover p { margin: 1.5mm 0 0; color: var(--sprout); font-weight: 700; }
  h2 { margin: 8mm 0 3mm; padding-bottom: 1.5mm; border-bottom: 0.6mm solid var(--soft); font-size: 17pt; }
  h3 { margin: 6mm 0 2mm; font-size: 13pt; }
  p { margin: 0 0 3mm; }
  a { color: var(--forest); font-weight: 700; }
  ul, ol { margin: 0 0 3mm; padding-left: 6mm; }
  li { margin-bottom: 1.2mm; }
  li:has(> input[type='checkbox']) { list-style: none; margin-left: -6mm; }
  input[type='checkbox'] { appearance: none; width: 3.6mm; height: 3.6mm; margin: 0 2mm 0 0; border: 0.4mm solid var(--forest); border-radius: 0.8mm; vertical-align: -0.6mm; }
  blockquote { margin: 0 0 3mm; padding: 2.5mm 4mm; border-left: 1.2mm solid var(--sprout); border-radius: 0 2mm 2mm 0; background: var(--cream); }
  blockquote p { margin: 0; }
  table { width: 100%; margin: 0 0 4mm; border-collapse: collapse; font-size: 10pt; }
  tr { break-inside: avoid; }
  th { background: var(--forest); color: #fff; text-align: left; }
  th, td { padding: 2mm 2.5mm; border: 0.3mm solid var(--line); vertical-align: top; }
  tbody tr:nth-child(even) td { background: #faf8f3; }
  strong { font-weight: 800; }
</style>
</head>
<body>
  <header class="cover">${logo.trim()}<div><h1>${title}</h1><p>Guia para a equipe · ${today}</p></div></header>
  ${content}
</body>
</html>`;

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '16mm', bottom: '18mm', left: '16mm', right: '16mm' },
    displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate: `<div style="width:100%;padding:0 16mm;font:8pt sans-serif;color:#777;display:flex;justify-content:space-between">
      <span>EcoScan · ${title}</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
  });
  await writeFile(new URL('print/roteiro-da-demo.pdf', root), pdf);
  console.log('print/roteiro-da-demo.pdf ← docs/DEMO.md');
} finally {
  await browser.close();
}
