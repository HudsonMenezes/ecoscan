// Eval do scanner contra a API real (custa dinheiro: ~US$ 0,004 por imagem).
// Uso:
//   npm run eval:scanner                         # http://localhost:3000 (npx vercel dev)
//   npm run eval:scanner -- https://ecoscan-v1.vercel.app
// Não importa nada de src/: o Node roda este arquivo direto (type stripping) e não
// resolve os imports `.js` → `.ts` do contrato compartilhado.
import { readFile, writeFile } from 'node:fs/promises';

type Case = {
  id: string;
  file: string;
  item: string;
  categories: string[]; // a primeira é a preferida; as outras também contam como certas
  hazardous: boolean;
  composite: boolean;
  difficult: boolean;
  adversarial: boolean;
};

type Result = {
  category: string;
  confidence: string;
  isComposite: boolean;
  categoryReason: string;
  itemName: string;
};

type Row = Case & {
  status: number;
  latencyMs: number;
  result: Result | null;
  correct: boolean;
  dangerous: boolean;
};

// Espelha `hazardous` de src/modules/scanner/model/categories.ts.
const HAZARDOUS = new Set([
  'pilhas_baterias',
  'eletronicos',
  'lampadas',
  'medicamentos',
  'oleo_cozinha',
]);
const MATERIAL_WORDS = /papel|papelão|plástic|alumínio|metal|película|camada|filme|vidro/i;

const TARGETS = { accuracy: 0.85, p50: 5_000, p95: 10_000 };

const dir = new URL('../tests/eval/scanner/', import.meta.url);
const baseUrl = (process.argv[2] ?? process.env.EVAL_URL ?? 'http://localhost:3000').replace(
  /\/$/,
  '',
);

function percentile(values: number[], p: number) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)] ?? 0;
}

async function scan(testCase: Case): Promise<Row> {
  const image = await readFile(new URL(testCase.file, dir));
  const started = performance.now();
  const response = await fetch(`${baseUrl}/api/scan`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: new URL(baseUrl).origin },
    body: JSON.stringify({ imageBase64: image.toString('base64') }),
  });
  const latencyMs = Math.round(performance.now() - started);
  const result = response.ok ? ((await response.json()) as Result) : null;
  const category = result?.category ?? '';
  return {
    ...testCase,
    status: response.status,
    latencyMs,
    result,
    correct: testCase.categories.includes(category),
    // Perigoso: item de logística reversa mandado para lixo comum ou reciclável comum.
    // `desconhecido` não conta: o app pede outra foto em vez de orientar errado.
    dangerous:
      testCase.hazardous && !!result && !HAZARDOUS.has(category) && category !== 'desconhecido',
  };
}

const cases = JSON.parse(await readFile(new URL('expected.json', dir), 'utf8')) as Case[];
console.log(`Eval do scanner: ${cases.length} imagens → ${baseUrl}/api/scan\n`);

const rows: Row[] = [];
for (const testCase of cases) {
  const row = await scan(testCase);
  rows.push(row);
  const mark = row.correct ? '✅' : row.dangerous ? '☠️' : '❌';
  console.log(
    `${mark} ${row.id.padEnd(26)} ${String(row.result?.category ?? `HTTP ${row.status}`).padEnd(16)} ${row.latencyMs} ms`,
  );
}

const main = rows.filter((r) => !r.adversarial);
const adversarial = rows.filter((r) => r.adversarial);
const correct = main.filter((r) => r.correct).length;
const accuracy = correct / main.length;
const dangerous = rows.filter((r) => r.dangerous);
const latencies = main.map((r) => r.latencyMs);
const p50 = percentile(latencies, 50);
const p95 = percentile(latencies, 95);
const composites = main.filter((r) => r.composite);
const compositeOk = composites.filter(
  (r) => r.result?.isComposite && MATERIAL_WORDS.test(r.result.categoryReason),
);
const difficult = main.filter((r) => r.difficult);

const checks = [
  [`Acurácia ≥ ${TARGETS.accuracy * 100}%`, accuracy >= TARGETS.accuracy],
  ['Nenhuma resposta perigosa', dangerous.length === 0],
  [`p50 ≤ ${TARGETS.p50 / 1000} s`, p50 <= TARGETS.p50],
  [`p95 ≤ ${TARGETS.p95 / 1000} s`, p95 <= TARGETS.p95],
  ['Compostos com isComposite e materiais citados', compositeOk.length === composites.length],
  ['Casos adversariais', adversarial.every((r) => r.correct)],
] as const;
const passed = checks.every(([, ok]) => ok);

const table = rows
  .map(
    (r) =>
      `| ${r.correct ? '✅' : r.dangerous ? '☠️' : '❌'} | ${r.id} | ${r.categories.join(' ou ')} | ${r.result?.category ?? `HTTP ${r.status}`} | ${r.result?.confidence ?? '–'} | ${r.result ? (r.result.isComposite ? 'sim' : 'não') : '–'} | ${r.latencyMs} | ${[r.difficult && 'difícil', r.adversarial && 'adversarial'].filter(Boolean).join(', ')} |`,
  )
  .join('\n');

const report = `# Relatório do eval do scanner

- Data: ${new Date().toISOString()}
- Alvo: ${baseUrl}
- Resultado: **${passed ? 'PASSOU' : 'FALHOU'}**

| Critério | Valor | OK |
| --- | --- | --- |
| Acurácia (${main.length} principais) | ${correct}/${main.length} (${Math.round(accuracy * 100)}%) | ${checks[0][1] ? '✅' : '❌'} |
| Respostas perigosas | ${dangerous.length}${dangerous.length ? ` (${dangerous.map((r) => r.id).join(', ')})` : ''} | ${checks[1][1] ? '✅' : '❌'} |
| Latência p50 / p95 | ${p50} ms / ${p95} ms | ${checks[2][1] && checks[3][1] ? '✅' : '❌'} |
| Compostos explicados | ${compositeOk.length}/${composites.length} | ${checks[4][1] ? '✅' : '❌'} |
| Adversariais | ${adversarial.filter((r) => r.correct).length}/${adversarial.length} | ${checks[5][1] ? '✅' : '❌'} |
| Acurácia nas difíceis | ${difficult.filter((r) => r.correct).length}/${difficult.length} | – |

| | Caso | Esperado | Obtido | Confiança | Composto | ms | Notas |
| --- | --- | --- | --- | --- | --- | --- | --- |
${table}
`;

await writeFile(new URL('last-report.md', dir), report);
console.log(`\n${report}`);
process.exitCode = passed ? 0 : 1;
