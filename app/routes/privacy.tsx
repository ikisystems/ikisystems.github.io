import type { MetaArgs } from 'react-router';
import { LegalPage } from '../components/LegalPage';
import { headFor } from '../head';
import { useLocaleApi } from '../lib/locale';

/**
 * Privacy policy.
 *
 * `/privacy/` is linked from App Store Connect, so this path is fixed: it must
 * stay prerendered at exactly that URL, trailing slash included, and the
 * published canonical stays the slashless form the static page used.
 *
 * One of the two `localized: false` routes: registered for the default locale
 * only, so a prefixed locale would 404 here rather than serve an untranslated
 * legal page.
 *
 * The body text is the live policy and lives in copy.json; see LegalPage for
 * why it is carried as markup.
 */
export const meta = ({ location }: MetaArgs) => headFor(location.pathname);

export default function Privacy() {
  const { copy } = useLocaleApi();

  return (
    <app-privacy>
      <LegalPage copy={copy.privacy} />
    </app-privacy>
  );
}
