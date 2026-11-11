# Contributing

Six gates. Each one exists because something got published that should not
have, or nearly did.

```sh
npm run check:repo       # no address or port literals in any tracked file
npm run typecheck        # the build strips types without checking them
npm run check:publish    # build, stage _site, prune, verify what would deploy
npm run check:assets     # every asset a prerendered page references exists
npm run check:routes     # the URL -> route truth table
```

That is the order `.github/workflows/pages.yml` runs them in, so a green local
run and a green CI run mean the same thing. The sixth,
`scripts/prune-unreferenced.mjs`, is not a separate command: it runs inside
`check:publish`, between the staging copy and the verifier.

## `check:repo` — no machine, host or port literals

Nothing in a tracked file may hard-code an address or a port. A published
literal is both a thing that goes stale and a thing that describes whoever
wrote it. A dev server takes `--port`; that is why the README says
`npm start -- --port <n>` and names no number.

Note what this gate reads: **tracked** files, via `git ls-files`. In a checkout
with no commits yet it scans nothing and passes, which looks identical to
passing properly. If it reports `0 text file(s)`, it has not run.

## `typecheck` — because the build will not do it

`vite build` strips TypeScript types without checking them. A type error in a
page builds green and ships. `npm run typecheck` runs `react-router typegen`
first, so generated route types are current before `tsc` sees them.

## `check:publish` — what would actually deploy

Builds, stages `build/client/*` into `_site` exactly as the Actions job does,
prunes, then runs `scripts/verify-publish-artifact.mjs` over the result. It
refuses:

- any source directory or config file that leaked into the artifact
  (`app/`, `scripts/`, `src/`, `package.json`, `locales.json`, …);
- any `.ts`, `.mjs`, `.map` or `.json` file;
- any dotfile but `.nojekyll` — `extname('.DS_Store')` is `''` in Node, so the
  extension rule can never catch one, and the same hole admits `.env`;
- tooling attribution in any published HTML, JS or SVG;
- a private identifier (a `.swift` filename, an absolute volume path) in the
  same;
- **any XML comment in a published SVG.** Export tools write a banner naming
  themselves and their version — `brand-icon.svg` arrived with one and it had
  to be stripped at source. The rule is not applied to HTML, because the
  prerender emits framework comment nodes into every page.

Two files have to survive all of that and be in `_site`: **`.nojekyll`**, or
Jekyll strips underscored paths, and **`CNAME`**, or Pages forgets the custom
domain. The verifier asserts the first and not the second. Check `CNAME` by
hand.

## `prune-unreferenced` — this site publishes no JavaScript

There is nothing interactive on any of the four pages, and the static site this
replaced never shipped a `<script>` tag. `app/root.tsx` renders no `<Scripts />`
and no `<ScrollRestoration />`, so none of the client bundle React Router
builds is ever requested. The prune deletes every asset no page refers to and
then asserts that no `.js` survived.

The consequences are intended, not incidental. There is no client-side router,
so every link is a real navigation; and `app/routes.ts` registers no `*` splat
route, because an unmatched URL can only be answered by the `404.html` the host
serves.

If a page ever genuinely needs a script, the prune will fail with that file
named. That is a change of kind: update `app/root.tsx`, the prune's assertion
and `private/AGENTS.md` together, deliberately.

## `check:assets` — the failure the other gates cannot see

`copy.json` stores image paths relative to the site root
(`speakwith-icon.png`). **No `<base>` tag ships here** — one would also rewrite
in-page `#fragment` links — so `app/lib/asset.ts` makes each path root-absolute
at render time.

Get that wrong and the page renders the correct text with the correct head tags
while every image on `/privacy/` 404s. This gate resolves every `src`,
`poster`, `srcset` and icon `href` in every prerendered page against the build
root and asserts the file is there. It also fails a reference that is merely
*relative*, even when the file happens to exist at the root, because on a
nested route that reference is already wrong.

## Three things that must not be changed

**`ssr: true` in `react-router.config.ts`, never `false`.** React Router reads
`false` as SPA mode, and prerendering then writes the same empty shell to every
path — no `<title>`, no meta, no page text. On a site whose entire value is
SEO-correct static HTML that is a silent catastrophe, and it looks fine in a
browser, because the client renders the real page a moment later. (It would not
look fine here, where no client code runs at all — it would ship four blank
pages.)

**`routeDiscovery: 'initial'`.** The `lazy` default fetches `/__manifest` on
navigation to discover routes, an endpoint only a running React Router server
answers.

**The `/privacy/` and `/terms/` paths.** App Store Connect points at both, and
`/terms/` carries the auto-renewing-subscription disclosure. They must keep
prerendering to exactly those URLs, trailing slash included.

## Style

One CSS Module per page for anything that page alone needs. The shared classes
— the hero, the product card, `.prose`, the footer, and the per-page custom
element rules — live in `src/styles.css`, because they came from the static
site's inline stylesheets and are what keeps the two looking identical.

Edit `src/theme-tokens.css`, never `app/generated/theme-prelude.ts` — that file
is generated per build and git-ignored.
