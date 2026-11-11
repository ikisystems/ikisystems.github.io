/**
 * Absolute URL for a static asset path as copy.json writes it.
 *
 * copy.json stores every image path relative to the site root
 * ('hero-mac-20261014.png', 'badges/app-store.svg'). The Angular site had
 * `<base href="/">` in index.html, which made those resolve from the root on
 * every route. No base tag ships here — it would also rewrite in-page
 * `#fragment` links — so each path is made root-absolute instead. Without
 * this, every image on /getting-started/ would 404 while the page's text and
 * head tags still looked right. `npm run check:assets` is the gate.
 */
export function asset(path: string): string {
  if (/^(?:[a-z]+:)?\/\//i.test(path) || path.startsWith('/')) {
    return path;
  }
  return `/${path}`;
}
