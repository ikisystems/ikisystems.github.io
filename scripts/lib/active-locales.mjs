// Resolve which locales are active for THIS build.
//
// Production truth is the committed `enabled` flag in locales.json (false for
// every non-default locale today). A per-machine override, IKISYSTEMS_LOCALES,
// switches locales on locally: a comma list of codes, or `all`. It is read
// from the process environment first, then from the git-ignored .env at the
// repo root, so it can never reach the GitHub Actions build.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(here, '../..');
export const MATRIX_PATH = resolve(ROOT, 'src/app/content/locales.json');

function readDotEnv(name) {
  const file = resolve(ROOT, '.env');
  if (!existsSync(file)) return undefined;
  for (const raw of readFileSync(file, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const m = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m && m[1] === name) return m[2].replace(/^(['"])(.*)\1$/, '$2').trim();
  }
  return undefined;
}

export function resolveActiveLocales() {
  const matrix = JSON.parse(readFileSync(MATRIX_PATH, 'utf8'));
  const raw = process.env['IKISYSTEMS_LOCALES'] ?? readDotEnv('IKISYSTEMS_LOCALES') ?? '';
  const override = raw.split(',').map(s => s.trim()).filter(Boolean);
  const all = override.includes('all');
  const known = new Set(matrix.locales.map(l => l.code));
  const unknown = override.filter(c => c !== 'all' && !known.has(c));
  if (unknown.length) {
    throw new Error(`IKISYSTEMS_LOCALES names locale(s) not in locales.json: ${unknown.join(', ')}`);
  }
  const active = matrix.locales.filter(
    l => l.code === matrix.defaultLocale || l.enabled === true || all || override.includes(l.code),
  );
  const source = override.length ? `IKISYSTEMS_LOCALES=${raw}` : 'committed enabled flags';
  return { ...matrix, locales: active, source, overridden: override.length > 0 };
}
