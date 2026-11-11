import { reactRouter } from '@react-router/dev/vite';
import { resolve } from 'node:path';
import { defineConfig, searchForWorkspaceRoot } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { CONTENT_DIR, PUBLIC_DIR, SUPPORT_SITE_DIR, assertSupportSite } from './scripts/lib/site-content.mjs';

// Fails with the path it looked for if the content tree is not where
// SUPPORT_SITE_DIR says, rather than as a module-not-found deeper in the build.
assertSupportSite();

export default defineConfig({
  plugins: [reactRouter(), tsconfigPaths()],

  // Favicons, badges, screenshots and the app icon, served at the site root.
  publicDir: PUBLIC_DIR,

  resolve: {
    // Both of these are resolved through SUPPORT_SITE_DIR rather than written
    // as relative imports, so a build can be pointed at a content tree
    // elsewhere. tsconfig.json mirrors them for the type checker.
    alias: {
      // copy.json and locales.json — the site's text.
      '@content': CONTENT_DIR,
      // styles.css and the theme sources.
      '@site': resolve(SUPPORT_SITE_DIR, 'src'),
    },
  },

  server: {
    // No port is pinned here: pass `--port` to choose one, otherwise Vite's
    // default applies. strictPort makes a collision on whichever port was
    // asked for fail loudly, instead of quietly sliding to the next free one
    // and leaving a bookmark on a dead port.
    strictPort: true,
    fs: {
      // Setting `allow` REPLACES Vite's default list, so the workspace root has
      // to be restated or the project's own files stop being servable.
      allow: [searchForWorkspaceRoot(process.cwd()), SUPPORT_SITE_DIR],
    },
  },
});
