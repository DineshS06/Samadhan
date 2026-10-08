import { useEffect } from 'react';

export const SITE_URL =
  (import.meta.env.VITE_SITE_URL ||
    'https://samadhan-chi.vercel.app').replace(/\/$/, '');

const IMAGE = SITE_URL + '/og-samadhan.png';

/**
 * Identity of a head tag for upsert purposes: which attribute names it.
 * `meta name=description` and `meta property=og:title` are the same tag seen
 * from different angles, so both key on (name|property|rel).
 */
const identityOf = (t, a) =>
  a.name ? `name=${a.name}` : a.property ? `property=${a.property}` : a.rel ? `rel=${a.rel}` : null;

/**
 * Insert or replace a head tag.
 *
 * index.html ships static copies of the description, robots, Open Graph and
 * Twitter tags so crawlers that do not execute JS still see them. Appending a
 * managed duplicate without removing those left every page carrying TWO of each
 * tag after hydration, which is contradictory markup rather than a fallback.
 * So upsert: clear any unmanaged tag with the same identity first.
 */
const add = (t, a, x) => {
  const id = identityOf(t, a);
  if (id) {
    const key = id.slice(0, id.indexOf('='));
    const want = id.slice(id.indexOf('=') + 1);
    // Two passes: a previously managed tag, then the unmanaged static copy
    // shipped in index.html. Both must go or the page carries two of each tag.
    document.head
      .querySelectorAll(`${t}[${key}="${want}"], ${t}[${key}="${want}"]:not([data-seo-managed])`)
      .forEach((n) => n.remove());
  }
  const n = document.createElement(t);
  n.dataset.seoManaged = 'true';
  Object.entries(a).forEach(([k, v]) => n.setAttribute(k, String(v)));
  if (x) n.textContent = x;
  document.head.appendChild(n);
};

export default function SEO({
  title,
  description,
  path = '/',
  noIndex = false,
  schema = [],
}) {
  useEffect(() => {
    document
      .querySelectorAll('[data-seo-managed]')
      .forEach((n) => n.remove());

    const u =
      SITE_URL + (path === '/' ? '/' : path.replace(/\/$/, ''));
    const full = title.includes('Samadhan') ? title : title + ' | Samadhan';
    const robots = noIndex
      ? 'noindex, nofollow, noarchive'
      : 'index, follow, max-image-preview:large, max-snippet:-1';

    document.title = full;

    add('meta', { name: 'description', content: description });
    add('meta', { name: 'robots', content: robots });
    add('meta', { name: 'googlebot', content: robots });
    add('meta', { property: 'og:title', content: full });
    add('meta', { property: 'og:description', content: description });
    add('meta', { property: 'og:type', content: 'website' });
    add('meta', { property: 'og:url', content: u });
    add('meta', { property: 'og:site_name', content: 'Samadhan' });
    add('meta', { property: 'og:locale', content: 'en_IN' });
    add('meta', { property: 'og:image', content: IMAGE });
    add('meta', { property: 'og:image:width', content: '1200' });
    add('meta', { property: 'og:image:height', content: '630' });
    add('meta', { property: 'og:image:alt', content: 'Samadhan - AI constituency development planning platform' });
    add('meta', { name: 'twitter:card', content: 'summary_large_image' });
    add('meta', { name: 'twitter:site', content: '@samadhan' });
    add('meta', { name: 'twitter:creator', content: '@samadhan' });
    add('meta', { name: 'twitter:title', content: full });
    add('meta', { name: 'twitter:description', content: description });
    add('meta', { name: 'twitter:image', content: IMAGE });
    add('meta', { name: 'twitter:image:alt', content: 'Samadhan AI constituency planning platform preview' });

    add('link', { rel: 'canonical', href: u });

    // No hreflang: the site ships one language. Emitting alternates that all
    // resolve to this same URL is an error signal, not a multilingual signal.
    // Add hreflang only alongside real, distinct localized pages.

    if (!noIndex && schema.length)
      add('script', { type: 'application/ld+json' }, JSON.stringify({ '@context': 'https://schema.org', '@graph': schema }));

    return () => document.querySelectorAll('[data-seo-managed]').forEach((n) => n.remove());
  }, [title, description, path, noIndex, schema]);

  return null;
}