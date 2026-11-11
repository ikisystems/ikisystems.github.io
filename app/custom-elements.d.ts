import type { DetailedHTMLProps, HTMLAttributes } from 'react';

/**
 * The per-page wrapper elements `src/styles.css` selects on.
 *
 * The global stylesheet styles five elements by tag name — `app-root`,
 * `app-home`, `app-privacy`, `app-terms` and `app-not-found` — giving each of
 * them `display: block; width: 100%`. Each page wraps itself in its own one,
 * which is what keeps anything added to the global sheet for one page scoped
 * to that page.
 *
 * They are valid HTML5 custom element names and React renders them verbatim;
 * nothing is registered or upgraded. On this site nothing could be: no
 * JavaScript ships.
 */
type Host = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>;

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'app-root': Host;
      'app-home': Host;
      'app-privacy': Host;
      'app-terms': Host;
      'app-not-found': Host;
    }
  }
}
