import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ID = import.meta.env.VITE_GA4_MEASUREMENT_ID;

export default function GA4() {
  const l = useLocation();

  useEffect(() => {
    if (!ID || document.querySelector('script[data-ga4]')) return;

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () {
      window.dataLayer.push(arguments);
    };

    window.gtag('js', new Date());
    window.gtag('config', ID, {
      send_page_view: false,
      anonymize_ip: true,
    });

    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(ID);
    s.dataset.ga4 = ID;
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    if (!ID) return;

    const t = setTimeout(() => window.gtag && window.gtag('event', 'page_view', {
      page_path: l.pathname + l.search,
      page_title: document.title,
    }), 0);

    return () => clearTimeout(t);
  }, [l]);

  return null;
}