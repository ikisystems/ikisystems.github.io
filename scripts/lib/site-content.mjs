// Where the site's content and static assets live.
//
// copy.json, copy.<locale>.json, locales.json, public/ and styles.css are all
// in this repo, and the content root is the repo root. SUPPORT_SITE_DIR exists
// so a build can point at a content tree somewhere else (CI sets it to the
// checkout explicitly); it is resolved to an absolute path and checked here, so
// a rename fails loudly with the path we looked for rather than as a confusing
// module-not-found deeper in the build.
import { existsSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

/** This repo's root. */
export const REPO_ROOT = resolve(here, '../..');

const configured = process.env['SUPPORT_SITE_DIR'] ?? '.';

/** The content root: the source of truth for copy and public assets. */
export const SUPPORT_SITE_DIR = isAbsolute(configured)
  ? configured
  : resolve(REPO_ROOT, configured);

/** Directory holding copy.json / copy.<locale>.json / locales.json. */
export const CONTENT_DIR = resolve(SUPPORT_SITE_DIR, 'src/app/content');

/** Static assets served at the site root (favicons, screenshots, og-image). */
export const PUBLIC_DIR = resolve(SUPPORT_SITE_DIR, 'public');

/** The locale resolver, so every script honours the same flags. */
export const ACTIVE_LOCALES_LIB = resolve(SUPPORT_SITE_DIR, 'scripts/lib/active-locales.mjs');

/**
 * Fail with the resolved path rather than a module-not-found from deeper in
 * the build. Called by every script and by vite.config.ts.
 */
export function assertSupportSite() {
  const missing = [
    ['SUPPORT_SITE_DIR', SUPPORT_SITE_DIR],
    ['content dir', CONTENT_DIR],
    ['public dir', PUBLIC_DIR],
    ['active-locales.mjs', ACTIVE_LOCALES_LIB],
  ].filter(([, path]) => !existsSync(path));

  if (missing.length) {
    const lines = missing.map(([what, path]) => `  ${what}: ${path}`).join('\n');
    throw new Error(
      `Cannot find the site's content tree.\n${lines}\n` +
        `Set SUPPORT_SITE_DIR to the checkout root (currently ${JSON.stringify(configured)}).`,
    );
  }
  return SUPPORT_SITE_DIR;
}

/** Import resolveActiveLocales() so every script resolves the flags the same way. */
export async function loadResolveActiveLocales() {
  assertSupportSite();
  // @vite-ignore: a runtime path, deliberately opaque to Vite's analyzer —
  // this module is config-time code and never reaches a browser bundle.
  const mod = await import(/* @vite-ignore */ pathToFileURL(ACTIVE_LOCALES_LIB).href);
  return mod.resolveActiveLocales;
}
