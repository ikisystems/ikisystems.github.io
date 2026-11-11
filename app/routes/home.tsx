import type { MetaArgs } from 'react-router';
import { headFor } from '../head';
import { asset } from '../lib/asset';
import { useLocaleApi } from '../lib/locale';
import s from './home.module.css';

/**
 * The company page: brand mark, wordmark, tagline, and one card per product.
 *
 * The card list maps over `copy.home.products`, so shipping another product is
 * an entry in copy.json and nothing else — no markup to clone, no class to
 * name. The flex column and its `gap` already stack N of them.
 *
 * Each card is a single `<a>` wrapping the whole row, which is why everything
 * inside it is a `<span>`: an `<h2>` or a `<p>` inside an anchor is invalid
 * HTML. The icons are decorative (`alt=""`) because the product name sits
 * right next to them as text.
 */
export const meta = ({ location }: MetaArgs) => headFor(location.pathname);

export default function Home() {
  const { copy } = useLocaleApi();

  return (
    <app-home className={s.home}>
      <div className="hero">
        <img
          className="hero__mark"
          src={asset(copy.app.brandMark)}
          alt=""
          width={72}
          height={72}
        />
        <h1 className="hero__wordmark">{copy.home.wordmark}</h1>
        <p className="hero__tagline">{copy.home.tagline}</p>
      </div>

      <div className="product-list">
        {copy.home.products.map(product => (
          <a className="product-card" href={product.href} key={product.title}>
            <span className="product-card__head">
              <img
                className="product-card__icon"
                src={asset(product.icon)}
                alt=""
                width={56}
                height={56}
              />
              <span className="product-card__copy">
                <span className="product-card__title">{product.title}</span>
                <span className="product-card__body">{product.body}</span>
              </span>
              <span className="product-card__arrow" aria-hidden="true">
                &rarr;
              </span>
            </span>
          </a>
        ))}
      </div>
    </app-home>
  );
}
