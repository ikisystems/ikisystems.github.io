// Minimal HTML readers for the parity gate.
//
// Deliberately regex-based rather than a parser dependency: the two things
// being compared are head tags, which are flat, and the visible text of
// <main>, which only needs tags removed. A DOM would not make either more
// correct, and adding a parser to a site whose point is static output is rent
// paid for nothing.

const ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  '#39': "'", '#x27': "'", '#x2F': '/', '#47': '/', '#x60': '`', '#96': '`',
};

export function decodeEntities(text) {
  return text.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (whole, name) => {
    const key = name.toLowerCase();
    if (ENTITIES[name] !== undefined) return ENTITIES[name];
    if (ENTITIES[key] !== undefined) return ENTITIES[key];
    if (name.startsWith('#x') || name.startsWith('#X')) {
      return String.fromCodePoint(parseInt(name.slice(2), 16));
    }
    if (name.startsWith('#')) {
      return String.fromCodePoint(parseInt(name.slice(1), 10));
    }
    return whole;
  });
}

/** Attributes of one tag, as a plain object. */
function attrsOf(tag) {
  const out = {};
  for (const m of tag.matchAll(/([a-zA-Z:_-][\w:.-]*)\s*=\s*"([^"]*)"/g)) {
    out[m[1].toLowerCase()] = decodeEntities(m[2]);
  }
  return out;
}

/**
 * The head tags both sites are expected to agree on, as a flat
 * name -> value map so a difference names the tag that differs.
 *
 * Framework fingerprints are excluded on purpose: Angular stamps
 * `data-beasties-container` on <html> and React ships modulepreload links.
 * Neither is content, and comparing them would only produce noise that hides
 * the differences that matter.
 */
export function headTags(html) {
  const tags = {};

  const htmlTag = html.match(/<html\b[^>]*>/i);
  if (htmlTag) {
    tags['html[lang]'] = attrsOf(htmlTag[0])['lang'] ?? '';
  }

  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  tags['title'] = title ? decodeEntities(title[1]).trim() : '';

  for (const m of html.matchAll(/<meta\b[^>]*>/gi)) {
    const a = attrsOf(m[0]);
    const key = a['name'] ?? a['property'];
    if (!key) continue;
    if (key === 'description' || key.startsWith('og:') || key.startsWith('twitter:')) {
      tags[`meta[${key}]`] = a['content'] ?? '';
    }
  }

  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    const a = attrsOf(m[0]);
    if (a['rel'] === 'canonical') {
      tags['link[canonical]'] = a['href'] ?? '';
    }
    if (a['rel'] === 'alternate' && a['hreflang']) {
      tags[`link[alternate:${a['hreflang']}]`] = a['href'] ?? '';
    }
  }

  return tags;
}

/**
 * Visible text of one element, with markup, scripts and styles removed and
 * whitespace collapsed — what a reader actually sees, independent of which
 * framework emitted the elements around it.
 */
export function regionText(html, tag) {
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = html.match(re);
  const body = match ? match[1] : '';
  return (
    decodeEntities(
      body
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
        .replace(/<!--[\s\S]*?-->/g, ' ')
        // A tag becomes a space, never nothing: otherwise `<b>a</b><b>b</b>`
        // would read as "ab" on one site and "a b" on the other.
        .replace(/<[^>]+>/g, ' '),
    )
      .replace(/\s+/g, ' ')
      .trim()
  );
}

export const mainText = html => regionText(html, 'main');

/**
 * The navbar and the footer are hand-written here rather than generated from
 * the Angular template, and they live OUTSIDE <main> — which is how a dropped
 * active-nav class got all the way to a build with the text gate green. They
 * are compared too.
 */
export const headerText = html => regionText(html, 'header');
export const footerText = html => regionText(html, 'footer');

/**
 * Which primary-nav link is marked current. Class names differ between the
 * two frameworks (CSS Modules hash them), so this reports the LINK TEXT, which
 * is comparable.
 */
export function activeNavLinks(html) {
  const nav = html.match(/<nav\b[^>]*aria-label="Primary"[^>]*>([\s\S]*?)<\/nav>/i);
  if (!nav) return [];
  return [...nav[1].matchAll(/<a[^>]*>([^<]*)<\/a>/g)]
    .filter(a => /class="(?:[^"]*\bactive\b[^"]*|_active_[^"]*)"/.test(a[0]))
    .map(a => decodeEntities(a[1]).trim());
}

/** Local asset references (src/href/poster/srcset) in one document. */
export function assetRefs(html) {
  const refs = new Set();
  const add = value => {
    if (!value) return;
    const url = value.trim();
    if (!url || url.startsWith('#') || url.startsWith('data:') || url.startsWith('mailto:')) return;
    if (/^[a-z]+:\/\//i.test(url) || url.startsWith('//')) return;
    refs.add(url);
  };

  for (const m of html.matchAll(/<(?:img|video|source|script|link|a|use)\b[^>]*>/gi)) {
    const a = attrsOf(m[0]);
    // <a href> is a route, not an asset; only element sources are checked.
    if (/^<a\b/i.test(m[0])) continue;
    add(a['src']);
    add(a['poster']);
    if (a['rel'] === 'icon' || a['rel'] === 'apple-touch-icon' || a['rel'] === 'stylesheet') {
      add(a['href']);
    }
    for (const candidate of (a['srcset'] ?? '').split(',')) {
      add(candidate.trim().split(/\s+/)[0]);
    }
  }
  return [...refs];
}

/** First index where two strings diverge, with a little context either side. */
export function firstDifference(a, b, context = 70) {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  const from = Math.max(0, i - context);
  return {
    index: i,
    angular: a.slice(from, i + context),
    react: b.slice(from, i + context),
  };
}
