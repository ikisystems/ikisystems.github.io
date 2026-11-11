#!/usr/bin/env node
// Every local asset a prerendered page references must exist in the build.
//
// This catches a whole class of bug the head and text gates cannot see.
// copy.json stores every image, video and poster path RELATIVE
// ('assets/screenshots/x.png'), and no `<base href="/">` ships, so a path that
// reaches the DOM unresolved renders identical text and identical head tags
// while every image on every nested route 404s: /guides/outline/ would ask for
// /guides/outline/assets/screenshots/x.png. app/lib/asset.ts is what makes
// them absolute; this gate is what proves it still does.
//
// So: resolve each src/poster/srcset and each icon/stylesheet href against the
// build root, and assert the file is there.
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { REPO_ROOT } from './lib/site-content.mjs';
import { routeEntries } from './lib/route-matrix.mjs';
import { assetRefs } from './lib/html-compare.mjs';

const dirArg = process.argv[2] ?? 'build/client';
const root = resolve(REPO_ROOT, dirArg);

if (!existsSync(root)) {
  console.error(`check-asset-refs: no build at ${root} — run \`npm run build\` first`);
  process.exit(1);
}

const entries = await routeEntries();
const routes = [...entries.map(e => e.url), '/404/'];

let checked = 0;
let relative = 0;
const missing = [];

for (const url of routes) {
  const page = resolve(root, `${url.replace(/^\//, '')}index.html`);
  if (!existsSync(page)) {
    missing.push(`${url}: page itself missing (${page})`);
    continue;
  }
  const html = readFileSync(page, 'utf8');
  for (const ref of assetRefs(html)) {
    checked++;
    if (!ref.startsWith('/')) {
      // Relative on a nested route is the exact failure described above, so
      // it is reported as a failure even if the file happens to exist at the
      // site root.
      relative++;
      missing.push(`${url}: relative reference "${ref}" (no <base> tag ships, so this resolves under ${url})`);
      continue;
    }
    const file = resolve(root, `.${ref.split('?')[0].split('#')[0]}`);
    if (!existsSync(file)) {
      missing.push(`${url}: ${ref} -> ${file} does not exist`);
    }
  }
}

if (missing.length) {
  console.error(`check-asset-refs: ${missing.length} problem(s) across ${routes.length} route(s)`);
  for (const m of missing) console.error(`  ${m}`);
  process.exit(1);
}
console.log(
  `check-asset-refs: ok — ${checked} local reference(s) across ${routes.length} route(s) all resolve` +
    (relative ? `, ${relative} relative` : ', none relative'),
);
