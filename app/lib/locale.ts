import { useLocation } from 'react-router';
import {
  DEFAULT_LOCALE,
  MULTILINGUAL,
  type Copy,
  type LocaleDef,
  copyFor,
  localeDef,
  localizedPath,
} from '../../src/content/copy';
import { resolveRoute } from './route-resolve';

/**
 * Active locale, resolved copy, and locale-aware link helpers.
 *
 * Every component reads its strings through this hook rather than importing
 * copy.json, so the one place a link is built is `path()` and the one place a
 * string is resolved is `copyFor()`. The locale is derived from the pathname
 * by `resolveRoute`, which is pure and gives the same answer during prerender
 * and in the browser.
 */
export interface LocaleApi {
  locale: LocaleDef;
  copy: Copy;
  /** Route path of the current page relative to the locale prefix ('' = home). */
  page: string;
  /** False on English-only pages (legal carve-out) and on the 404 page. */
  pageIsLocalized: boolean;
  /** True when more than one locale is active for this build. */
  multilingual: boolean;
  /** Site-relative link to `routePath` (e.g. `'getting-started'`, `''`) in the active locale. */
  path: (routePath: string) => string;
}

export function useLocaleApi(): LocaleApi {
  const { pathname } = useLocation();
  const { locale, page, localized, notFound } = resolveRoute(pathname);
  const copy = copyFor(locale.code);

  return {
    locale,
    copy,
    page,
    // The 404 page is not a localized page, the same as in Angular, where the
    // route carries no `data.localized` and the getter defaults to false.
    pageIsLocalized: localized && !notFound,
    multilingual: MULTILINGUAL,
    path: (routePath: string) => localizedPath(routePath, locale),
  };
}

export { DEFAULT_LOCALE, localeDef };
