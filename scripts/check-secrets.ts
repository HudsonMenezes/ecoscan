// Falha se o build do site (dist/) tiver algo que pareça segredo da OpenAI.
// Roda na CI depois do build. Uso: npm run build && npm run check:secrets
// "sk-" sozinho não serve: o bundle tem palavras como "mask-type".
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const DIST = join(import.meta.dirname, '..', 'dist');

const PATTERNS: { name: string; regex: RegExp }[] = [
  { name: 'chave da OpenAI (sk-...)', regex: /sk-[A-Za-z0-9_-]{20,}/ },
  { name: 'variável OPENAI_*', regex: /OPENAI_[A-Z_]+/ },
];

// Se a chave estiver no ambiente (local, com --env-file=.env), procura também o valor exato.
const key = process.env.OPENAI_API_KEY?.trim();
if (key) PATTERNS.push({ name: 'valor de OPENAI_API_KEY', regex: new RegExp(escapeRegExp(key)) });

let files: string[];
try {
  files = (await readdir(DIST, { recursive: true, withFileTypes: true }))
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name));
} catch {
  console.error('check:secrets: dist/ não existe. Rode `npm run build` antes.');
  process.exit(1);
}

let found = 0;
for (const file of files) {
  const content = await readFile(file, 'latin1');
  for (const { name, regex } of PATTERNS) {
    if (regex.test(content)) {
      console.error(`✗ ${name} em ${relative(process.cwd(), file)}`);
      found++;
    }
  }
}

if (found > 0) {
  console.error(`check:secrets: ${found} ocorrência(s). O segredo não pode ir para o navegador.`);
  process.exit(1);
}
console.log(`check:secrets: ok (${files.length} arquivos em dist/)`);

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
