import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Analytics for a single-page application, on top of Google Tag Manager.
 *
 * ── Where the loader lives, and why ────────────────────────────────────────
 * The GTM container snippet sits in the <head> of index.html, which is the
 * placement Google's own setup guide specifies. It is NOT a page and NOT
 * per-page metadata: an SPA has exactly one HTML document, so one snippet in
 * that document covers every route. There is nothing to add per page.
 *
 * gtag.js IS loaded, from the <head> of index.html, with the project's GA4
 * Measurement ID. This component owns SPA page views only.
 *
 * Tag Manager (GTM-NQ6GK9QG) is also installed in that same document, for any
 * tag that is not GA4. That is safe only because GA4 is NOT also configured
 * inside the GTM container. A Google Analytics: Configuration tag in GTM plus
 * gtag.js here means two paths to GA4 and every event counted twice. If one is
 * added later, remove the other.
 *
 * gtag('config', ..., { send_page_view: true }) in index.html covers the
 * initial document load. Every later client-side navigation is covered by the
 * pushes below, because gtag.js cannot observe a React Router transition.
 *
 * ── SPA page views ─────────────────────────────────────────────────────────
 * Google documents two mutually exclusive ways to count page views in an SPA:
 *
 *   1. GTM's built-in History Change trigger, configured in the GTM UI
 *   2. Custom `page_view` events pushed to the dataLayer from the router
 *
 * and states that enabling both "can lead to double-counting page views".
 *
 * THIS COMPONENT IS OPTION 2. Do not add a History Change trigger to the
 * container while this is in place, or every navigation will count twice.
 *
 * Option 2 is used because the History Change trigger fires when the URL
 * changes, which in React Router is before the new route has rendered. Pushing
 * after render also lets this component send the correct page_title, because
 * <SEO /> has already set document.title by then.
 *
 * Parameters use GA4's names: `page_location` and `page_referrer`, not the
 * legacy `page_path`. `page_referrer` carries the previous route, which is what
 * lets GA4 build navigation paths without a custom GTM variable.
 */

export const GTM_ID = 'GTM-NQ6GK9QG';

/** Push a custom event to the dataLayer. No-ops outside a browser. */
export function trackEvent(name, params = {}) {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: name, ...params });
}

/**
 * Fire a CTA click.
 *
 * Callers should pass only non-identifying values. This deliberately has no
 * access to the form or its values.
 */
export function trackCTAClick(ctaName, page = 'unknown') {
  trackEvent('cta_click', { cta_name: ctaName, page_location: page });
}

/**
 * Report a form submission attempt.
 * `method` is 'report_issue' or 'track_reference'.
 *
 * `delivered` distinguishes a grievance the backend actually recorded from one
 * that fell back to a local mock, so an abandonment rate can be read without
 * inferring it from error counts.
 */
export function trackFormSubmit(method, extra = {}) {
  trackEvent('form_submit', { method, ...extra });
}

export default function GA4() {
  const location = useLocation();
  const previousPath = useRef(null);

  useEffect(() => {
    // Defer past the SEO component's effect so document.title is the title the
    // visitor actually saw, not the previous route's.
    const id = window.setTimeout(() => {
      const pageLocation = window.location.href;
      const payload = {
        event: 'page_view',
        page_location: pageLocation,
        // GA4's own parameter name. page_path is the legacy convention.
        page_title: document.title,
        // Carry the previous route so GA4 can build navigation paths.
        ...(previousPath.current ? { page_referrer: previousPath.current } : {}),
      };
      trackEvent('page_view', payload);
      previousPath.current = pageLocation;
    }, 0);

    return () => window.clearTimeout(id);
  }, [location.pathname, location.search, location.hash]);

  return null;
}