// The locale x route product, derived from locales.json
// through its own resolveActiveLocales(). Everything that needs to know which
// URLs exist reads it from here: react-router.config.ts's prerender list, the
// sitemap, the parity gate and the asset gate. One source, so the prerendered
// set cannot drift from the sitemap the way two hand-kept lists would.
import { loadResolveActiveLocales } from './site-content.mjs';

/** The active matrix: { origin, defaultLocale, locales[], routes[], source }. */
export async function activeMatrix() {
  const resolveActiveLocales = await loadResolveActiveLocales();
  return resolveActiveLocales();
}

/**
 * Site-relative URL (leading and trailing slash) for `routePath` in `locale`.
 * Byte-for-byte the rule in src/content/copy.ts: a page that is not
 * localized resolves to its English URL, so the switcher never links to a 404.
 */
export function localizedPath(routePath, locale, routes) {
  const def = routes.find(r => r.path === routePath);
  const prefix = def && !def.localized ? '' : locale.prefix;
  const segments = [prefix, routePath].filter(Boolean);
  return segments.length ? `/${segments.join('/')}/` : '/';
}

/**
 * Every page this build serves, one entry per locale x route, plus the 404.
 * A non-localized route (the legal pages) appears once, under the default
 * locale, which is what the route table does by registering those
 * two paths only when `isDefault`.
 */
export async function routeEntries(matrix) {
  const mx = matrix ?? (await activeMatrix());
  const { defaultLocale, locales, routes } = mx;
  const entries = [];

  for (const locale of locales) {
    const isDefault = locale.code === defaultLocale;
    for (const route of routes) {
      if (!route.localized && !isDefault) continue;
      entries.push({
        url: localizedPath(route.path, locale, routes),
        routePath: route.path,
        seoKey: route.seoKey,
        priority: route.priority,
        localized: route.localized,
        locale,
        isDefault,
      });
    }
  }
  return entries;
}

/** Paths handed to React Router's `prerender`, including the 404 page. */
export async function prerenderPaths() {
  const entries = await routeEntries();
  return [...entries.map(e => e.url), '/404/'];
}
