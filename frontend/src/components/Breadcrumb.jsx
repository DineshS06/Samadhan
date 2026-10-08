import { Link, useLocation } from 'react-router-dom';
import { SITE_URL } from './SEO';

const breadcrumbMap = {
  '/': [{ name: 'Home', url: SITE_URL }],
  '/report-issue': [
    { name: 'Home', url: SITE_URL },
    { name: 'Report Issue', url: SITE_URL + '/report-issue' },
  ],
  '/how-it-works': [
    { name: 'Home', url: SITE_URL },
    { name: 'How It Works', url: SITE_URL + '/how-it-works' },
  ],
  '/methodology': [
    { name: 'Home', url: SITE_URL },
    { name: 'Methodology', url: SITE_URL + '/methodology' },
  ],
  '/faq': [
    { name: 'Home', url: SITE_URL },
    { name: 'FAQs', url: SITE_URL + '/faq' },
  ],
  '/about': [
    { name: 'Home', url: SITE_URL },
    { name: 'About', url: SITE_URL + '/about' },
  ],
  '/privacy': [
    { name: 'Home', url: SITE_URL },
    { name: 'Privacy', url: SITE_URL + '/privacy' },
  ],
  '/accessibility': [
    { name: 'Home', url: SITE_URL },
    { name: 'Accessibility', url: SITE_URL + '/accessibility' },
  ],
  // No /contact entry: the Contact page lives in src/unpublished/ because it
  // published an @samadhan.example address and a fabricated map. There is no
  // /contact route, so a breadcrumb for it was a dead internal link.
  '/mp/login': [
    { name: 'Home', url: SITE_URL },
    { name: 'MP Login', url: SITE_URL + '/mp/login' },
  ],
  '/mp': [
    { name: 'Home', url: SITE_URL },
    { name: 'MP Dashboard', url: SITE_URL + '/mp' },
  ],
};

export function getBreadcrumbs(pathname) {
  return breadcrumbMap[pathname] || [{ name: 'Home', url: SITE_URL }];
}

export function BreadcrumbSchema(pathname) {
  const items = getBreadcrumbs(pathname);
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export default function Breadcrumb({ className = '' }) {
  const { pathname } = useLocation();
  const items = getBreadcrumbs(pathname);

  return (
    <nav className={`breadcrumb ${className}`} aria-label='Breadcrumb'>
      <ol className='breadcrumb__list'>
        {items.map((item, index) => (
          <li key={item.url} className='breadcrumb__item'>
            {index < items.length - 1 ? (
              <Link to={item.url.replace(SITE_URL, '')} className='breadcrumb__link'>
                {item.name}
              </Link>
            ) : (
              <span className='breadcrumb__current' aria-current='page'>
                {item.name}
              </span>
            )}
            {index < items.length - 1 && <span className='breadcrumb__separator' aria-hidden='true'>/</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
