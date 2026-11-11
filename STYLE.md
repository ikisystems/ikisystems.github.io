# Copy style

This site has about a dozen strings of its own, and two pages of published
legal text it is not free to touch. So this is short.

## All of it lives in `copy.json`

`src/app/content/copy.json` is the source of truth for every user-visible
string. Components read it through `useLocaleApi().copy` and hard-code nothing
— not a heading, not a product name, not the arrow on a card. A copy change is
a diff in one file, which is the point.

A key ending in `Html` carries inline markup or an HTML entity and is set as
HTML. Everything else is text. Do not add markup to a key that is not named
that way.

## The company voice

Plain, specific, and about the product rather than about us. The tagline and
the three card bodies are the whole of it, and they follow one shape:

> **what it does for you**, then **where it runs**.

- "Your spoken ideas, captured as a daily document. For Mac and iOS."
- "Heart rate from Apple Health, drawn as a daily graph. For iPhone, iPad, and
  Mac."

No superlatives, no "powerful", no "seamlessly", no exclamation marks. Name the
platforms exactly as Apple does — "Mac", "iPhone", "iPad", "iOS" — and say them
in that order. Sentence case everywhere except product names.

One sentence per card body, plus the platform clause. A card that needs two
sentences is a product page's job, and every card links to one.

## The tagline is a claim about the whole catalogue

The tagline sits above every card, so it constrains what can go below it, and
the home page's `meta description` names the products one by one — so adding a
product is a change to three strings, not one.

Keep all three in step: `home.tagline`, `seo.home.description` and the new
card's `body`. A tagline that needs an exception for one card is not doing its
job, and the fix belongs in the tagline rather than in a footnote on the card.
Both are one-line edits in `copy.json`.

## The legal pages are not copy

`privacy` and `terms` in `copy.json` are the published Privacy Policy and Terms
of Service. App Store Connect links to both, and the terms carry the
auto-renewing-subscription disclosure Apple requires. Nothing in them is a
phrasing preference. Edit them because the policy changed, with the "Last
updated" line moved in the same change, or leave them alone.
