# IKI Systems

The company page for **IKI Systems**: who we are and what we make, with one
card per product and the policies the App Store links to.

Live at **<https://ikisystems.com>**.

Four pages and nothing else: the home page, the Privacy Policy, the Terms of
Service, and a 404. React Router 7 in prerender mode, which means the build
runs each route once and writes the HTML that ships; no server runs, and —
unusually — no JavaScript ships either. There is nothing interactive on any of
the four pages, so the hydration bundle is built and then dropped
(`scripts/prune-unreferenced.mjs`), and what GitHub Pages serves is HTML, CSS
and images. Dark mode is `prefers-color-scheme` in a stylesheet, with no toggle
and no stored preference.

## Working on it

```sh
npm ci
npm start -- --port <n>     # dev server; omit --port to let Vite choose
npm run build               # prerender every route + write the sitemap
```

Before calling a change done, run the same checks CI runs:

```sh
npm run check:repo          # no machine paths, hosts or ports in tracked files
npm run typecheck
npm run check:publish       # build, stage _site, prune, verify the artifact
npm run check:assets        # every asset a page references exists
npm run check:routes        # the route resolver agrees with the matrix
```

`npm run check:publish` is the one that matters most. It stages exactly what
gets published into `_site/` and then refuses it if anything is there that
should not be — source files, a stray dotfile, a JavaScript bundle, tooling
attribution. `_site/.nojekyll` and `_site/CNAME` both have to be in that
staging output or Pages serves the wrong thing.

## Where things live

| Path | What |
|---|---|
| `src/app/content/copy.json` | **Every user-visible string.** Components read it through `useLocaleApi().copy`; none of them hard-code text. |
| `src/app/content/locales.json` | The locale x route matrix. The route table, the prerender list and the sitemap are all derived from it, so the set of URLs that exists is written down once. |
| `src/theme-tokens.css` | The palette, light and dark. Inlined into every page's `<head>` so there is no flash before the stylesheet loads. |
| `src/styles.css` | Global styles. Consumes the tokens via `var(--*)`; defines no colour. |
| `app/routes/` | One module per page. |
| `app/head.ts` | Title, description and canonical URL per route. |
| `scripts/` | The build's own gates and generators. |

### Adding a product

Append an entry to `copy.json`'s `home.products` — `title`, `icon`, `href`,
`body` — and drop a 256x256 PNG into `public/`. The home page maps over that
array, so there is no markup to clone and no class to name. Scrub the icon's
metadata before committing it (see below).

### The two legal pages are load-bearing

`/privacy/` and `/terms/` are the URLs App Store Connect points at, and
`/terms/` carries the auto-renewing-subscription disclosure Apple requires.
Those paths must keep resolving, trailing slash included, and their text is the
published policy rather than site copy: reword it on purpose, in `copy.json`,
or not at all.

### Image metadata

Images carry authoring metadata — the tool that made them, the time it did,
sometimes a device name. None of that belongs in a public repo. Strip it before
committing a new image.
