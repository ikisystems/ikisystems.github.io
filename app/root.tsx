import {
  Links,
  Meta,
  Outlet,
  isRouteErrorResponse,
  useLocation,
  type LinksFunction,
} from 'react-router';
import { THEME_TOKENS_CSS } from './generated/theme-prelude';
import { resolveRoute } from './lib/route-resolve';
import { Footer } from './components/Footer';
import '@site/styles.css';
import shell from './root.module.css';

/**
 * Tab and home-screen icons, root-absolute because no `<base href="/">`
 * ships here. The company mark is a raster tile, so there is no SVG icon
 * link: a modern browser takes the first icon, and an SVG link would keep
 * the previous curves in front of the PNG. `favicon-32.png` is the tab
 * icon. `apple-touch-icon.png` is what iOS and iPadOS use when the page is
 * added to a home screen. There is no PWA manifest and no social card image.
 *
 * The `?v=` query carries the day the mark changed. Browsers and
 * intermediaries cache a favicon aggressively and ignore a path's own
 * freshness headers, so replacing the file alone leaves the old mark in
 * place for visitors who have already seen it. Bump this string whenever an
 * icon's bytes change; it is inert otherwise.
 */
const ICON_VERSION = '20261111';

export const links: LinksFunction = () => [
  { rel: 'icon', type: 'image/png', sizes: '32x32', href: `/favicon-32.png?v=${ICON_VERSION}` },
  { rel: 'apple-touch-icon', href: `/apple-touch-icon.png?v=${ICON_VERSION}` },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const { locale } = resolveRoute(pathname);

  return (
    <html lang={locale.htmlLang}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Per-scheme theme colour, as the static pages shipped it. There is no
            `id="meta-theme-color"` and no script updating it: the two media
            queries are the whole mechanism. */}
        <meta name="theme-color" content="#faf7f0" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#131418" media="(prefers-color-scheme: dark)" />
        {/* Theme tokens are inlined (not in styles.css) so they apply on the very
            first paint, before the deferred stylesheet loads. This is what prevents
            the light-background flash on dark systems. Authored in
            src/theme-tokens.css; see scripts/extract-theme-prelude.mjs. */}
        <style id="theme-tokens" dangerouslySetInnerHTML={{ __html: THEME_TOKENS_CSS }} />
        <Meta />
        <Links />
      </head>
      <body>{children}</body>
    </html>
  );
}

/**
 * Application shell: routed page content and the shared footer.
 *
 * No `<Scripts />`, and no `<ScrollRestoration />`. That is intentional and
 * load-bearing, not an oversight: this is a four-page company page with no
 * interactive element on any of them, and it has never shipped a `<script>`
 * tag. Dropping the hydration bundle keeps that true, so what the host serves
 * is HTML and CSS and nothing else. `scripts/prune-unreferenced.mjs` is the
 * gate that holds the line.
 *
 * Two consequences, both intended. There is no client-side router, so every
 * link is a real navigation — which is why the footer and the legal-page nav
 * use `<a>` rather than `<Link>`; a `<Link>` without hydration renders an
 * anchor anyway, but writing one would imply a router that is not there.
 * And there is no `*` splat route in app/routes.ts: an unmatched URL is
 * answered by the prerendered `404.html` that the host serves, which is the
 * only 404 path a file host has.
 *
 * The head is a pure `meta` export per route (app/head.ts) rather than
 * anything that reacts to navigation, because during prerender there is no
 * navigation to react to.
 */
export default function App() {
  const { pathname } = useLocation();
  const { page, notFound } = resolveRoute(pathname);
  // The footer belongs to the home page only; the legal pages and the 404 end
  // at their content, each carrying its own navigation instead. See
  // app/components/Footer.tsx for what its links point at and why that is
  // worth knowing before adding it anywhere else.
  const showFooter = !notFound && page === '';

  return (
    <app-root className={shell.shell}>
      <main className={shell.main}>
        <Outlet />
      </main>
      {showFooter ? <Footer /> : null}
    </app-root>
  );
}

export function ErrorBoundary({ error }: { error: unknown }) {
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : 'Unknown error';

  return (
    <div className="prose">
      <h1>Something went wrong</h1>
      <p>{message}</p>
      <p>
        <a href="/">Back to IKI Systems</a>
      </p>
    </div>
  );
}
