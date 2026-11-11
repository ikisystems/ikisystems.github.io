import { Fragment } from 'react';
import { useLocaleApi } from '../lib/locale';

export interface LegalCopy {
  heading: string;
  meta: string;
  intro: string;
  sections: readonly { readonly heading: string; readonly paragraphs: readonly string[] }[];
}

/**
 * The shared body of the two legal pages: the cross-site nav, the heading, the
 * "Last updated" line, the intro, then one `<h2>` per section with its
 * paragraphs.
 *
 * Every string here is set as HTML rather than text, which is unusual enough
 * to say why. The published policy text carries inline markup — `<a>` to
 * OpenAI's policies and to ikisystems.com, `<strong>` on the accuracy
 * disclaimer — and HTML entities (`&#x27;`, `&quot;`, `&rsquo;`) that were
 * written into the source pages. These pages are the live App Store privacy
 * policy and terms of service; the point of the port is that the rendered text
 * is byte-identical to what ikisystems.com serves today, so the markup is
 * carried across verbatim instead of being re-expressed as React elements.
 *
 * That makes copy.json the trust boundary. It is a tracked file in this repo,
 * authored by hand and reviewed in a diff — not user input, not fetched. The
 * usual objection to `dangerouslySetInnerHTML` is untrusted content, and there
 * is none here.
 *
 * A reworded policy therefore lands in copy.json, where the diff shows the
 * change in the words rather than in the components around them.
 */
export function LegalPage({ copy: legal }: { copy: LegalCopy }) {
  const { copy } = useLocaleApi();

  return (
    <article className="prose">
      <nav>
        {copy.legal.nav.map((link, i) => (
          <Fragment key={link.href}>
            {i > 0 ? copy.legal.navSeparator : null}
            <a href={link.href}>{link.label}</a>
          </Fragment>
        ))}
      </nav>
      <h1 dangerouslySetInnerHTML={{ __html: legal.heading }} />
      <p className="meta" dangerouslySetInnerHTML={{ __html: legal.meta }} />
      <p className="intro" dangerouslySetInnerHTML={{ __html: legal.intro }} />
      {legal.sections.map(section => (
        <Fragment key={section.heading}>
          <h2 dangerouslySetInnerHTML={{ __html: section.heading }} />
          {section.paragraphs.map((para, i) => (
            <p key={i} dangerouslySetInnerHTML={{ __html: para }} />
          ))}
        </Fragment>
      ))}
    </article>
  );
}
