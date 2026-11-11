#!/usr/bin/env node
// Delete every build asset no prerendered page refers to, then assert that no
// JavaScript survived.
//
// Why this exists. React Router's production build always emits a client
// bundle: `entry.client`, a chunk per route, the route manifest. This site
// never loads any of it — app/root.tsx ships no `<Scripts />`, because the
// apex company page is four static documents with nothing interactive on them
// and has never shipped a `<script>` tag. So the bundle is ~350 kB of code
// that is reachable by URL, never requested, and ages into a liability: a
// reader of the published repo would reasonably think it runs, and a future
// edit that reintroduces hydration would start working silently rather than
// failing loudly.
//
// `ssr: false` is NOT the alternative. React Router 7 reads that as SPA mode
// and prerendering then writes the same empty shell to every path — no title,
// no meta, no page text — which is a silent catastrophe on a site whose whole
// value is static HTML (see the note in react-router.config.ts). So the
// bundle is built and then removed here.
//
// Deliberately conservative: it keeps anything a page actually references, so
// the day a page does load a script, that script survives and the assertion
// below is what has to be revisited, by hand, on purpose.
//
//   node scripts/prune-unreferenced.mjs [dir]   (default: _site)
import { readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { REPO_ROOT } from './lib/site-content.mjs';
import { assetRefs } from './lib/html-compare.mjs';

const siteDir = resolve(REPO_ROOT, process.argv[2] ?? '_site');

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, files);
    else files.push(path);
  }
  return files;
}

const files = walk(siteDir);
const pages = files.filter(f => extname(f) === '.html');

// Every local reference every page makes, as a site-root-relative path.
const referenced = new Set();
for (const page of pages) {
  for (const ref of assetRefs(readFileSync(page, 'utf8'))) {
    const clean = ref.split('?')[0].split('#')[0];
    if (clean.startsWith('/')) {
      referenced.add(clean.slice(1));
    }
  }
}

// Only the build's own output is prunable. Files that came from public/ are
// published on purpose and may be referenced from outside this site: CNAME and
// .nojekyll are read by the host, robots.txt and sitemap.xml by crawlers, and
// favicon-32.png by a browser that never parsed our <head>.
const PRUNABLE_DIR = 'assets/';

const removed = [];
for (const path of files) {
  const rel = relative(siteDir, path);
  if (!rel.startsWith(PRUNABLE_DIR)) continue;
  if (referenced.has(rel)) continue;
  rmSync(path);
  removed.push(rel);
}

// The assertion the prune exists to make true. A `.js` still here after the
// sweep means a page references it — which on this site is a change of kind,
// not a bug in this script, and should be read as one.
const leftoverJs = walk(siteDir)
  .map(p => relative(siteDir, p))
  .filter(p => extname(p) === '.js');

if (leftoverJs.length) {
  console.error(`prune-unreferenced: ${leftoverJs.length} JavaScript file(s) are REFERENCED by a page:`);
  for (const p of leftoverJs) console.error(`  ${p}`);
  console.error('\nThis site ships no JavaScript. If that changed on purpose, update');
  console.error('app/root.tsx, this script and private/AGENTS.md together.');
  process.exit(1);
}

console.log(
  `prune-unreferenced: ok — removed ${removed.length} unreferenced file(s), ` +
    `${referenced.size} reference(s) across ${pages.length} page(s), no JavaScript published`,
);
