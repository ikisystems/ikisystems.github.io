import type { MetaArgs } from 'react-router';
import { headFor } from '../head';
import { asset } from '../lib/asset';
import { useLocaleApi } from '../lib/locale';
import s from './not-found.module.css';

/**
 * 404 page. Registered once, at `/404`, which is prerendered so the publish
 * step can copy it to the `404.html` GitHub Pages serves for an unmatched URL.
 *
 * No `*` splat companion: there is no client-side router here to answer an
 * unmatched URL, so the host's 404.html is the whole mechanism (see
 * app/root.tsx).
 *
 * The link out is a plain `<a href="/">`, as the static page had it, and the
 * footer is suppressed on this route to match.
 */
export const meta = ({ location }: MetaArgs) => headFor(location.pathname);

export default function NotFound() {
  const { copy } = useLocaleApi();

  return (
    <app-not-found className={s.nf}>
      <img src={asset(copy.app.brandMark)} alt="" width={56} height={56} className={s.nf__mark} />
      <h1 className={s.nf__heading}>{copy.notFound.heading}</h1>
      <p className={s.nf__lead} dangerouslySetInnerHTML={{ __html: copy.notFound.leadHtml }} />
      <a className={s.nf__cta} href="/" dangerouslySetInnerHTML={{ __html: copy.notFound.ctaHtml }} />
    </app-not-found>
  );
}
