import type { MetaArgs } from 'react-router';
import { LegalPage } from '../components/LegalPage';
import { headFor } from '../head';
import { useLocaleApi } from '../lib/locale';

/**
 * Terms of service.
 *
 * `/terms/` is linked from App Store Connect, and its "Auto-renewing
 * subscription" section is the disclosure Apple requires for the SpeakWith Pro
 * subscription — product id, price, trial length, renewal and cancellation
 * terms. That section is the reason this page cannot drift: it must keep
 * resolving at this exact URL, with that text intact.
 *
 * One of the two `localized: false` routes: registered for the default locale
 * only, so a prefixed locale would 404 here rather than serve an untranslated
 * legal page.
 */
export const meta = ({ location }: MetaArgs) => headFor(location.pathname);

export default function Terms() {
  const { copy } = useLocaleApi();

  return (
    <app-terms>
      <LegalPage copy={copy.terms} />
    </app-terms>
  );
}
