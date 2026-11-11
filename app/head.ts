import type { MetaDescriptor } from 'react-router';
import {
  DEFAULT_LOCALE,
  LOCALES,
  MULTILINGUAL,
  ORIGIN,
  copyFor,
  localeDef,
  localizedPath,
} from '../src/content/copy';
import { resolveRoute } from './lib/route-resolve';

/**
 * Route-aware head tags: title, description, canonical URL.
 *
 * It returns the COMPLETE set every time. React Router replaces a parent's
 * meta with the leaf's rather than merging them, so a partial return here
 * would silently drop whatever the root contributed.
 *
 * There are deliberately **no** Open Graph and no Twitter tags. These pages
 * have never carried them and there is no 1200x630 social card to point
 * `og:image` at; a `summary_large_image` card aimed at a square icon renders
 * worse than no card at all. Adding them is a separate decision, with an image
 * to go with it.
 */
const SITE_NAME = 'IKI Systems';

/**
 * Absolute canonical URL, published **without** a trailing slash
 * (`https://ikisystems.com/privacy`) even though the page is prerendered to a
 * directory (`/privacy/index.html`). Both forms resolve on a file host, and
 * the slashless one is what these pages have always published, so it is the
 * form already indexed and already linked. The home page keeps its single
 * slash.
 *
 * `scripts/generate-sitemap.mjs` has to agree with this function, and
 * `scripts/verify-publish-artifact.mjs` asserts that it does — the two
 * disagreed once, and nothing a visitor does would ever have shown it.
 */
function canonicalUrl(pathname: string): string {
  const path = pathname.split('#')[0].split('?')[0];
  if (path === '' || path === '/') {
    return `${ORIGIN}/`;
  }
  return `${ORIGIN}${path.replace(/\/+$/, '')}`;
}

/**
 * Absolute alternates for the page, plus `x-default`. Empty when the page is
 * not localized or when this build ships a single locale — which is every
 * build today: a lone `en` + `x-default` pair says nothing and would only
 * churn the index. Kept so adding a locale to locales.json is the whole change.
 */
function alternates(page: string, localized: boolean): MetaDescriptor[] {
  if (!MULTILINGUAL || !localized) {
    return [];
  }
  const links = LOCALES.map(locale => ({
    tagName: 'link' as const,
    rel: 'alternate',
    hreflang: locale.htmlLang,
    href: `${ORIGIN}${localizedPath(page, locale)}`,
  }));
  links.push({
    tagName: 'link' as const,
    rel: 'alternate',
    hreflang: 'x-default',
    href: `${ORIGIN}${localizedPath(page, localeDef(DEFAULT_LOCALE))}`,
  });
  return links;
}

/** The full head for `pathname`: title, description, canonical. */
export function headFor(pathname: string): MetaDescriptor[] {
  const { locale, page, localized, notFound, def } = resolveRoute(pathname);
  const copy = copyFor(locale.code);
  const seo = notFound
    ? (copy.seo.notFound as { title: string; description?: string })
    : (copy.seo[def!.seoKey] as { title: string; description?: string });

  const title = seo.title ?? SITE_NAME;
  // Only the home page carries a `meta description`; the two legal pages and
  // the 404 have a title and nothing else, and no tag is emitted for them.
  // There is deliberately no site-wide fallback string here: the home page's
  // description lives in copy.json like every other string, and a default
  // copied into this file would be a second place to edit it and a second
  // place for it to go stale.
  const description = seo.description;
  const canonical = canonicalUrl(pathname);

  const tags: MetaDescriptor[] = [{ title }];
  if (description) {
    tags.push({ name: 'description', content: description });
  }
  // The 404 is not a page of the site and publishes no canonical, matching
  // the static 404.html.
  if (!notFound) {
    tags.push({ tagName: 'link', rel: 'canonical', href: canonical });
  }
  tags.push(...alternates(page, localized));
  return tags;
}

export { SITE_NAME };
