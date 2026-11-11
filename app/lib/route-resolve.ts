import {
  DEFAULT_LOCALE,
  LOCALES,
  ROUTE_DEFS,
  type LocaleDef,
  type RouteDef,
  localeDef,
} from '../../src/content/copy';

/**
 * What the Angular route factory attached as `data.locale` / `data.page` /
 * `data.localized`, recovered from the URL instead.
 *
 * React Router's framework routes carry no per-registration `data`, so there
 * is nowhere to hang the locale at route-definition time the way
 * `app.routes.ts` does. One pure function over the pathname replaces it, and
 * because it is pure it can be called from `meta`, from the root layout (for
 * `<html lang>`) and from components, all of which need the same answer.
 */
export interface ResolvedRoute {
  locale: LocaleDef;
  /** Route path relative to the locale prefix ('' = home). */
  page: string;
  /** False on English-only pages (legal carve-out) and on the 404 page. */
  localized: boolean;
  /** True when the pathname matches no registered route. */
  notFound: boolean;
  def?: RouteDef;
}

const PREFIXED = LOCALES.filter(l => l.prefix);

/** Split a pathname into clean segments, ignoring query and hash. */
function segmentsOf(pathname: string): string[] {
  const path = pathname.split('#')[0].split('?')[0];
  return path.split('/').filter(Boolean);
}

export function resolveRoute(pathname: string): ResolvedRoute {
  const segments = segmentsOf(pathname);

  // A leading segment that matches an active locale prefix selects that
  // locale; anything else is the unprefixed default (English).
  const prefixed = segments.length ? PREFIXED.find(l => l.prefix === segments[0]) : undefined;
  const locale = prefixed ?? localeDef(DEFAULT_LOCALE);
  const rest = prefixed ? segments.slice(1) : segments;
  const page = rest.join('/');

  if (page === '404') {
    return { locale: localeDef(DEFAULT_LOCALE), page: '404', localized: false, notFound: true };
  }

  const def = ROUTE_DEFS.find(r => r.path === page);

  // A non-localized page (Privacy, Terms) is registered for the default locale
  // only, so /de/privacy/ is a 404 rather than a German legal page — the same
  // carve-out the Angular factory makes by pushing those two routes when
  // `isDefault`.
  if (!def || (!def.localized && prefixed)) {
    return { locale, page, localized: false, notFound: true };
  }

  return { locale, page, localized: def.localized, notFound: false, def };
}
