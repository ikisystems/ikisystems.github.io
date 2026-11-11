import { useLocaleApi } from '../lib/locale';

/**
 * Shared footer: the copyright line, and nothing else.
 *
 * It carried Privacy and Terms links until 2026-11-08. They were removed
 * because a policy belongs to a product, not to the company page: each
 * application ships its own privacy policy and terms, and this page fronts
 * three of them. The links named SpeakWith's alone, which made the company
 * page present one product's policy as though it governed all of them.
 *
 * They were also dead. Both pointed at `speakwith.ikisystems.com`, a host with
 * no DNS record at all, so neither resolved for a visitor.
 *
 * This is the decision `AGENTS.md` asks to be made on purpose rather than
 * silently repointed — so: not repointed at this site's own `/privacy/` and
 * `/terms/` either. Those two pages stay published and reachable, because they
 * are the URLs App Store Connect links and `/terms/` carries the
 * auto-renewing subscription disclosure. They are simply no longer advertised
 * from the home page.
 *
 * `copyrightHtml` is a template in copy.json carrying an entity, so it is set
 * as HTML rather than text. `{{year}}` is filled at prerender time, which is
 * build time: the published page carries a literal year, exactly as the static
 * page did, and it goes stale the same way until the next build.
 *
 * Still rendered on the home page alone (see app/root.tsx). The legal pages
 * carry their own nav.
 */
export function Footer() {
  const { copy } = useLocaleApi();

  const copyright = copy.app.footer.copyrightHtml.replace('{{year}}', String(new Date().getFullYear()));

  return (
    <footer>
      <div dangerouslySetInnerHTML={{ __html: copyright }} />
    </footer>
  );
}
