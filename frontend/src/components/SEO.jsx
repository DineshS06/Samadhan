import { useEffect } from 'react';

export const SITE_URL =
  (import.meta.env.VITE_SITE_URL ||
    'https://samadhan-chi.vercel.app').replace(/\/$/, '');

const IMAGE = SITE_URL + '/og-samadhan.png';

const add = (t, a, x) => {
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
    add('meta', { name: 'twitter:card', content: 'summary_large_image' });
    add('meta', { name: 'twitter:title', content: full });
    add('meta', { name: 'twitter:description', content: description });

    add('link', { rel: 'canonical', href: u });

    if (!noIndex && schema.length)
      add('script', { type: 'application/ld+json' }, JSON.stringify({ '@context': 'https://schema.org', '@graph': schema }));

    return () => document.querySelectorAll('[data-seo-managed]').forEach((n) => n.remove());
  }, [title, description, path, noIndex, schema]);

  return null;
}