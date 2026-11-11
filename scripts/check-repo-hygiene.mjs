#!/usr/bin/env node
// Fail if a tracked file names a machine, a host or a port.
//
// The site's own pages document commands people run on their own Mac, so the
// rule cannot be "no paths" or "no URLs". It is narrower: nothing in this repo
// may hard-code an address or a port, because a published literal is both a
// thing that goes stale and a thing that describes whoever wrote it. A page
// that needs a port reads it off the running service at the time (see
// /technical/agent-lists/); a dev server takes `--port`.
//
// Scope: by default every tracked file, which is what a reader of the repo
// sees. Pass a directory to scan that instead — the publish gate runs it over
// an extracted snapshot tree, which is what a reader of the public mirror sees.
//
//   node scripts/check-repo-hygiene.mjs [dir]
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';

const RULES = [
  [/localhost:\d+/g, 'hard-coded localhost port'],
  [/127\.0\.0\.1:\d+/g, 'hard-coded loopback port'],
  [/\b10\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, 'private-range IPv4 address'],
  [/\b192\.168\.\d{1,3}\.\d{1,3}\b/g, 'private-range IPv4 address'],
  [/\b172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}\b/g, 'private-range IPv4 address'],
  [/\/Volumes\//g, 'absolute path to a mounted volume'],
  // `/Users/you/...` is the placeholder the docs use on purpose.
  [/\/Users\/(?!you\b)[A-Za-z0-9._-]+/g, 'absolute path naming a home directory'],
];

// Binary and lock files: the first carries no prose, the second is a registry
// manifest whose URLs are public by construction.
const SKIP_EXT = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.mp4', '.mov', '.woff', '.woff2', '.ttf',
]);
const SKIP_FILES = new Set(['package-lock.json']);

// Maintainer-only directory. It is removed before publication, so it is not
// part of what a reader of the published repo sees, and not this gate's
// business. A published checkout does not contain it at all.
const SKIP_DIRS = ['private/'];

/**
 * Anything else removed before publication.
 *
 * The publication tooling, when it is present, owns the list of paths it
 * strips. Reading it here rather than repeating it means the two can never
 * disagree — a path stripped at publish but still scanned here would fail this
 * gate over a file no reader ever receives. A published checkout has no such
 * tooling, so nothing is skipped and every file is scanned.
 */
function strippedBeforePublication(root) {
  try {
    const spec = JSON.parse(readFileSync(resolve(root, 'private/publish-tokens.json'), 'utf8'));
    return (spec.stripPaths ?? []).filter(p => typeof p === 'string' && p.length);
  } catch {
    return [];
  }
}

/** This file states the rules, so it necessarily contains them. */
const SELF = 'scripts/check-repo-hygiene.mjs';

/**
 * Tracked files, when this is a git checkout. It is not always one: an
 * extracted snapshot or a downloaded tarball has no `.git`, and the gate still
 * has to run there, so fall back to walking the directory.
 */
function filesFromGit(root) {
  try {
    const out = execFileSync('git', ['ls-files', '-z'], {
      encoding: 'utf8',
      cwd: root,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return out.split('\0').filter(Boolean);
  } catch {
    const ignored = ['node_modules/', '.git/', 'build/', '_site/', '.react-router/'];
    return filesFromDir(root).filter(rel => !ignored.some(d => rel.startsWith(d)));
  }
}

function filesFromDir(root) {
  const found = [];
  (function walk(dir) {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      else found.push(relative(root, path));
    }
  })(root);
  return found;
}

const dirArg = process.argv[2];
const root = dirArg ? resolve(dirArg) : process.cwd();
const files = dirArg ? filesFromDir(root) : filesFromGit(root);
const stripped = strippedBeforePublication(root);

const problems = [];
let scanned = 0;

for (const rel of files) {
  if (rel === SELF || SKIP_FILES.has(rel) || SKIP_EXT.has(extname(rel).toLowerCase())) continue;
  if (SKIP_DIRS.some(d => rel.startsWith(d))) continue;
  if (stripped.some(p => rel === p || rel.startsWith(`${p}/`))) continue;
  let text;
  try {
    text = readFileSync(resolve(root, rel), 'utf8');
  } catch {
    continue; // unreadable or vanished; nothing to assert about it
  }
  if (text.includes('\u0000')) continue; // binary without a known extension
  scanned++;
  for (const [pattern, what] of RULES) {
    for (const m of text.matchAll(pattern)) {
      const line = text.slice(0, m.index).split('\n').length;
      problems.push(`${rel}:${line}: ${what} — ${JSON.stringify(m[0])}`);
    }
  }
}

if (problems.length) {
  console.error(`check-repo-hygiene: ${problems.length} problem(s) across ${scanned} file(s)`);
  for (const p of problems) console.error(`  ${p}`);
  console.error('\nRead a port off the running service instead of printing one, and keep');
  console.error('machine-specific paths out of tracked files.');
  process.exit(1);
}
console.log(`check-repo-hygiene: ok — ${scanned} text file(s), no address or port literals`);
