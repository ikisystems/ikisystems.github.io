import type { Config } from '@react-router/dev/config';
import { prerenderPaths } from './scripts/lib/route-matrix.mjs';

export default {
  // `ssr: true` with an exhaustive `prerender` list. No server is deployed:
  // the build runs the server bundle once per route at build time, and the HTML
  // it emits is what ships. That replaces the Angular site's Express SSR entry,
  // which GitHub Pages could never run anyway.
  //
  // `ssr: false` is wrong here. React Router 7.18.4 treats it as SPA mode, and
  // "prerendering" then writes the SAME empty shell to every path — no
  // <title>, no meta, no page text. On a site whose entire value is SEO-correct
  // static HTML that is a silent catastrophe, and it looks fine in a browser,
  // because the client renders the real page a moment later.
  ssr: true,
  // Ship the whole route manifest in the initial payload. The default, `lazy`,
  // fetches `/__manifest` on navigation to discover routes — an endpoint only a
  // running React Router server answers. On a file host every client-side
  // navigation would 404 against it. This site has five routes, so there is
  // nothing to gain from discovering them lazily anyway.
  routeDiscovery: { mode: 'initial' },
  buildDirectory: 'build',
  prerender: () => prerenderPaths(),
} satisfies Config;
