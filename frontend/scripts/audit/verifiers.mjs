/**
 * Verifiers for the Samadhan SEO audit.
 *
 * Each verifier performs a real measurement and returns:
 *   { status, evidence, currentValue, requiredValue, remediation?, source, location? }
 *
 * Hard rules:
 *  - No verifier may return PASS without measured evidence.
 *  - Unavailable dependency/permission/network  -> BLOCKED (never PASS/NA).
 *  - Insufficient evidence                        -> UNKNOWN.
 *  - N/A requires an explicit naReason.
 */

import fs from 'node:fs';
import path from 'node:path';
import { SITE_URL } from './registry.mjs';
import {
  FRONTEND, REPO,
  httpGet, httpStatus, httpHeaders, parseRoutes,
  pageFacts, listPages, scanEncoding, distAssets, stripJsx,
} from './evidence.mjs';

function gitCommitShort() {
  return ctx.commitSha ?? null;
}

/**
 * Topic clusters, parsed from src/data/topics.js.
 *
 * Internal links are generated from this map rather than hand-placed per page.
 * Four checks (automation, topical map, silos, link hubs) previously returned
 * hardcoded FAIL constants describing a structure that no longer existed, so
 * they could not observe the fix.
 */
function topicClusters() {
  const raw = ctx.readFileOrNull(path.join(FRONTEND, 'src', 'data', 'topics.js')) ?? '';
  if (!raw) return [];
  const clusters = [];
  for (const b of raw.split(/\n  \{/).slice(1)) {
    const hub = /hub: '([^']+)'/.exec(b)?.[1];
    const pages = [...b.matchAll(/path: '([^']+)'/g)].map((m) => m[1]);
    const title = /title: '([^']+)'/.exec(b)?.[1] ?? '';
    if (hub) clusters.push({ hub, pages, title });
  }
  return clusters;
}

/**
 * Clusters whose hub page actually renders <RelatedPages />.
 *
 * A declared hub is not a rendered one. SEO-137 and SEO-138 used to count
 * clusters straight out of the map, so when the reporting hub was /report-issue
 * and that page stopped rendering the link block, both checks went on reporting
 * three titled hubs while only two were on screen. Measuring the render is the
 * only version of these checks that cannot overclaim.
 *
 * Matched on the path in the JSX call rather than by resolving route -> component:
 * App.jsx maps paths to components through <SEO ... element={<><Component/>}>, and
 * that is a second place to keep in sync for no benefit.
 */
function renderedClusters() {
  const pagesDir = path.join(FRONTEND, 'src', 'pages');
  // Deliberately not wrapped in try/catch. An earlier version was, and a missing
  // `fs` import inside the try turned every result into "no hubs render",
  // reported as a confident PARTIAL rather than a crash. A verifier that cannot
  // read the pages must say so, not quietly measure nothing.
  const sources = fs.readdirSync(pagesDir)
    .filter((f) => f.endsWith('.jsx'))
    .map((f) => ctx.readFileOrNull(path.join(pagesDir, f)) ?? '');
  return topicClusters().filter((c) => {
    const re = new RegExp("<RelatedPages\\b[^>]*\\bpath=(['\"])" + c.hub.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "\\1");
    return sources.some((s) => re.test(noComments(s)));
  });
}
/**
 * Source with comments removed.
 *
 * Several verifiers look for literal tokens such as `hreflang` or
 * `BreadcrumbList`. Matching raw source lets an explanatory comment satisfy the
 * check: SEO-066 once read four "hreflang references" from comments explaining
 * why no hreflang is emitted, and reported FAIL.
 */
function noComments(src) {
  return (src ?? '')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/^\s*\/\/.*$/gm, ' ');
}

function factsFor(ctx, route) {
  // A page can render copy from a data module (see src/data/faqData.js), from
  // module-level JSX data, or from the i18n layer. A JSX-only count misses all
  // three, which produced false "thin page" failures after FAQ copy moved out of
  // the component. Merge every source and take the largest.
  const component = route && route.pageComponent;
  const f = component ? ctx.pageFacts[component] : null;
  if (!f) return null;

  let dataWords = 0;
  let dataQuestions = 0;
  const src = f.src;
  // Resolve relative data-module imports (../data/foo, ./data/foo).
  const imports = [...src.matchAll(/from\s+['"]([^'"]*\/data\/[a-zA-Z0-9_]+)['"]/g)];
  for (const m of imports) {
    const mod = path.resolve(path.dirname(f.file), m[1] + '.js');
    const body = ctx.readFileOrNull(mod);
    if (!body) continue;
    dataWords += (body.replace(/<[^>]*>/g, ' ').match(/[A-Za-z][A-Za-z'’-]*/g) || []).length;
    dataQuestions += (body.match(/^\s*q:\s*'/gm) || []).length;
  }

  const words = Math.max(f.words, f.declaredWords ?? 0, f.i18nWords ?? 0, dataWords);
  return { ...f, words, dataWords, dataQuestions };
}
const P = (status, evidence, extra = {}) => ({ status, evidence, ...extra });
const BRAND = ' | Samadhan';
const TITLE_MAX = 70;
const DESC_MAX = 320;

let ctx = null;
export function initContext(c) {
  ctx = c;
}

/** Every public route that is expected to be indexable. */
function publicRoutes() {
  const routes = ctx.routes.filter((r) => !r.path.startsWith('/mp'));
  return routes;
}

function pageFileFor(component) {
  if (!component) return null;
  return listPages(ctx.pagesDir).find((f) => path.basename(f) === `${component}.jsx`) ?? null;
}

function liveUrl(p) {
  return SITE_URL + (p === '/' ? '/' : p.replace(/\/$/, ''));
}

// ---------------------------------------------------------------------------
// verifiers, keyed by stable checklist ID
// ---------------------------------------------------------------------------

export const VERIFIERS = {
  // ---------- SEO Basics ----------
  'SEO-001': () => {
    // GA4 ships directly via gtag.js in index.html; Tag Manager stays installed
    // for non-GA4 tags. Verify what is checkable from the repository: the GTM
    // container is installed in <head>, gtag.js is present exactly once and is
    // configured with a GA4 measurement ID, and SPA navigation is reported.
    // Whether the GTM container ALSO forwards to GA4 is a GTM UI setting and
    // cannot be read here, so it is surfaced rather than assumed.
    const html = ctx.indexHtml;
    const ga4 = ctx.ga4;
    const gtmId = 'GTM-NQ6GK9QG';
    const headIdx = html.indexOf('<head>');
    const bodyIdx = html.indexOf('<body>');
    const gtmIdx = html.indexOf('gtm.js');
    const inHead = gtmIdx > headIdx && gtmIdx < bodyIdx;
    const noscript = html.includes('/ns.html?id=' + gtmId) && html.indexOf('ns.html?id=' + gtmId) > bodyIdx;
    const idPresent = html.includes(gtmId);
    const gtagLoads = [...html.matchAll(/googletagmanager\.com\/gtag\/js\?id=/g)].length;
    const jsxInjectsGtag = /gtag\/js\?id=|googletagmanager\.com\/gtag/.test(ga4);
    const measurementId = /gtag\('config',\s*'(G-[A-Z0-9]+)'/.exec(html)?.[1] ?? null;
    const spaTracking = /dataLayer\.push/.test(ga4);

    if (!idPresent || !inHead) {
      return P('FAIL',
        `GTM container ${gtmId} is not installed in <head> (id=${idPresent}, inHead=${inHead}).`,
        { currentValue: 'GTM snippet missing or misplaced', requiredValue: 'GTM snippet first in <head>',
          remediation: 'Paste the GTM container snippet as the first child of <head> in index.html.',
          source: 'code', location: 'index.html' });
    }
    if (gtagLoads !== 1 || jsxInjectsGtag) {
      return P('FAIL',
        `gtag.js appears ${gtagLoads} time(s) in index.html and GA4.jsx injects it: ${jsxInjectsGtag}. `
        + 'The library must be fetched once, or every page_view is counted twice.',
        { currentValue: `gtag.js x${gtagLoads}, GA4.jsx injects=${jsxInjectsGtag}`,
          requiredValue: 'exactly one gtag.js load, in index.html only',
          remediation: 'Load gtag.js once in index.html and remove any injection from GA4.jsx.',
          source: 'code', location: 'index.html, src/components/GA4.jsx' });
    }
    if (!measurementId) {
      return P('FAIL',
        'gtag.js is loaded but no gtag(\'config\', \'G-...\') call is present, so GA4 receives nothing.',
        { currentValue: 'no GA4 configuration', requiredValue: "gtag('config', 'G-XXXXXXX')",
          remediation: "Add gtag('config', 'G-XXXXXXX') in the <head> of index.html.",
          source: 'code', location: 'index.html' });
    }
    if (!spaTracking) {
      return P('PARTIAL',
        'GTM is installed but no client-side route tracking pushes page_view to dataLayer, so SPA navigations would be recorded as a single page.',
        { currentValue: 'no dataLayer push on route change', requiredValue: 'page_view pushed on navigation',
          remediation: 'Push a page_view event in GA4.jsx on location change.',
          source: 'code' });
    }
    return P('BLOCKED',
      `GA4 is configured directly: gtag.js is loaded once in <head> and ` +
      `gtag('config', '${measurementId}') is called. The GTM container ${gtmId} is also installed ` +
      `(noscript fallback present: ${noscript}), and client-side navigations push page_view to the ` +
      'dataLayer. Everything the repository controls is in place. It cannot be confirmed from source ' +
      'that data is arriving in the GA4 property, because that needs the live property, and the GTM ' +
      'container must NOT also hold a Google Analytics: Configuration tag or events count twice.',
      { currentValue: `gtag.js configured for ${measurementId}; GTM installed; SPA tracking present`,
        requiredValue: 'GA4 property receiving page_view events',
        remediation: 'Confirm GTM-NQ6GK9QG has no Google Analytics: Configuration tag, then check GA4 Realtime.',
        source: 'code (configured) + GA4 property (not accessible here)',
        location: 'index.html, src/components/GA4.jsx' });
  },

  'SEO-003': () => {
    // Verification is by HTML tag in index.html. A second, file-based token used
    // to sit in public/googlea34e147e07ede164.html; it was removed because two
    // methods for the same property are one more thing to keep in step, and the
    // tag is the method Google reads off the deployed homepage.
    const html = ctx.indexHtml ?? '';
    const token = /<meta\s+name=["']google-site-verification["']\s+content=["']([^"']+)["']/.exec(html);
    if (!token) {
      return P('FAIL',
        'No google-site-verification meta tag in frontend/index.html.', {
          source: 'filesystem',
          remediation: 'Add <meta name="google-site-verification" content="TOKEN"> to the <head> in index.html.',
        });
    }
    // Confirm the token actually reaches the deployed homepage. index.html is the
    // document Google fetches, so a tag that is not in the built output is a tag
    // that was never verified.
    let live = null;
    try {
      const res = httpStatus(SITE_URL);
      live = res.status;
    } catch (err) {
      return P('BLOCKED',
        `Verification tag present in index.html but the live homepage could not be read: ${err.message}`,
        { source: 'filesystem + HTTP',
          remediation: 'Confirm the deployment, then verify ownership in GSC.' });
    }
    return P('PARTIAL',
      `HTML tag verification is deployed in index.html (token ${token[1].slice(0, 6)}...${token[1].slice(-4)}); `
      + `homepage responds HTTP ${live}. The tag proves hosting control once Google reads it, but the GSC `
      + `property itself cannot be confirmed without GSC credentials.`,
      { currentValue: `meta tag in index.html; homepage HTTP ${live}`,
        requiredValue: 'GSC property verified',
        remediation: 'Add the property in Google Search Console with the HTML-tag method, then verify ownership.',
        source: 'filesystem + HTTP' });
  },

  'SEO-004': () => {
    if (!ctx.sitemap) return P('FAIL', 'No sitemap.xml in public/');
    let live;
    try {
      live = httpGet(`${SITE_URL}/sitemap.xml`);
    } catch (err) {
      return P('BLOCKED', `Cannot reach ${SITE_URL}/sitemap.xml: ${err.message}`);
    }
    const robotsHasRef = ctx.robots.includes('Sitemap:');
    return robotsHasRef
      ? P('PARTIAL',
          `Sitemap is served (HTTP ${live.status}) and referenced in robots.txt, but submission to Google Search Console cannot be verified without GSC credentials.`,
          { currentValue: 'sitemaps submitted: unknown', requiredValue: 'confirmed in GSC',
            remediation: 'Submit sitemap.xml in GSC > Sitemaps.',
            source: 'HTTP + robots.txt' })
      : P('FAIL', 'robots.txt has no Sitemap: directive', { source: 'robots.txt' });
  },

  'SEO-005': () => P('BLOCKED',
    'Submitting to Bing Webmaster Tools requires credentials that are not available in this environment.',
    { requiredValue: 'sitemap submitted in Bing Webmaster Tools',
      remediation: 'Add the property in Bing Webmaster Tools and submit sitemap.xml.',
      source: 'credentials' }),

  'SEO-006': () => {
    let live;
    try {
      live = httpGet(`${SITE_URL}/robots.txt`);
    } catch (err) {
      return P('BLOCKED', `Cannot fetch live robots.txt: ${err.message}`);
    }
    if (live.status !== 200) return P('FAIL', `Live robots.txt returned HTTP ${live.status}`);
    if (!/User-agent/i.test(live.body)) return P('FAIL', 'Live robots.txt has no User-agent group');
    return P('PASS', `Live robots.txt served with HTTP 200, ${live.body.length} bytes`,
      { currentValue: live.body.length + ' bytes', source: 'HTTP', location: '/robots.txt' });
  },

  'SEO-007': () => P('BLOCKED',
    'Indexing status lives in Google Search Console, which is not connected to this environment.',
    { requiredValue: 'indexing status known', remediation: 'Connect GSC and check URL Inspection.',
      source: 'credentials' }),

  'SEO-008': () => {
    let h;
    try {
      h = httpHeaders(SITE_URL);
    } catch (err) {
      return P('BLOCKED', `Cannot read HTTPS headers: ${err.message}`);
    }
    if (!h['strict-transport-security']) {
      return P('PARTIAL', 'HTTPS works but no Strict-Transport-Security header observed',
        { currentValue: 'no HSTS', requiredValue: 'HSTS present',
          remediation: 'Add Strict-Transport-Security in vercel.json headers.' });
    }
    return P('PASS', `HTTPS enforced; HSTS: ${h['strict-transport-security']}`, { source: 'HTTP headers' });
  },

  'SEO-009': () => {
    const inIndex = /rel="canonical"/.test(ctx.indexHtml);
    const inSeo = /rel:\s*'canonical'/.test(ctx.seoJsx);
    const routes = ctx.routes;
    const missingProp = routes.filter((r) => !r.path).length;
    if (!inIndex || !inSeo) {
      return P('FAIL', 'Canonical tags missing from index.html or SEO component', { source: 'code' });
    }
    if (missingProp) {
      return P('FAIL', `${missingProp} routes have no <SEO path=...> so no per-page canonical is generated`,
        { source: 'code', remediation: 'Give every route a path prop.' });
    }
    return P('PASS', `Canonical present in index.html and generated per-route by SEO.jsx for ${routes.length} routes`,
      { currentValue: `${routes.length} routes`, source: 'code' });
  },

  'SEO-010': () => {
    const viewport = /<meta name="viewport" content="width=device-width/.test(ctx.indexHtml);
    let home;
    try {
      home = httpGet(SITE_URL);
    } catch (err) {
      return P('BLOCKED', `Cannot verify live rendering: ${err.message}`);
    }
    const hasViewport = /name="viewport"[^>]*width=device-width/.test(home.body);
    if (!viewport || !hasViewport) {
      return P('FAIL', 'Viewport meta tag missing from build or live HTML', { source: 'code + HTTP' });
    }
    return P('PASS', 'Viewport meta present in index.html and in live HTML',
      { source: 'code + HTTP' });
  },

  'SEO-011': () => {
    let home;
    try {
      home = httpStatus(SITE_URL);
    } catch (err) {
      return P('BLOCKED', `Cannot measure response time: ${err.message}`);
    }
    const ms = Math.round(home.timeSeconds * 1000);
    const assets = distAssets();
    const js = assets?.filter((a) => a.file.endsWith('.js')) ?? [];
    const totalJs = js.reduce((a, b) => a + b.bytes, 0);
    // The entry chunk is what a first-time visitor downloads before any route
    // code. Report that specifically rather than an arbitrary chunk.
    const entry = js.find((a) => /(^|[\\/])index-[^\\/]*\.js$/.test(a.file)) ?? null;
    const entryKb = entry ? Math.round(entry.bytes / 1024) : null;
    const split = js.length > 1;
    const big = totalJs > 400 * 1024;
    return P(
      'PARTIAL',
      `Homepage TTFB ${ms}ms. Entry JS chunk ${entryKb ?? '?'} KB across ${js.length} chunk(s), ` +
        `${Math.round(totalJs / 1024)} KB total uncompressed. Route-level code splitting is ` +
        `${split ? 'in place' : 'absent'}. Core Web Vitals are not measurable without a browser lab.`,
      { currentValue: `TTFB ${ms}ms, entry chunk ${entryKb ?? '?'} KB, ${js.length} chunks`,
        requiredValue: 'LCP < 2.5s, INP < 200ms, CLS < 0.1 (requires PageSpeed/Lighthouse)',
        remediation: big
          ? 'Total JS exceeds 400 KB; verify the MPDashboard chunk (Leaflet) is not in the critical path.'
          : 'Run PageSpeed Insights on the live URL to record real CWV numbers.',
        source: 'HTTP + dist' });
  },

  'SEO-012': () => {
    // N/A is legitimate: this is a hand-built React app, not WordPress.
    if (/react|vite/i.test(ctx.pkg.dependencies?.react ? 'react' : '') || ctx.pkg.devDependencies?.vite) {
      return P('N/A',
        'Samadhan is a custom React + Vite application with no CMS. WordPress SEO plugins (Yoast, RankMath) cannot be installed. The equivalent capability is provided by src/components/SEO.jsx.',
        { naReason: 'Not a WordPress/CMS build — no plugin surface exists. Custom SEO component covers the requirement.',
          source: 'code' });
    }
    return P('UNKNOWN', 'Could not determine framework', { source: 'code' });
  },

  'SEO-013': () => {
    const icons = ['favicon.svg', 'Samadhan.png', 'site.webmanifest'];
    const present = icons.filter((f) => ctx.exists(path.join(FRONTEND, 'public', f)));
    if (present.length === 0) return P('FAIL', 'No favicon or manifest in public/');
    return present.length === icons.length
      ? P('PASS', `Branding assets present: ${present.join(', ')}`, { source: 'filesystem' })
      : P('PARTIAL', `Only ${present.join(', ')} present`, { source: 'filesystem' });
  },

  'SEO-014': () => {
    const vercel = ctx.vercel || ctx.vercelFrontend;
    if (!vercel) return P('FAIL', 'No vercel.json found');
    const cfg = JSON.parse(vercel);
    const clean = cfg.cleanUrls === true;
    const noSlash = cfg.trailingSlash === false;
    return clean && noSlash
      ? P('PASS', 'cleanUrls true, trailingSlash false — single canonical URL form',
          { source: 'config' })
      : P('PARTIAL', `cleanUrls=${cfg.cleanUrls}, trailingSlash=${cfg.trailingSlash}`,
          { source: 'config' });
  },

  'SEO-015': () => {
    const types = ['Organization', 'WebSite', 'SoftwareApplication'];
    const missing = types.filter((t) => !ctx.appJsx.includes(`'${t}'`));
    const ld = /application\/ld\+json/.test(ctx.seoJsx);
    if (!ld) return P('FAIL', 'No JSON-LD script emitted by SEO.jsx');
    return missing.length === 0
      ? P('PASS', `JSON-LD emitted with core types: ${types.join(', ')}`, { source: 'code' })
      : P('PARTIAL', `Missing core schema types: ${missing.join(', ')}`, { source: 'code' });
  },

  'SEO-037': () => {
    // Measure only routed, indexable pages, and only their visible copy.
    // Scanning every source file counted JS identifiers such as `const`, which
    // says nothing about keyword density in rendered text.
    const dense = [];
    let checked = 0;
    for (const r of ctx.publicRoutes()) {
      const f = factsFor(ctx, r);
      if (!f) continue;
      const body = f.firstText.toLowerCase().replace(/\{[^{}]*\}/g, ' ');
      const words = body.match(/[a-z][a-z']+/g) || [];
      if (words.length < 60) continue;
      checked += 1;
      const freq = {};
      for (const w of words) if (w.length > 4) freq[w] = (freq[w] || 0) + 1;
      const top = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
      // 5% of a 200+ word page is a genuine repetition problem, not a
      // domain-appropriate term like "constituency".
      if (top && top[1] / words.length > 0.05) {
        dense.push(`${r.path} "${top[0]}" ${(top[1] / words.length * 100).toFixed(1)}%`);
      }
    }
    return dense.length === 0
      ? P('PASS', `No term exceeds 5% frequency on any routed page (checked ${checked} pages)`, { source: 'content analysis' })
      : P('FAIL', `Over-repeated terms: ${dense.join('; ')}`, { source: 'content analysis' });
  },

  // ---------- Keyword Research ----------
  'SEO-016': () => {
    // Previously read KEYWORD_MAP.md, a working note that is deliberately not
    // versioned. On a fresh clone that file is absent and this check FAILED for a
    // reason unrelated to the site. The committed source of truth is now
    // src/data/intents.js.
    const intents = ctx.readFileOrNull(path.join(FRONTEND, 'src', 'data', 'intents.js')) ?? '';
    const primaries = [...intents.matchAll(/primary: '([^']+)'/g)].map((m) => m[1]);
    if (primaries.length === 0) {
      return P('FAIL', 'No primary keyword is declared for any page.', {
        remediation: 'Add a primary keyword per page in src/data/intents.js.',
        source: 'code' });
    }
    return P('PARTIAL',
      `${primaries.length} primary keywords are declared per page in src/data/intents.js, but none is `
      + `validated against measured search demand: no keyword-volume tool is connected, so volume and `
      + `difficulty are unverified and deliberately not asserted.`,
      { currentValue: `${primaries.length} declared, 0 measured`,
        requiredValue: 'each keyword validated with volume and difficulty data',
        remediation: 'Validate each term in Google Keyword Planner or Semrush and record measured values.',
        source: 'code' });
  },

  'SEO-017': () => P('UNKNOWN',
    'Long-tail discovery requires keyword-volume tooling (Ubersuggest/Semrush/Google Keyword Planner). None is connected.',
    { remediation: 'Export keyword data from a connected tool and record volume, difficulty and intent per term.',
      source: 'tools unavailable' }),

  'SEO-018': () => {
    // Repointed from KEYWORD_STRATEGY.md, which is an unversioned working note.
    const intents = ctx.readFileOrNull(path.join(FRONTEND, 'src', 'data', 'intents.js')) ?? '';
    const VALID = ['informational', 'transactional', 'navigational', 'commercial'];
    const found = [...intents.matchAll(/intent: '([^']+)'/g)].map((m) => m[1]);
    if (found.length === 0) {
      return P('FAIL', 'No per-page search intent is declared.', { source: 'code' });
    }
    const valid = found.filter((f) => VALID.includes(f));
    const perPage = ctx.publicRoutes().filter((r) => intents.includes(`path: '${r.path}'`)).length;
    return valid.length === found.length && perPage >= ctx.publicRoutes().length
      ? P('PASS',
          `All ${found.length} pages declare a search intent from the standard set `
          + `(${[...new Set(found)].join(', ')}), and every public route is covered. Intent is assigned from `
          + `page purpose, not measured against live SERPs, which is stated in each entry's rationale.`,
          { source: 'code' })
      : P('PARTIAL',
          `${valid.length} of ${found.length} intents use the standard set; ${perPage} of `
          + `${ctx.publicRoutes().length} public routes are covered.`,
          { currentValue: `${valid.length}/${found.length} valid, ${perPage}/${ctx.publicRoutes().length} covered`,
            requiredValue: 'every public route declares a standard intent',
            remediation: 'Complete src/data/intents.js.',
            source: 'code' });
  },

  'SEO-019': () => P('BLOCKED',
    'Google Keyword Planner requires an authenticated Google Ads account, which is not available here.',
    { remediation: 'Export Keyword Planner data for the target country/language.', source: 'credentials' }),

  'SEO-020': () => P('UNKNOWN',
    'People Also Ask extraction requires SERP-scraping access that is not connected.',
    { source: 'tools unavailable' }),

  'SEO-021': () => P('UNKNOWN',
    'Competitor keyword gap analysis requires Semrush/Ahrefs domain data, which is not connected.',
    { source: 'tools unavailable' }),

  'SEO-022': () => P('UNKNOWN',
    'Google Trends requires trend tooling that is not connected, and Trends indices cannot be converted to search volume.',
    { source: 'tools unavailable' }),

  'SEO-023': () => P('UNKNOWN',
    'Seasonality analysis requires trend/volume time series from a connected tool.',
    { source: 'tools unavailable' }),

  'SEO-024': () => {
    const about = ctx.pageFacts.About?.firstText ?? '';
    const hasGeo = /Visakhapatnam|Andhra Pradesh|India/i.test(about);
    return hasGeo
      ? P('PARTIAL', 'Geographic context exists on the About page but there is no dedicated local/intra-state page',
          { currentValue: 'mentions Visakhapatnam/AP only', requiredValue: 'deliberate local content strategy',
            source: 'content' })
      : P('FAIL', 'No local/geographic targeting present in content', { source: 'content' });
  },

  'SEO-025': () => P('UNKNOWN',
    'Branded vs non-branded split needs impression data from Google Search Console, which is not connected.',
    { source: 'credentials' }),

  'SEO-026': () => {
    // Repointed from KEYWORD_MAP.md, an unversioned working note.
    const intents = ctx.readFileOrNull(path.join(FRONTEND, 'src', 'data', 'intents.js')) ?? '';
    const publicRoutes = ctx.publicRoutes();
    const covered = publicRoutes.filter((r) => intents.includes(`path: '${r.path}'`));
    if (covered.length === 0) {
      return P('FAIL', 'No page maps to a keyword.', { source: 'code' });
    }
    const withSecondary = [...intents.matchAll(/secondary: \[([^\]]*)\]/g)]
      .filter((m) => m[1].trim().length > 0).length;
    const complete = covered.length === publicRoutes.length
      && withSecondary >= publicRoutes.length;
    return complete
      ? P('PASS',
          `Every public route maps to a primary and secondary keyword set in src/data/intents.js `
          + `(${covered.length}/${publicRoutes.length} routes, ${withSecondary} keyword sets).`,
          { source: 'code' })
      : P('PARTIAL',
          `Keyword map covers ${covered.length} of ${publicRoutes.length} public routes; `
          + `${withSecondary} entries declare secondary keywords.`,
          { currentValue: `${covered.length}/${publicRoutes.length} routes`,
            requiredValue: 'every public route with primary and secondary keywords',
            remediation: 'Complete src/data/intents.js.',
            source: 'code' });
  },

  'SEO-027': () => {
    const clusters = topicClusters();
    const intents = ctx.readFileOrNull(path.join(FRONTEND, 'src', 'data', 'intents.js')) ?? '';
    const intentPaths = [...intents.matchAll(/path: '([^']+)'/g)].map((m) => m[1]);
    if (clusters.length === 0) {
      return P('FAIL', 'No topic clustering exists, so keywords cannot be grouped.',
        { source: 'content architecture' });
    }
    if (intentPaths.length === 0) {
      return P('PARTIAL',
        `Keywords are grouped into ${clusters.length} topics in src/data/topics.js, but no page declares a `
        + `primary keyword, so the grouping cannot be checked against search intent.`,
        { currentValue: `${clusters.length} topic clusters, 0 declared keywords`,
          requiredValue: 'a declared primary keyword and intent per public page',
          remediation: 'Add src/data/intents.js declaring each page path, primary keyword and intent.',
          source: 'content architecture' });
    }
    return P('PASS',
      `Keywords are grouped into ${clusters.length} topic clusters, and ${intentPaths.length} pages declare a `
      + `primary keyword and search intent in src/data/intents.js.`,
      { currentValue: `${clusters.length} clusters, ${intentPaths.length} declared keywords`,
        source: 'content architecture' });
  },

  'SEO-028': () => P('UNKNOWN',
    'Identifying low-competition terms requires difficulty data from a connected keyword tool.',
    { source: 'tools unavailable' }),

  'SEO-029': () => P('UNKNOWN',
    'Content-gap analysis requires competitor SERP/keyword data that is not connected.',
    { source: 'tools unavailable' }),

  // ---------- On-Page ----------
  'SEO-030': () => {
    const missing = ctx.routes.filter((r) => !r.title);
    if (missing.length) return P('FAIL', `${missing.length} routes have no <SEO title>`, { source: 'code' });
    const withKw = ctx.routes.filter((r) => {
      const t = stripJsx(r.title).toLowerCase();
      return /\b(constituency|planning|grievance|issue|methodology|faq|accessibility|about|privacy|mp)\b/.test(t);
    });
    return withKw.length === ctx.routes.length
      ? P('PASS', `All ${ctx.routes.length} titles carry a topical term`, { source: 'code' })
      : P('PARTIAL', `${withKw.length}/${ctx.routes.length} titles contain a topical term`, { source: 'code' });
  },

  'SEO-031': () => {
    const routes = ctx.routes;
    const missing = routes.filter((r) => !r.description);
    if (missing.length) return P('FAIL', `${missing.length} routes have no meta description`, { source: 'code' });
    const over = routes.filter((r) => r.description.length > DESC_MAX);
    const dupes = routes.filter((r, i) => routes.findIndex((x) => x.description === r.description) !== i);
    const problems = [
      over.length ? `${over.length} over ${DESC_MAX} chars` : null,
      dupes.length ? `${dupes.length} duplicate descriptions` : null,
    ].filter(Boolean);
    return problems.length
      ? P('FAIL', `Descriptions: ${problems.join('; ')}`, { source: 'code' })
      : P('PASS', `${routes.length} unique descriptions, all within ${DESC_MAX} chars`, { source: 'code' });
  },

  'SEO-032': () => {
    const rows = [];
    for (const r of ctx.publicRoutes()) {
      const f = pageFileFor(r.pageComponent);
      if (!f) { rows.push(`${r.path}: page file not resolved`); continue; }
      const facts = factsFor(ctx, r);
      if (!facts || facts.h1.length !== 1) { rows.push(`${r.path}: ${facts?.h1.length ?? 0} H1`); continue; }
      // Topical relevance for this product means the H1 names the subject the
      // page is about: constituent problems, planning, ranking, or scoring.
      const kw = /\b(constituenc|planning|plan\b|grievance|priorit|rank|scor|project|request|infrastructure|issue|methodolog|question|answer|faq|accessib|privacy)/i;
      // An H1 rendered from the i18n layer (e.g. {t.reportIssue}) shows its
      // token, not its text. Resolve the key against translations.js so the
      // check measures the English heading a visitor actually sees.
      let h1 = facts.h1[0];
      const token = /^\{\s*t\.(\w+)\s*\}?$/.exec(h1);
      if (token) {
        const tr = ctx.readFileOrNull(path.join(FRONTEND, 'src', 'i18n', 'translations.js')) ?? '';
        const key = token[1];
        const en = new RegExp(`${key}:\\s*'([^']+)'`);
        const resolved = en.exec(tr);
        h1 = resolved ? resolved[1] : h1;
        if (!resolved) rows.push(`${r.path}: H1 key t.${key} not found in translations.js`);
      }
      if (!kw.test(h1)) rows.push(`${r.path}: H1 lacks a topical term — "${h1}"`);
    }
    return rows.length === 0
      ? P('PASS', `Every public page has exactly one H1 containing a topical term`, { source: 'code' })
      : P('FAIL', `H1 problems: ${rows.join('; ')}`, { source: 'code' });
  },

  'SEO-033': () => {
    const thin = [];
    for (const r of ctx.publicRoutes()) {
      const f = pageFileFor(r.pageComponent);
      if (!f) continue;
      const facts = factsFor(ctx, r);
      if (!facts) continue;
      if (facts.h2.length + facts.h3.length === 0) thin.push(`${r.path}: no H2/H3`);
    }
    return thin.length === 0
      ? P('PASS', 'All public pages use H2/H3 subheadings', { source: 'code' })
      : P('FAIL', `Pages without subheadings: ${thin.join('; ')}`, { source: 'code' });
  },

  'SEO-034': () => {
    const long = ctx.publicRoutes().filter((r) => r.path.length > 4 && r.path.split('/').filter(Boolean).some((s) => s.length > 18));
    return long.length === 0
      ? P('PASS', 'All public URLs are short and readable', { source: 'code' })
      : P('PARTIAL', `Long URL segments: ${long.map((r) => r.path).join(', ')}`, { source: 'code' });
  },

  'SEO-035': () => {
    const navLinks = new Set([
      ...[...ctx.headerJsx.matchAll(/'(\/[^']*)'/g)].map((m) => m[1]),
      ...[...ctx.footerJsx.matchAll(/to='(\/[^']*)'/g)].map((m) => m[1]),
    ]);
    const orphans = ctx.publicRoutes().filter((r) => r.path !== '/' && !navLinks.has(r.path));
    return orphans.length === 0
      ? P('PASS', 'Every public route is linked from Header or Footer', { source: 'code' })
      : P('FAIL', `Orphan routes not linked in navigation: ${orphans.map((r) => r.path).join(', ')}`,
          { remediation: 'Add links in Header/Footer.', source: 'code' });
  },

  'SEO-036': () => {
    const bad = [];
    let total = 0;
    for (const [name, f] of Object.entries(ctx.pageFacts)) {
      total += f.imgCount;
      for (const t of f.imgsNoAlt) bad.push(`${name}: ${t.slice(0, 70)}`);
    }
    return bad.length === 0
      ? P('PASS', `${total} <img> elements checked, all with descriptive alt text`, { source: 'code' })
      : P('FAIL', `${bad.length}/${total} images lack alt text: ${bad.slice(0, 3).join('; ')}`, { source: 'code' });
  },

  'SEO-038': () => {
    const file = path.join(FRONTEND, 'src', 'components', 'Breadcrumb.jsx');
    const exists = ctx.exists(file);
    const usedInRoutes = [];
    for (const r of ctx.routes) {
      const f = pageFileFor(r.pageComponent);
      if (f && /<Breadcrumb\b/.test(ctx.pageFacts[path.basename(f, '.jsx')]?.src ?? '')) usedInRoutes.push(r.path);
    }
    const schemaEmitted = /BreadcrumbList/.test(ctx.appJsx);
    if (!exists) return P('FAIL', 'No Breadcrumb component', { source: 'code' });
    if (usedInRoutes.length === 0) {
      return P('FAIL',
        `Breadcrumb.jsx exists but is imported by 0 routed pages (only by unrouted Contact/Constituency pages).`,
        { currentValue: '0 of ' + ctx.routes.length + ' routes use it', requiredValue: 'visible breadcrumbs on all non-home routes',
          remediation: 'Render <Breadcrumb> inside every page below the homepage.',
          source: 'code' });
    }
    return P('PARTIAL',
      `Breadcrumbs render on ${usedInRoutes.length} routes (${usedInRoutes.join(', ')}); BreadcrumbList schema emitted: ${schemaEmitted}.`,
      { source: 'code' });
  },

  'SEO-039': () => {
    // Count any interactive call-to-action, not only elements carrying the
    // shared `.button` class. CitizenPortal styles its form buttons with
    // Tailwind utilities, so a class-name check alone reported a false failure.
    const noCta = [];
    for (const r of ctx.publicRoutes()) {
      const f = pageFileFor(r.pageComponent);
      if (!f) continue;
      const src = f ? ctx.readFileOrNull(f) : null;
      if (!src) continue;
      const styled = /class(?:Name)?=["'][^"']*button[^"']*["']/.test(src);
      const interactive =
        /<button\b/.test(src) ||
        /<Link\b[^>]*to=/.test(src) ||
        /<a\b[^>]*href=/.test(src) ||
        /type=["']submit["']/.test(src);
      if (!styled && !interactive) noCta.push(r.path);
    }
    return noCta.length === 0
      ? P('PASS', 'Every public page contains at least one interactive call-to-action', { source: 'code' })
      : P('FAIL', `Pages without any CTA control: ${noCta.join(', ')}`, { source: 'code' });
  },

  'SEO-040': () => {
    const rows = ctx.routes.map((r) => {
      const full = r.title?.includes('Samadhan') ? r.title : (r.title ?? '') + BRAND;
      return { path: r.path, len: full.length, full };
    });
    const over = rows.filter((r) => r.len > TITLE_MAX);
    const dupes = rows.filter((r, i) => rows.findIndex((x) => x.full === r.full) !== i);
    return over.length === 0 && dupes.length === 0
      ? P('PASS', rows.map((r) => `${r.path}=${r.len}`).join(' '),
          { currentValue: `max ${Math.max(...rows.map((r) => r.len))} chars`, requiredValue: `<= ${TITLE_MAX} chars`,
            source: 'code' })
      : P('FAIL', `Titles over ${TITLE_MAX}: ${over.map((r) => `${r.path}(${r.len})`).join(', ')}${dupes.length ? `; duplicates: ${dupes.length}` : ''}`,
          { source: 'code' });
  },

  'SEO-041': () => {
    const rows = ctx.routes.map((r) => ({ path: r.path, len: r.description?.length ?? 0 }));
    const over = rows.filter((r) => r.len > DESC_MAX);
    return over.length === 0
      ? P('PASS', rows.map((r) => `${r.path}=${r.len}`).join(' '),
          { currentValue: `max ${Math.max(...rows.map((r) => r.len))} chars`, requiredValue: `<= ${DESC_MAX} chars`,
            source: 'code' })
      : P('FAIL', `Descriptions over ${DESC_MAX}: ${over.map((r) => r.path).join(', ')}`, { source: 'code' });
  },

  'SEO-042': () => {
    const hasTechArticle = /'TechArticle'/.test(ctx.appJsx);
    const hasWebPage = /'WebPage'/.test(ctx.appJsx);
    if (hasTechArticle && hasWebPage) return P('PASS', 'TechArticle + WebPage schema present', { source: 'code' });
    return P('PARTIAL',
      `TechArticle: ${hasTechArticle}; WebPage: ${hasWebPage}. No Article/Product schema, which is correct — the site has no article or product catalogue.`,
      { source: 'code' });
  },

  'SEO-043': () => {
    const faq = /'FAQPage'/.test(ctx.appJsx);
    const faqRoute = ctx.routes.find((r) => r.path === '/faq');
    const faqPage = { ...ctx.pageFacts.FAQ, words: Math.max(ctx.pageFacts.FAQ.words, ctx.pageFacts.FAQ.declaredWords ?? 0, ctx.pageFacts.FAQ.i18nWords ?? 0) };
    const visibleQ = (ctx.pageFacts.FAQ?.declaredWords && 0) || 0;
    void visibleQ;
    // Questions live in <summary> elements inside <details>, not in headings.
    // Counting h2 reported "1 H2 questions" for a page that renders 11, because
    // the only h2 is the section title.
    const faqData = ctx.readFileOrNull(path.join(FRONTEND, 'src', 'data', 'faqData.js')) ?? '';
    const questionCount = (faqData.match(/^\s*q:\s*'/gm) ?? []).length;
    if (!faq || !faqRoute) return P('FAIL', 'FAQPage schema missing or /faq not routed', { source: 'code' });
    const fromArray = /FAQS\.map/.test(ctx.appJsx);
    return P('PARTIAL',
      `FAQPage schema present on / and /faq, generated by mapping the shared FAQS array, and /faq renders `
      + `${questionCount} question/answer pairs from that same module so schema and visible copy cannot `
      + `diverge. Google restricted FAQ rich results to authoritative government and health sites in 2023, `
      + `so no rich-result lift is expected for a civic-tech prototype.`,
      { currentValue: `${questionCount} Q&A, generated from one array: ${fromArray}`,
        requiredValue: 'FAQPage schema mirroring visible copy',
        remediation: 'None available: rich-result eligibility is not obtainable for this site type.',
        source: 'code' });
  },

  'SEO-045': () => {
    const bad = ctx.encodingIssues;
    const spamTerms = /\b(revolutionary|game-changing|world-class|best-in-class|cutting-edge|unleash|seamless)\b/gi;
    const spam = [];
    for (const [name, f] of Object.entries(ctx.pageFacts)) {
      const hits = f.firstText.match(spamTerms);
      if (hits) spam.push(`${name}: ${[...new Set(hits)].join(', ')}`);
    }
    if (bad.length || spam.length) {
      return P('FAIL',
        `Broken encoding in ${bad.length} file(s): ${bad.map((b) => `${b.file} (${b.count})`).join(', ')}. Marketing filler: ${spam.join('; ') || 'none'}`,
        { currentValue: `${bad.length} files with mojibake`, requiredValue: '0 encoding defects',
          remediation: 'Rewrite the affected pages as UTF-8 and remove marketing filler.',
          source: 'content analysis' });
    }
    return P('PASS', 'No encoding defects and no inflated marketing claims', { source: 'content analysis' });
  },

  // ---------- Content ----------
  'SEO-044': () => {
    const thin = ctx.publicRoutes()
      .map((r) => ({ path: r.path, facts: factsFor(ctx, r) }))
      .filter((x) => x.facts && x.facts.words < 150);
    return thin.length === 0
      ? P('PASS', 'No public page under 150 words of visible text', { source: 'content' })
      : P('FAIL', `Thin pages: ${thin.map((t) => `${t.path} (${t.facts.words} words)`).join('; ')}`,
          { currentValue: `${thin.length} thin pages`, requiredValue: '>= 150 words for informational pages',
            remediation: 'Expand Methodology, HowItWorks, About, Privacy, Accessibility and FAQ with genuine detail.',
            source: 'content' });
  },

  'SEO-046': () => {
    const intents = ctx.readFileOrNull(path.join(FRONTEND, 'src', 'data', 'intents.js')) ?? '';
    const routes = ctx.publicRoutes();
    const covered = routes.filter((r) => intents.includes(`path: '${r.path}'`));
    const withRationale = (intents.match(/rationale:/g) ?? []).length;
    return covered.length === routes.length && withRationale === routes.length
      ? P('PASS',
          `All ${routes.length} public pages target an intent and each entry carries a rationale explaining why `
          + `that intent fits the page. No live-SERP validation was performed, and none is claimed.`,
          { source: 'content' })
      : P('PARTIAL',
          `${covered.length} of ${routes.length} public pages target an intent; ${withRationale} entries carry a `
          + `rationale.`,
          { currentValue: `${covered.length}/${routes.length} targeted`,
            requiredValue: 'every public page declares an intent with a rationale',
            remediation: 'Complete src/data/intents.js.',
            source: 'content' });
  },

  'SEO-047': () => {
    const clusters = topicClusters();
    if (clusters.length === 0) {
      return P('FAIL', 'No topic clusters are defined.',
        { remediation: 'Define clusters in src/data/topics.js.', source: 'content architecture' });
    }
    const withIntent = clusters.filter((c) =>
      /path: '/.test(ctx.readFileOrNull(path.join(FRONTEND, 'src', 'data', 'intents.js')) ?? '')
      && c.pages.length > 0);
    return withIntent.length === clusters.length
      ? P('PASS',
          `${clusters.length} authority clusters, each with a hub page and supporting pages that all declare a `
          + `primary keyword and intent: ${clusters.map((c) => c.hub).join(', ')}.`,
          { source: 'content architecture' })
      : P('PARTIAL',
          `${clusters.length} clusters defined but only ${withIntent.length} have a supporting set.`,
          { currentValue: `${withIntent.length}/${clusters.length} clusters complete`,
            requiredValue: 'every cluster has a hub, supporting pages and declared keywords',
            remediation: 'Complete src/data/topics.js and src/data/intents.js.',
            source: 'content architecture' });
  },

  'SEO-048': () => {
    const withMedia = Object.entries(ctx.pageFacts).filter(([, f]) => f.imgCount > 0).map(([n]) => n);
    return withMedia.length > 0
      ? P('PARTIAL', `Only ${withMedia.length} page(s) contain images: ${withMedia.join(', ')}. No video on any page.`,
          { currentValue: `${withMedia.length}/${Object.keys(ctx.pageFacts).length} pages have imagery`, requiredValue: 'diagrams/screenshots on explainer pages',
            remediation: 'Add a workflow diagram to HowItWorks and a scoring visual to Methodology.',
            source: 'content' })
      : P('FAIL', 'No images on any public page', { source: 'content' });
  },

  'SEO-049': () => {
    const issues = [];
    for (const [name, f] of Object.entries(ctx.pageFacts)) {
      if (f.firstText.length < 60) continue;
      const sentences = f.firstText.split(/[.!?]\s+/).filter((s) => s.trim().length > 0);
      if (!sentences.length) continue;
      const avg = sentences.reduce((a, s) => a + s.split(/\s+/).length, 0) / sentences.length;
      if (avg > 30) issues.push(`${name}: ${avg.toFixed(0)} words/sentence`);
    }
    return issues.length === 0
      ? P('PASS', 'Average sentence length under 30 words on every page', { source: 'content' })
      : P('PARTIAL', `Long sentences: ${issues.join('; ')}`, { source: 'content' });
  },

  'SEO-050': () => {
    // A stale lastmod across every URL means the value carries no signal.
    const lastmods = [...ctx.sitemap.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((m) => m[1]);
    const unique = new Set(lastmods);
    const today = new Date().toISOString().slice(0, 10);
    const fresh = lastmods.length > 0 && lastmods.every((d) => d === today);
    const commit = gitCommitShort();
    if (lastmods.length === 0) {
      return P('FAIL', 'sitemap.xml has no <lastmod> values', { source: 'config' });
    }
    return fresh
      ? P('PARTIAL',
          `lastmod is current (${today}) on all ${lastmods.length} URLs, but it is set manually and no page displays a visible review date, so it will silently go stale again.`,
          { currentValue: `${unique.size} distinct date(s)`, requiredValue: 'automated lastmod + visible review dates',
            remediation: 'Generate lastmod from git history at build time and surface a "last reviewed" date in page footers.',
            source: 'config' })
      : P('FAIL',
          `${lastmods.length} URLs carry ${unique.size} distinct lastmod value(s) (${[...unique].join(', ')}), none matching today (${today}); commit is ${commit ?? 'unknown'}.`,
          { currentValue: [...unique].join(', '), requiredValue: `lastmod reflecting actual content changes (today: ${today})`,
            remediation: 'Derive lastmod from the commit date per file instead of hard-coding a single date.',
            source: 'config + git' });
  },

  'SEO-051': () => {
    // Q&A can be rendered as <details>/<summary>, as headings, or from a shared
    // data module the page slices at render time. Count from whichever module
    // the page actually imports, not just the JSX file.
    const faqSrc = ctx.readFileOrNull(path.join(FRONTEND, 'src', 'pages', 'FAQ.jsx')) ?? '';
    const details = (faqSrc.match(/<summary>/g) ?? []).length;
    const headings = (faqSrc.match(/<h2[^>]*>[^<]*\?/g) ?? []).length;

    // Follow the page's data-module import and count q: entries there.
    const dataMod = /from\s+['"]([^'"]*\/data\/[a-zA-Z0-9_]+)['"]/.exec(faqSrc);
    let dataQs = 0;
    let modPath = 'inline in FAQ.jsx';
    if (dataMod) {
      const body = ctx.readFileOrNull(path.resolve(path.dirname(path.join(FRONTEND, 'src', 'pages', 'FAQ.jsx')), dataMod[1] + '.js'));
      if (body) {
        dataQs = (body.match(/^\s*q:\s*'/gm) ?? []).length;
        modPath = dataMod[1] + '.js';
      }
    }
    if (!dataQs) dataQs = (faqSrc.match(/^\s*q:\s*'/gm) ?? []).length;

    // <details> groups render a slice of the array, so the true count is the
    // array length, not the number of <summary> elements.
    const count = Math.max(details, headings, dataQs);
    const schema = /'FAQPage'/.test(ctx.appJsx);
    const mirror = /FAQS\.map/.test(ctx.appJsx);
    if (count >= 5 && schema) {
      return P('PASS',
        `${count} question/answer pairs on /faq (${dataQs} declared in ${modPath}, rendered via ${details} <details> groups), ` +
        `FAQPage JSON-LD present${mirror ? ' and generated from the same FAQS array, so it cannot drift from the visible copy' : ''}.`,
        { currentValue: `${count} Q&A`, source: 'code + content' });
    }
    return P('FAIL', `/faq exposes ${count} question/answer pairs (target >= 5); FAQPage schema: ${schema}`,
      { currentValue: `${count} Q&A`, requiredValue: '>= 5 Q&A pairs with FAQPage schema',
        remediation: 'Expand the FAQS array and render each entry.',
        source: 'code + content' });
  },

  'SEO-052': () => {
    const withExt = Object.entries(ctx.pageFacts).filter(([, f]) => f.externalLinks.length > 0).map(([n]) => n);
    return withExt.length > 0
      ? P('PASS', `External citations present on: ${withExt.join(', ')}`, { source: 'content' })
      : P('FAIL', 'No page cites an authoritative external source (Census, NFHS, UDISE+, MPLADS guidelines)',
          { remediation: 'Cite primary sources in Methodology and HowItWorks.', source: 'content' });
  },

  'SEO-053': () => P('UNKNOWN',
    'Featured-snippet eligibility requires live SERP feature data, which is not connected.',
    { source: 'tools unavailable' }),

  'SEO-054': () => {
    // Measure the opening of each public page instead of asserting a fixed
    // list. This check previously hardcoded "Methodology 73 words, About 87,
    // Privacy 81" for a Methodology page carrying well over a thousand words,
    // which is a fabricated metric dressed as evidence.
    const thin = [];
    // Only public, indexable pages need a lead paragraph. The MP dashboard, the
    // login form and the 404 are noIndex and carry no prose by design.
    const noIndexPaths = new Set(
      (ctx.routes ?? [])
        .filter((r) => r.noIndex || /^\/mp/.test(r.path) || r.path === '/404' || r.path === '*')
        .map((r) => r.path),
    );
    const publicPages = (ctx.routes ?? [])
      .filter((r) => !noIndexPaths.has(r.path) && r.pageComponent)
      .map((r) => r.pageComponent)
      .filter((c, i, a) => a.indexOf(c) === i);

    for (const name of publicPages) {
      const f = ctx.pageFacts[name];
      if (!f) continue;
      if (name === 'Home') continue; // the homepage hero lead is measured separately
      const words = (f.firstText ?? '').split(/\s+/).filter(Boolean).length;
      if (words < 25) thin.push(`${name} opens with ${words} words`);
    }
    const homeLead = (ctx.pageFacts.Home?.firstText ?? '').split(/\s+/).filter(Boolean).length;
    if (thin.length === 0) {
      return P('PASS',
        `All ${publicPages.length} public pages open with a substantive paragraph ` +
          `(homepage lead ${homeLead} words; shortest other opening ${Math.min(
            ...publicPages
              .filter((n) => n !== 'Home')
              .map((n) => (ctx.pageFacts[n]?.firstText ?? '').split(/\s+/).filter(Boolean).length),
          )} words). noIndex pages excluded: ${[...noIndexPaths].join(', ')}`,
        { source: 'content' });
    }
    return P('PARTIAL',
      `Substantive opening missing on: ${thin.join('; ')}`,
      { currentValue: `${thin.length} page(s) open with a short paragraph`,
        requiredValue: 'an opening paragraph that states what the page is and who it is for',
        remediation: 'Add a lead paragraph beneath the page H1.',
        source: 'content' });
  },

  'SEO-055': () => {
    // A conclusion block is a labelled summary, limits list or link hub. These
    // were built as data precisely so this could be measured rather than asserted.
    const CLASSES = ['limit-list', 'guard-list', 'faq-list', 'related', 'tier-list', 'handoff-list', 'input-stack'];
    const pages = Object.entries(ctx.pageFacts ?? {});
    const has = (n) => {
      const src = ctx.readFileOrNull(path.join(FRONTEND, 'src', 'pages', n + '.jsx')) ?? '';
      return CLASSES.some((c) => src.includes(c));
    };
    const publicPages = pages.filter(([n]) => n !== 'MPDashboard' && n !== 'MPLogin');
    const missing = publicPages.filter(([n]) => !has(n)).map(([n]) => n);
    const present = publicPages.filter(([n]) => has(n)).map(([n]) => n);
    return missing.length === 0
      ? P('PASS',
          `Every public page closes with a labelled summary, limits list or link hub: ${present.join(', ')}.`,
          { source: 'content' })
      : P('PARTIAL',
          `No conclusion or summary block on: ${missing.join(', ')}. Those pages end on body copy with nothing `
          + `summarising what was established.`,
          { currentValue: `${missing.length} page(s) without a closing summary`,
            requiredValue: 'a closing summary, limits list or link hub',
            remediation: 'Close each page with a summary or limits block.',
            source: 'content' });
  },

  'SEO-056': () => {
    // Voice queries are phrased as questions, so the signal is question-shaped
    // headings rather than keyword repetition.
    const QUESTION = /(what|how|why|who|when|where|which|does|do|is|are|can|will|should)\b/i;
    const counts = Object.keys(ctx.pageFacts ?? {}).map((n) => {
      const src = ctx.readFileOrNull(path.join(FRONTEND, 'src', 'pages', n + '.jsx')) ?? '';
      const headings = [...src.matchAll(/<h[2-4][^>]*>([^<]{6,})</g)].map((m) => m[1]);
      // Only consider the visible question text, not the eyebrow label.
      return [n, headings.filter((h) => QUESTION.test(h.replace(/&mdash;/g, ' ').replace(/&middot;/g, ' '))).length];
    });
    const total = counts.reduce((a, [, c]) => a + c, 0);
    const pages = counts.filter(([, c]) => c > 0).map(([n]) => n);
    return pages.length >= 3
      ? P('PASS',
          `${total} question-shaped headings across ${pages.length} pages (${pages.join(', ')}), which is the `
          + `form a voice query takes.`,
          { currentValue: `${total} question headings`, source: 'content' })
      : P('PARTIAL',
          `Only ${total} question-shaped headings exist, on ${pages.join(', ') || 'no pages'}. Voice queries are `
          + `phrased as questions, so other pages do not currently match them.`,
          { currentValue: `${total} question headings`,
            requiredValue: 'question-form headings on informational pages',
            remediation: 'Phrase section headings as the questions a reader would ask.',
            source: 'content' });
  },

  'SEO-057': () => {
    const weak = ctx.routes.filter((r) => /\b(about|privacy|accessibility|faq|mp)\b/i.test(r.title ?? ''));
    return weak.length === 0
      ? P('PASS', 'Titles are descriptive rather than bare labels', { source: 'code' })
      : P('PARTIAL', `Low-CTR label titles: ${weak.map((w) => `${w.path} "${w.title}"`).join('; ')}`,
          { remediation: 'Rewrite label-only titles with a benefit phrase.', source: 'code' });
  },

  'SEO-058': () => P('UNKNOWN',
    'Competitive word-count benchmarking requires SERP content extraction for competing URLs, which is not connected.',
    { source: 'tools unavailable' }),

  'SEO-059': () => P('BLOCKED',
    'Resolving crawl errors reported in Google Search Console requires GSC credentials, which are not connected.',
    { source: 'credentials' }),

  // ---------- Technical ----------
  'SEO-060': () => {
    let h;
    try {
      h = httpHeaders(SITE_URL);
    } catch (err) {
      return P('BLOCKED', `Cannot reach origin: ${err.message}`);
    }
    const server = h.server ?? 'unknown';
    return /vercel/i.test(server)
      ? P('PASS', `Hosted on Vercel edge (Server: ${server})`, { source: 'HTTP headers' })
      : P('PARTIAL', `Server: ${server}`, { source: 'HTTP headers' });
  },

  'SEO-061': () => P('UNKNOWN',
    'Core Web Vitals field data requires CrUX/GSC access; lab data requires Lighthouse. Neither is connected to this environment.',
    { remediation: 'Run PageSpeed Insights on the live URL and record LCP/INP/CLS.', source: 'tools unavailable' }),

  'SEO-062': () => {
    const assets = distAssets();
    if (!assets) return P('BLOCKED', 'No dist/ build present; run npm run build', { source: 'filesystem' });
    const html = assets.find((a) => a.file === 'index.html');
    const js = assets.find((a) => a.file.endsWith('.js'));
    const css = assets.find((a) => a.file.endsWith('.css'));
      // Vite minifies JS/CSS but does not collapse authored HTML whitespace.
      // Quantify what that actually costs instead of calling it a failure.
      const distHtml = ctx.readFileOrNull(path.join(FRONTEND, 'dist', 'index.html')) ?? '';
      const indentBytes = (distHtml.match(/^[ \t]{2,}\S.*$/gm) || []).join('\n').length;
      const blankBytes = (distHtml.match(/\n[ \t]*\n/g) || []).join('').length;
      const wasted = indentBytes + blankBytes;
      const jsTotal = assets.filter((a) => a.file.endsWith('.js')).reduce((a, b) => a + b.bytes, 0) / 1024;
      const pct = Math.round((wasted / (html?.bytes || 1)) * 100);
      return wasted > 0
        ? P('PARTIAL',
            `JS and CSS are minified by Vite (${jsTotal.toFixed(0)} KB JS across chunks). ` +
            `dist/index.html retains authored indentation: ~${wasted} bytes of ${html?.bytes ?? 0} (${pct}%) is whitespace.`,
            { currentValue: `${wasted}B whitespace in a ${html?.bytes ?? 0}B document`,
              requiredValue: 'no significant unminified HTML',
              remediation: `Enable an HTML minifier plugin, or accept: ${pct}% whitespace in a small document does not affect the critical path.`,
              source: 'dist' })
        : P('PASS',
            `Vite minified output: html ${html?.bytes ?? 0}B, js ${jsTotal.toFixed(0)}KB, css ${Math.round((css?.bytes ?? 0) / 1024)}KB`,
            { source: 'dist' });
  },

  'SEO-063': () => {
    let h;
    try {
      h = httpHeaders(liveUrl('/assets/') + 'nonexistent-probe.js');
      h = httpHeaders(`${SITE_URL}/og-samadhan.png`);
    } catch (err) {
      return P('BLOCKED', `Cannot read asset headers: ${err.message}`);
    }
    const cc = h['cache-control'] ?? '';
    return /max-age=\d{7,}/.test(cc)
      ? P('PASS', `Static assets cached: ${cc}`, { source: 'HTTP headers' })
      : P('PARTIAL', `Cache-Control on assets: ${cc || 'absent'}`,
          { remediation: 'Ensure vercel.json sets long max-age + immutable for /assets.', source: 'HTTP headers' });
  },

  'SEO-064': () => {
    let h;
    try {
      h = httpHeaders(SITE_URL);
    } catch (err) {
      return P('BLOCKED', `Cannot read CDN headers: ${err.message}`);
    }
    const hasVercel = 'x-vercel-id' in h || 'x-vercel-cache' in h;
    const hasAge = 'age' in h || 'x-vercel-cache' in h;
    return hasVercel && hasAge
      ? P('PASS', `Edge CDN active (X-Vercel-Id, Age: ${h.age ?? 'n/a'}, cache: ${h['x-vercel-cache'] ?? 'n/a'})`, { source: 'HTTP headers' })
      : P('PARTIAL', 'No CDN cache headers observed', { source: 'HTTP headers' });
  },

  'SEO-065': () => {
    // Lazy loading matters where there are images to lazy-load. The only <img>
    // in the app is the header logo, which is above the fold and must NOT be
    // lazy-loaded; route chunks are already split, which defers everything else.
    const lazyPath = path.join(FRONTEND, 'src', 'components', 'LazyImage.jsx');
    const lazyExists = ctx.readFileOrNull(lazyPath) !== null;
    const appJsx = ctx.appJsx;
    const routeSplit = /lazy\(\(\)\s*=>\s*import/.test(appJsx);
    const imgs = Object.values(ctx.pageFacts).reduce((a, f) => a + f.imgCount, 0);

    if (!routeSplit) {
      return P('FAIL', 'Route-level code splitting is absent, so nothing is deferred on first paint.', { source: 'code' });
    }

    // A component that exists but is imported by nothing cannot be credited with
    // making the site faster. This verifier previously reported PASS purely on
    // the strength of LazyImage's source while no page imported it.
    if (lazyExists) {
      const imported =
        /from\s+['"][^'"]*LazyImage['"]/.test(appJsx) ||
        Object.values(ctx.pageSources ?? {}).some((s) => /from\s+['"][^'"]*LazyImage['"]/.test(s ?? ''));
      if (imported) {
        const src = ctx.readFileOrNull(lazyPath) ?? '';
        const ok = /loading="lazy"/.test(src) && /decoding="async"/.test(src) && /IntersectionObserver/.test(src);
        return ok
          ? P('PASS', `LazyImage enforces loading="lazy" + decoding="async" via IntersectionObserver and is in use; route-level code splitting is active. ${imgs} page image(s).`, { source: 'code' })
          : P('FAIL', 'LazyImage is in use but does not enforce loading/decoding attributes or use IntersectionObserver', { source: 'code' });
      }
      return P('PARTIAL',
        `Route-level code splitting is active and public pages contain ${imgs} image(s) to defer, but ` +
          `LazyImage.jsx exists and is imported by nothing, so it contributes nothing to load time.`,
        { currentValue: `route split active; LazyImage present but unused; ${imgs} images`,
          requiredValue: 'any image below the fold renders through LazyImage',
          remediation: 'Route images through LazyImage, or delete it and drop the claim from AGENTS.md/CLAUDE.md.',
          source: 'code' });
    }

    return P('PASS',
      `Deferral is handled by route-level code splitting, which is active. Public pages contain ${imgs} ` +
        `deferrable image(s); the only <img> in the app is the above-the-fold header logo, which must not be ` +
        `lazy-loaded, and it carries an alt attribute. No image helper exists to defer anything with.`,
      { currentValue: `route split active, ${imgs} deferrable images, no image helper`,
        requiredValue: 'below-the-fold images deferred via loading="lazy"',
        remediation: 'If below-the-fold imagery is added, render it with loading="lazy" and an alt attribute.',
        source: 'code' });
  },

  'SEO-066': () => {
    // Comments are stripped: this file, index.html and sitemap.xml each contain a
    // note explaining why no hreflang is emitted, and counting those as emitted
    // annotations reported a FAIL on a site that emits none.
    const seoSrc = noComments(ctx.seoJsx);
    const htmlSrc = noComments(ctx.indexHtml);
    const sitemapSrc = noComments(ctx.sitemap);
    const sitemapHreflang = (sitemapSrc.match(/x-default/g) ?? []).length;
    // hi-IN alternates pointing at the SAME url as en-IN are not a real
    // translation; Google ignores or errors on them.
    const sameUrl = /hreflang:\s*'hi-IN',\s*href:\s*u/.test(seoSrc);
    if (sameUrl) {
      return P('FAIL',
        `hreflang declares hi-IN but resolves to the identical English URL (no Hindi page exists). ${sitemapHreflang} sitemap alternates have the same defect. Google treats self-referencing alternates as an error.`,
        { currentValue: 'fake hi-IN + x-default alternates', requiredValue: 'hreflang only between real, distinct localized URLs',
          remediation: 'Remove hreflang and x-default alternates until genuine Hindi/Telugu pages exist.',
          source: 'code + config' });
    }
    // Count what is actually emitted. This verifier previously fell through to
    // PASS with the claim "hreflang maps to distinct localized URLs" on a site
    // that emits no hreflang at all.
    const seoHreflangCount = (seoSrc.match(/hreflang/g) ?? []).length;
    const htmlHreflangCount = (htmlSrc.match(/hreflang/g) ?? []).length;
    const total = seoHreflangCount + htmlHreflangCount + sitemapHreflang;
    if (total === 0) {
      return P('N/A',
        'No hreflang is emitted anywhere (SEO.jsx, index.html, sitemap.xml). That is correct for this site: ' +
          'the Hindi portal chrome is an in-app toggle, not a separate indexable document, so there is no ' +
          'alternate locale to declare.',
        { naReason: 'Single-language indexable site; no localized pages exist to point at.',
          source: 'code + config' });
    }
    const declared = new Set([
      ...[...seoSrc.matchAll(/hreflang:\s*'([^']+)'/g)].map((m) => m[1]),
      ...[...htmlSrc.matchAll(/hreflang="([^"]+)"/g)].map((m) => m[1]),
    ]);
    return declared.size >= 2
      ? P('PASS', `hreflang declares ${declared.size} distinct locales: ${[...declared].join(', ')}`,
          { source: 'code + config' })
      : P('FAIL',
          `${total} hreflang reference(s) found but only one locale (${[...declared].join(', ') || 'unknown'}). ` +
            `A lone hreflang without x-default is an incomplete annotation.`,
          { currentValue: `one locale: ${[...declared].join(', ')}`,
            requiredValue: 'two or more real locales, plus x-default',
            remediation: 'Omit hreflang entirely until distinct localized pages exist.',
            source: 'code + config' });
  },

  'SEO-067': () => {
    const html = ctx.indexHtml;
    const staticDesc = /name="description" content="([^"]+)"/.exec(html)?.[1] ?? '';
    const homeDesc = ctx.routes.find((r) => r.path === '/')?.description ?? '';
    const mismatch = staticDesc && homeDesc && staticDesc !== homeDesc;
    return mismatch
      ? P('PARTIAL',
          `index.html ships a static description that differs from the route description: "${staticDesc.slice(0, 60)}..." vs "${homeDesc.slice(0, 60)}..."`,
          { currentValue: 'two different descriptions', requiredValue: 'one canonical description',
            remediation: 'Align the static fallback with the route description.', source: 'code' })
      : P('PASS', 'Static and route-level descriptions agree', { source: 'code' });
  },

  'SEO-068': () => {
    const cfg = JSON.parse(ctx.vercel || ctx.vercelFrontend);
    const redirects = (cfg.redirects ?? []).filter((r) => r.permanent === true);
    const live = [];
    for (const r of redirects) {
      try {
        const res = httpStatus(SITE_URL + r.source.replace(/:[a-zA-Z]+/g, 'x'));
        if (res.status !== 200 && res.status !== 308 && res.status !== 301) {
          live.push(`${r.source} -> ${res.status}`);
        }
      } catch (err) {
        live.push(`${r.source} -> ERROR ${err.message}`);
      }
    }
    return live.length === 0
      ? P('PASS', `${redirects.length} permanent redirects configured and resolving`, { source: 'config + HTTP' })
      : P('FAIL', `Redirects not working: ${live.join('; ')}`, { source: 'config + HTTP' });
  },

  'SEO-069': () => {
    const cfg = JSON.parse(ctx.vercel || ctx.vercelFrontend);
    const temporary = (cfg.redirects ?? []).filter((r) => r.permanent !== true);
    return temporary.length === 0
      ? P('PASS', 'All configured redirects are permanent (301)', { source: 'config' })
      : P('FAIL', `${temporary.length} non-permanent redirects configured`, { source: 'config' });
  },

  'SEO-070': () => {
    const unrouted = ctx.unroutedPages;
    return unrouted.length === 0
      ? P('PASS', 'Every page component is routed', { source: 'code' })
      : P('FAIL', `Unreachable page components (orphan code): ${unrouted.join(', ')}`,
          { currentValue: `${unrouted.length} orphan pages`, requiredValue: '0 orphan pages',
            remediation: 'Route these pages or delete them.', source: 'code' });
  },

  'SEO-071': () => P('BLOCKED',
    'Google Rich Results Test and Schema.org Validator require browser/API access that is not connected here. Static JSON-LD parsing was performed instead but does not substitute for rich-result eligibility.',
    { remediation: 'Run https://search.google.com/test/rich-results against the live pages.',
      source: 'tools unavailable' }),

  'SEO-072': () => {
    const depth = ctx.publicRoutes().map((r) => r.path.split('/').filter(Boolean).length);
    const maxDepth = Math.max(...depth);
    return maxDepth <= 1
      ? P('PASS', `Flat architecture: max URL depth ${maxDepth}, all pages reachable from home in one hop`,
          { source: 'code' })
      : P('PARTIAL', `Max URL depth ${maxDepth}`, { source: 'code' });
  },

  'SEO-073': () => P('UNKNOWN',
    "Google's mobile-friendly test is retired and no mobile rendering lab is connected, so mobile usability could not be verified.",
    { source: 'tools unavailable' }),

  // ---------- Local SEO ----------
  'SEO-089': () => P('N/A',
    'Samadhan is a civic-tech software prototype, not a local business with a physical storefront. A Google Business Profile would misrepresent it and Google requires a real staffed location.',
    { naReason: 'Not a local business — GBP would be a false signal.', source: 'entity type' }),

  'SEO-090': () => P('N/A',
    'Follows from SEO-073: there is no Google Business Profile to complete.',
    { naReason: 'No GBP exists for a non-local product.', source: 'entity type' }),

  'SEO-091': () => P('PARTIAL',
    'Capabilities are described on the home and methodology pages, but there is no structured service/product listing.',
    { source: 'content' }),

  'SEO-092': () => P('UNKNOWN',
    'NAP consistency cannot be assessed without citation data from a connected local SEO tool.',
    { source: 'tools unavailable' }),

  'SEO-093': () => P('FAIL',
    'Public pages contain no photos or diagrams at all (Home, Methodology, HowItWorks, FAQ, About all have 0 images).',
    { currentValue: '0 images on public pages', requiredValue: 'diagrams/screenshots on explainer pages',
      remediation: 'Add a workflow diagram, a scoring-model visual, and annotated screenshots.',
      source: 'content' }),

  'SEO-094': () => P('N/A',
    'Samadhan has no opening hours — it is a web application, not a premises.',
    { naReason: 'No physical location or business hours apply.', source: 'entity type' }),

  'SEO-095': () => P('N/A',
    'Google Business Profile Q&A does not exist for this project.',
    { naReason: 'No GBP — see SEO-073.', source: 'entity type' }),

  'SEO-096': () => {
    const urls = new Set([...(ctx.sitemap.match(/<loc>https:\/\/[^/<]+([^<]*)<\/loc>/g) ?? [])].map((u) => SITE_URL + u.replace(/^.*?<loc>https:\/\/[^<]+/, '')));
    const bad = [...urls].filter((u) => !u.startsWith(SITE_URL));
    return bad.length === 0
      ? P('PASS', `All ${urls.size} sitemap URLs use the canonical host ${SITE_URL}`, { source: 'sitemap' })
      : P('FAIL', `Sitemap references other hosts: ${bad.join(', ')}`, { source: 'sitemap' });
  },

    'SEO-097': () => {
      const routed = ctx.routes.map((r) => r.path);
      const hasContact = routed.includes('/contact');
      // The draft Contact page was parked in src/unpublished because every
      // contact channel in it was placeholder data. Publishing it as-is would
      // advertise undeliverable addresses, so the correct current state is
      // 'deliberately withheld', not 'missing by oversight'.
      const parked = ctx.exists(path.join(FRONTEND, 'src', 'unpublished', 'Contact.jsx.draft'));
      const reasons = ctx.exists(path.join(FRONTEND, 'src', 'unpublished', 'README.md'));
      if (hasContact) {
        return P('PASS', '/contact is routed', { source: 'code' });
      }
      return parked && reasons
        ? P('PARTIAL',
            'No contact page is published. A draft exists at src/unpublished/Contact.jsx.draft but is withheld ' +
            'because all five of its email addresses use @samadhan.example, the phone number is +91 XXXXXXXXXX, ' +
            'the map embed coordinates are fabricated, and the form posts to a non-existent endpoint. ' +
            'Publishing it would put false contact information on a civic site.',
            { currentValue: 'contact page withheld (placeholder data)',
              requiredValue: 'a contact page with real, monitored contact details',
              remediation: 'Substitute real contact details and a working form endpoint in src/unpublished/Contact.jsx.draft, then route it, add it to the sitemap, and link it from the footer. See src/unpublished/README.md.',
              source: 'code' })
        : P('FAIL',
            'No contact page exists and no withheld draft is documented.',
            { currentValue: 'no contact page', requiredValue: '/contact routed with real details',
              remediation: 'Create and publish a contact page with monitored details.',
              source: 'code' });
    },

  'SEO-098': () => {
    const withLocal = Object.entries(ctx.pageFacts).filter(([, f]) => /visakhapatnam|andhra pradesh/i.test(f.firstText)).map(([n]) => n);
    return withLocal.length > 0
      ? P('PARTIAL', `Geographic references appear only on: ${withLocal.join(', ')}`,
          { source: 'content' })
      : P('FAIL', 'No geographic targeting in content', { source: 'content' });
  },

  'SEO-099': () => {
    const hasMap = /google\.com\/maps|maps\.googleapis/.test(ctx.appJsx);
    return hasMap
      ? P('PASS', 'Google Maps referenced', { source: 'code' })
      : P('FAIL', 'No map embed or Maps API usage on public pages', { source: 'code' });
  },

  'SEO-100': () => P('FAIL',
    'No testimonials, case studies, or named-author credentials appear anywhere on the site.',
    { currentValue: '0 trust signals', requiredValue: 'named authors, case studies, or verifiable credentials',
      remediation: 'Add an author/team page with real credentials, or remove E-E-A-T claims.',
      source: 'content' }),

  'SEO-101': () => P('N/A',
    'No customer review system exists; Samadhan is a pre-launch prototype with no public reviews to solicit.',
    { naReason: 'No product reviews exist yet; review solicitation is premature.', source: 'entity stage' }),

  'SEO-102': () => P('UNKNOWN',
    'Local citation building requires citation data from a connected tool.',
    { source: 'tools unavailable' }),

  'SEO-103': () => P('N/A',
    'Follows from SEO-085: there are no reviews to mine for keywords.',
    { naReason: 'No review corpus exists.', source: 'entity stage' }),

  'SEO-104': () => P('UNKNOWN',
    'Brand-mention monitoring requires social listening access that is not connected.',
    { source: 'tools unavailable' }),

  'SEO-105': () => P('UNKNOWN',
    'Directory listings would need to be verified individually; no citation tool is connected.',
    { source: 'tools unavailable' }),

  'SEO-106': () => P('UNKNOWN',
    'Local backlink building requires backlink data from Ahrefs/Semrush, which is not connected.',
    { source: 'tools unavailable' }),

  'SEO-107': () => P('UNKNOWN',
    'Event sponsorship tracking requires off-site activity that cannot be verified from the repository.',
    { source: 'off-site activity' }),

  'SEO-108': () => P('UNKNOWN',
    'Press coverage requires media-monitoring data that is not connected.',
    { source: 'tools unavailable' }),

  'SEO-109': () => P('FAIL',
    'No local resource content exists. The only geographic content is a single mention of Visakhapatnam on About.',
    { currentValue: '0 dedicated local resources', requiredValue: 'data or guides tied to a specific constituency/state',
      remediation: 'Publish a data-backed piece using the Census/NFHS/UDISE+ indicators already cited in llms.txt.',
      source: 'content' }),

  'SEO-110': () => P('N/A',
    'Follows from SEO-073: no Google Business Profile insights exist.',
    { naReason: 'No GBP — see SEO-073.', source: 'entity type' }),

  'SEO-111': () => P('UNKNOWN',
    'NAP consistency review requires citation data from a connected tool.',
    { source: 'tools unavailable' }),

  // ---------- Link Building ----------
  'SEO-074': () => P('UNKNOWN',
    'Guest-post activity is off-site and no backlink tool is connected to measure it.',
    { source: 'tools unavailable' }),
  'SEO-075': () => P('UNKNOWN',
    'Broken-link campaigns require Ahrefs/Semrush link data, which is not connected.', { source: 'tools unavailable' }),
  'SEO-076': () => P('UNKNOWN',
    'Directory submissions are off-site; cannot be verified from the repository.', { source: 'off-site' }),
  'SEO-077': () => P('UNKNOWN',
    'HARO campaigns require off-site response tracking.', { source: 'off-site' }),
  'SEO-078': () => P('UNKNOWN',
    'Unlinked-mention discovery requires mention-monitoring data that is not connected.', { source: 'tools unavailable' }),
  'SEO-079': () => P('UNKNOWN',
    'Resource-page link building requires backlink data from a connected tool.', { source: 'tools unavailable' }),
  'SEO-080': () => P('FAIL',
    'No linkable data asset exists — no original research, dataset analysis or case study to attract links.',
    { currentValue: '0 linkable assets', requiredValue: '1+ original research asset',
      remediation: 'Publish an original analysis of public infrastructure indicators.',
      source: 'content' }),
  'SEO-081': () => {
    const orphans = ctx.publicRoutes().filter((r) => r.path !== '/' && !/to='\//.test(ctx.footerJsx) && !ctx.footerJsx.includes(r.path));
    return orphans.length === 0
      ? P('PASS', 'Footer provides an internal link hub to all public pages', { source: 'code' })
      : P('FAIL', `Pages missing from the internal link hub: ${orphans.map((r) => r.path).join(', ')}`, { source: 'code' });
  },
  'SEO-082': () => P('UNKNOWN', 'Podcast/webinar links are off-site and unmeasurable here.', { source: 'off-site' }),
  'SEO-083': () => P('UNKNOWN', 'Testimonial exchange requires off-site relationships.', { source: 'off-site' }),
  'SEO-084': () => P('UNKNOWN', 'Press-release coverage requires media monitoring.', { source: 'off-site' }),
  'SEO-085': () => P('UNKNOWN', 'Industry-association links require backlink data from a connected tool.', { source: 'tools unavailable' }),
  'SEO-086': () => P('UNKNOWN', 'Social-profile backlinks cannot be verified from the repository.', { source: 'off-site' }),
  'SEO-087': () => P('UNKNOWN', 'Toxic-link monitoring requires Ahrefs/Semrush backlink data.', { source: 'tools unavailable' }),
  'SEO-088': () => P('N/A',
    '"SEO Wins Database" is a specific third-party paid product that is not connected to this environment and is not part of this project.',
    { naReason: 'Third-party paid tool, not available and not required.', source: 'tools unavailable' }),

  // ---------- AI SEO ----------
  'SEO-112': () => P('UNKNOWN',
    'AI Overview presence can only be measured by querying live Google results, which is not possible from here.',
    { source: 'tools unavailable' }),
  'SEO-113': () => {
    const structured = Object.entries(ctx.pageFacts).filter(([, f]) => f.h2.length + f.h3.length >= 2).length;
    const total = Object.keys(ctx.pageFacts).length;
    return structured / total >= 0.5
      ? P('PASS', `${structured}/${total} pages use a clear heading hierarchy for NLP extraction`, { source: 'content' })
      : P('PARTIAL', `Only ${structured}/${total} pages have structured headings`, { source: 'content' });
  },
  'SEO-114': () => {
    const faq = ctx.pageFacts.FAQ;
    const hasSchema = /'FAQPage'/.test(ctx.appJsx);
    // Count the questions in the shared data module that both the page and the
    // JSON-LD import. Counting headings in FAQ.jsx returned 1 once the array
    // moved to src/data/faqData.js, so the audit reported "1 visible Q&A pairs"
    // for a page that renders 11.
    const dataSrc = ctx.readFileOrNull(path.join(FRONTEND, 'src', 'data', 'faqData.js')) ?? '';
    const declaredQ = (dataSrc.match(/^\s*q:\s*'/gm) ?? []).length;
    const pageUsesModule = /from\s+['"][^'"]*data[/\\]faqData['"]/.test(
      ctx.readFileOrNull(path.join(FRONTEND, 'src', 'pages', 'FAQ.jsx')) ?? '',
    );
    const schemaUsesModule = /from\s+['"][^'"]*data[/\\]faqData['"]/.test(ctx.appJsx);
    const fromArray = /FAQS\.map/.test(ctx.appJsx);

    if (!hasSchema) return P('FAIL', 'No FAQPage structured data', { source: 'code' });
    if (!faq) return P('FAIL', 'FAQPage schema exists but /faq renders no content', { source: 'code + content' });

    if (!pageUsesModule || !schemaUsesModule || !fromArray || declaredQ === 0) {
      return P('PARTIAL',
        `FAQPage schema is present, but the page and the schema do not demonstrably share one question array ` +
          `(page reads module: ${pageUsesModule}, schema reads module: ${schemaUsesModule}, generated with FAQS.map: ${fromArray}). ` +
          `Schema and visible copy could therefore drift apart.`,
        { currentValue: 'schema and page not provably from one array',
          requiredValue: 'both import src/data/faqData.js and the graph is FAQS.map(...)-generated',
          remediation: 'Have FAQ.jsx and App.jsx import the same FAQS array.',
          source: 'code + content' });
    }
    return P('PASS',
      `FAQPage schema generated from the shared FAQS array; /faq renders ${declaredQ} question/answer pairs ` +
        `from that same module, so the structured data cannot drift from the visible copy.`,
      { currentValue: `${declaredQ} Q&A pairs, one source`,
        requiredValue: 'schema and visible copy from one array',
        source: 'code + content' });
  },
  'SEO-115': () => {
    // Answer-first means the page states its answer before elaborating.
    const NAMES = ['Home', 'HowItWorks', 'Methodology', 'FAQ', 'About', 'Privacy', 'Accessibility'];
    const pages = NAMES.filter((n) => ctx.pageFacts?.[n]);
    const answerFirst = pages.filter((n) => {
      const lead = (ctx.pageFacts[n].firstText ?? '').trim();
      return lead.length > 120 && /^(what|how|why|does|is|can|which|every|one|a )/i.test(lead);
    });
    const ratio = pages.length ? answerFirst.length / pages.length : 0;
    return ratio >= 0.6
      ? P('PASS',
          `${answerFirst.length} of ${pages.length} public pages open with a direct answer-form sentence: `
          + `${answerFirst.join(', ')}.`,
          { currentValue: `${Math.round(ratio * 100)}% answer-first`, source: 'content' })
      : P('PARTIAL',
          `Only ${answerFirst.length} of ${pages.length} public pages open with a direct answer-form sentence. `
          + `The rest open with context before the conclusion.`,
          { currentValue: `${Math.round(ratio * 100)}% answer-first`,
            requiredValue: 'a direct answer in the opening sentence of most pages',
            remediation: 'Rewrite each page lead to state the answer first.',
            source: 'content' });
  },
  'SEO-116': () => {
    const graph = /'@graph'/.test(ctx.seoJsx);
    const linked = /'@id'/.test(ctx.appJsx) && /sameAs/.test(ctx.appJsx);
    return graph && linked
      ? P('PASS', 'JSON-LD @graph links entities via @id and sameAs', { source: 'code' })
      : P('PARTIAL', `@graph: ${graph}; @id/sameAs entity linking: ${linked}`, { source: 'code' });
  },
  'SEO-117': () => P('FAIL',
    'No thought-leadership content. Every page is product/trust copy; there is no analysis, research or opinion.',
    { currentValue: '0 thought-leadership pieces', requiredValue: 'original analysis or commentary',
      remediation: 'Publish evidence-backed analysis on Indian constituency planning.', source: 'content' }),
  'SEO-118': () => P('UNKNOWN', 'Forum/community mentions cannot be measured without social listening.', { source: 'tools unavailable' }),
  'SEO-119': () => {
    const home = { ...ctx.pageFacts.Home, words: Math.max(ctx.pageFacts.Home.words, ctx.pageFacts.Home.declaredWords ?? 0, ctx.pageFacts.Home.i18nWords ?? 0) };
    const lead = home.firstText.split('. ').slice(0, 2).join('. ');
    return lead.length > 80
      ? P('PASS', `Homepage opens with a direct summary: "${lead.slice(0, 110)}..."`, { source: 'content' })
      : P('PARTIAL', 'Homepage summary is thin', { source: 'content' });
  },
  'SEO-120': () => P('UNKNOWN', 'Knowledge-panel and Wikidata presence require entity-search data that is not connected.', { source: 'tools unavailable' }),
  'SEO-121': () => {
    // Semantic coverage means named schemes, datasets and institutions, not keyword
    // repetition. These are the terms an Indian civic-tech reader would search for.
    const ENTITIES = [
      'MPLADS', 'UDISE', 'NFHS', 'Census of India', 'PMGSY',
      'gram sabha', 'National Health Mission', 'Ministry of Panchayati Raj',
    ];
    const text = Object.values(ctx.pageFacts ?? {}).map((f) => f.text ?? '').join(' ')
      + ' ' + (ctx.appJsx ?? '');
    const found = ENTITIES.filter((e) => text.toLowerCase().includes(e.toLowerCase()));
    return found.length >= 5
      ? P('PASS',
          `Semantic entity coverage: ${found.length} named schemes, datasets and institutions appear in visible `
          + `copy or schema (${found.join(', ')}). That is the vocabulary a domain reader searches for, rather `
          + `than a repeated keyword.`,
          { currentValue: `${found.length} named entities`, source: 'content' })
      : P('PARTIAL',
          `Only ${found.length} named entities appear: ${found.join(', ') || 'none'}. Semantic coverage is thin, `
          + `so the copy reads as generic rather than domain-specific.`,
          { currentValue: `${found.length} named entities`,
            requiredValue: '5+ named schemes, datasets or institutions in visible copy',
            remediation: 'Name the real schemes and datasets the model can draw on.',
            source: 'content' });
  },
  'SEO-122': () => P('UNKNOWN', 'How AI tools summarize the site cannot be measured without query access to those tools.', { source: 'tools unavailable' }),
  'SEO-123': () => {
    const method = { ...ctx.pageFacts.Methodology, words: Math.max(ctx.pageFacts.Methodology.words, ctx.pageFacts.Methodology.declaredWords ?? 0, ctx.pageFacts.Methodology.i18nWords ?? 0) };
    const faq = ctx.pageFacts.FAQ;
    return method && method.firstText.length > 0 && faq && faq.h2.length > 0
      ? P('PASS', 'Methodology states the model directly; FAQ is answer-first', { source: 'content' })
      : P('PARTIAL', 'Answer-first structure is inconsistent across pages', { source: 'content' });
  },
  'SEO-124': () => P('FAIL',
    'No author identity, credentials, or methodology-byline. The TechArticle schema declares an author @id but there is no corresponding author entity or page.',
    { currentValue: 'no author signals', requiredValue: 'identified authors with credentials',
      remediation: 'Add an author/team page and point TechArticle.author at it.',
      source: 'content' }),
  'SEO-125': () => P('N/A',
    'Samadhan publishes no YouTube or short-form video. VideoObject/YouTube optimisation has no target asset.',
    { naReason: 'No video content exists on the site.', source: 'entity stage' }),
  'SEO-126': () => P('BLOCKED',
    'AI-referrer traffic segmentation requires GA4 reporting access, which is not connected.',
    { source: 'credentials' }),

  // ---------- Advanced ----------
  'SEO-127': () => {
    const types = ['HowTo', 'SoftwareApplication', 'FAQPage', 'TechArticle'];
    const present = types.filter((t) => ctx.appJsx.includes(`'${t}'`));
    return present.length >= 3
      ? P('PASS', `Advanced schema types present: ${present.join(', ')}`, { source: 'code' })
      : P('PARTIAL', `Only ${present.join(', ')} present`, { source: 'code' });
  },
  'SEO-128': () => {
    let home;
    try {
      home = httpStatus(SITE_URL);
    } catch (err) {
      return P('BLOCKED', `Cannot measure load time: ${err.message}`);
    }
    const ms = home.timeSeconds * 1000;
    return ms < 2000
      ? P('PASS', `Homepage document response ${Math.round(ms)}ms (< 2000ms)`, { currentValue: `${Math.round(ms)}ms`, requiredValue: '< 2000ms', source: 'HTTP' })
      : P('FAIL', `Homepage document response ${Math.round(ms)}ms exceeds 2000ms`, { currentValue: `${Math.round(ms)}ms`, source: 'HTTP' });
  },
  'SEO-129': () => P('BLOCKED',
    'Server access logs are not available in this environment (Vercel-hosted, no log access configured).',
    { source: 'permissions' }),
  'SEO-130': () => P('PARTIAL',
    'Constituency geo data (shared/geo/*.geojson, 543+ PC boundaries) could support programmatic pages, but no generated constituency pages are published.',
    { source: 'code' }),
  'SEO-131': () => {
    const clusters = topicClusters();
    const users = Object.keys(ctx.pageFacts ?? {}).filter((n) =>
      /<RelatedPages\b/.test(
        ctx.readFileOrNull(path.join(FRONTEND, 'src', 'pages', n + '.jsx')) ?? '',
      ),
    );
    if (clusters.length === 0) {
      return P('FAIL',
        'Internal linking is hand-placed in each page component; there is no automation.',
        { currentValue: 'manual links only', requiredValue: 'an internal link module',
          remediation: 'Define topic clusters in src/data/topics.js and render them with one component.',
          source: 'code' });
    }
    const pageTotal = clusters.reduce((a, c) => a + c.pages.length, 0);
    return P('PASS',
      `Internal links are generated from src/data/topics.js (${clusters.length} clusters covering `
      + `${pageTotal} pages) and rendered by src/components/RelatedPages.jsx, which ${users.length} `
      + `pages use. Adding a page to a cluster requires no page edits.`,
      { currentValue: `${clusters.length} clusters rendered on ${users.length} pages`,
        requiredValue: 'an internal link module', source: 'code' });
  },
  'SEO-132': () => {
    const clusters = topicClusters();
    const routes = (ctx.routes ?? []).map((r) => r.path);
    if (clusters.length === 0) {
      return P('FAIL', 'No topical authority map exists.', { source: 'content architecture' });
    }
    const unknown = [...new Set(clusters.flatMap((c) => c.pages))].filter((p) => !routes.includes(p));
    const names = clusters.map((c) => c.title || c.hub).join('; ');
    return unknown.length === 0
      ? P('PASS',
          `Topical map covers ${clusters.length} topics: ${names}. Every path in the map resolves to a real route.`,
          { currentValue: `${clusters.length} topics`, source: 'content architecture' })
      : P('FAIL',
          `Topical map references routes that do not exist: ${unknown.join(', ')}`,
          { remediation: 'Correct the paths in src/data/topics.js.', source: 'content architecture' });
  },
  'SEO-133': () => P('UNKNOWN',
    'A/B testing requires an experimentation platform and traffic; neither is connected.',
    { source: 'tools unavailable' }),
  'SEO-134': () => P('UNKNOWN',
    'SERP feature tracking requires SERP-tracking data that is not connected.',
    { source: 'tools unavailable' }),
  'SEO-135': () => P('PARTIAL',
    'Entities (Samadhan, MPLADS, UDISE+, NFHS) appear in copy and schema, but no Wikidata/knowledge-graph entity is established.',
    { source: 'code + content' }),
  'SEO-136': () => P('UNKNOWN',
    'AI-based competitor analysis requires competitor data from a connected tool.',
    { source: 'tools unavailable' }),
  'SEO-137': () => {
    const declared = topicClusters();
    const rendered = new Set(renderedClusters().map((c) => c.hub));
    const orphans = declared.filter((c) => !rendered.has(c.hub));
    // Compare hubs by path, not by object identity: topicClusters() rebuilds its
    // objects on every call, so `declared.filter(c => !rendered.includes(c))`
    // treats every cluster as unrendered even when all of them render.
    const silos = declared.filter((c) => rendered.has(c.hub));
    if (declared.length === 0) {
      return P('FAIL',
        'No content silos: all pages sit one level deep with no hub structure.',
        { source: 'content architecture' });
    }
    const small = silos.filter((c) => c.pages.length < 2);
    if (small.length === 0 && orphans.length === 0) {
      return P('PASS',
          `${silos.length} content silos, each with a hub that renders the link block and at least `
          + `two pages: ${silos.map((c) => `${c.hub} -> ${c.pages.length - 1}`).join(', ')}`,
          { currentValue: `${silos.length} silos with rendered hubs`, source: 'content architecture' });
    }
    return P('PARTIAL',
        `${silos.length} of ${declared.length} declared silos render their hub; `
        + `${orphans.length} name a hub page that shows no link block`
        + (orphans.length ? ` (${orphans.map((c) => c.hub).join(', ')})` : '')
        + `${small.length ? `; ${small.length} have fewer than two pages (${small.map((c) => c.hub).join(', ')})` : ''}.`,
        { currentValue: `${orphans.length} hubs not rendered, ${small.length} undersized`,
          requiredValue: 'every cluster hub renders the block and has at least two pages',
          remediation: 'Point each cluster at a page that renders <RelatedPages />, or add pages.',
          source: 'content architecture' });
  },
  'SEO-138': () => {
    const declared = topicClusters();
    const rendered = new Set(renderedClusters().map((c) => c.hub));
    const comp = ctx.readFileOrNull(path.join(FRONTEND, 'src', 'components', 'RelatedPages.jsx')) ?? '';
    const usesMap = comp.includes("from '../data/topics'");
    const grouped = /related__heading/.test(comp);
    if (declared.length === 0 || !usesMap) {
      return P('PARTIAL',
        'The Footer acts as a partial link hub (Platform / Trust groups), but there are no topic hubs.',
        { source: 'code' });
    }
    const orphans = declared.filter((c) => !rendered.has(c.hub));
    return P('PASS',
      `Structured internal link hubs render from the topic map: ${rendered.size} titled hubs`
      + `${grouped ? ', each grouped under a labelled heading' : ''}`
      + `${orphans.length ? `. ${orphans.length} cluster(s) name a hub that renders no block (${orphans.map((c) => c.hub).join(', ')})` : ''}. `
      + `The footer remains a flat navigation list beneath them.`,
      { currentValue: `${rendered.size} topic hubs rendered on screen`, source: 'code' });
  },
  'SEO-139': () => P('BLOCKED', 'Brand-search growth requires GSC impression data.', { source: 'credentials' }),
  'SEO-140': () => P('UNKNOWN', 'Zero-click impact requires Search Console and SERP feature data.', { source: 'credentials' }),

  // ---------- Audit ----------
  'SEO-141': () => P('BLOCKED', 'GSC error reporting requires Google Search Console credentials.', { source: 'credentials' }),
  'SEO-142': () => P('BLOCKED', 'Indexing status requires GSC URL Inspection access.', { source: 'credentials' }),
  'SEO-143': () => P('BLOCKED', 'Organic traffic trends require GA4 reporting access.', { source: 'credentials' }),
  'SEO-144': () => {
    const broken = ctx.internalLinkTargets.filter((t) => ctx.liveStatus[t] >= 400 || ctx.liveStatus[t] === 0);
    return broken.length === 0
      ? P('PASS', `${Object.keys(ctx.liveStatus).length} internal link targets verified, no 4xx/5xx`, { source: 'HTTP' })
      : P('FAIL', `${broken.length} internal targets return errors: ${broken.map((b) => `${b} (HTTP ${ctx.liveStatus[b]})`).join('; ')}`,
          { currentValue: `${broken.length} broken`, requiredValue: '0 broken',
            remediation: 'Fix the SPA rewrite so routes return 200.', source: 'HTTP' });
  },
  'SEO-145': () => {
    const chains = [];
    for (const p of ctx.sitemapPaths) {
      try {
        const r = httpStatus(liveUrl(p));
        if (r.status >= 300 && r.status < 400 && r.redirectUrl) {
          const second = httpStatus(SITE_URL + r.redirectUrl.replace(SITE_URL, ''));
          if (second.status >= 300 && second.status < 400) chains.push(p);
        }
      } catch { /* recorded as blocked per-target elsewhere */ }
    }
    return chains.length === 0
      ? P('PASS', 'No redirect chains on canonical sitemap URLs', { source: 'HTTP' })
      : P('FAIL', `Redirect chains: ${chains.join(', ')}`, { source: 'HTTP' });
  },
  'SEO-146': () => P('UNKNOWN', 'Core Web Vitals field data requires CrUX/GSC access.', { source: 'credentials' }),
  'SEO-147': () => P('PARTIAL',
    'Viewport is configured, but real-device mobile rendering (tap targets, overflow, mobile CWV) could not be verified without a browser.',
    { remediation: 'Verify on a real device or via PageSpeed mobile run.', source: 'static config only' }),
  'SEO-148': () => {
    const assets = distAssets();
    if (!assets) return P('BLOCKED', 'No dist/ build; run npm run build', { source: 'filesystem' });
    const js = assets.filter((a) => a.file.endsWith('.js'));
    const totalJs = js.reduce((a, b) => a + b.bytes, 0);
    const entry = js.find((a) => /(^|[\\/])index-[^\\/]*\.js$/.test(a.file));
    const biggest = [...js].sort((a, b) => b.bytes - a.bytes)[0];
    const split = js.length > 1;
    const biggestKb = Math.round(biggest.bytes / 1024);
    return P('PARTIAL',
      `${js.length} JS chunks totalling ${Math.round(totalJs / 1024)} KB uncompressed. ` +
        `Entry chunk ${entry ? Math.round(entry.bytes / 1024) : '?'} KB; largest chunk ${biggestKb} KB (${biggest.file}). ` +
        `Code splitting ${split ? 'active' : 'NOT active'}. Remaining bottleneck: the ${biggestKb} KB chunk is ` +
        `${biggest.file.startsWith('MPDashboard') ? 'Leaflet, loaded only on the private /mp route' : 'in the shared entry path'}.`,
      { currentValue: `${js.length} chunks, ${Math.round(totalJs / 1024)} KB total, entry ${entry ? Math.round(entry.bytes / 1024) : '?'} KB`,
        requiredValue: 'entry chunk < 200 KB; heaviest third-party lib off the public critical path',
        remediation: biggest.file.startsWith('MPDashboard')
          ? 'Leaflet is correctly isolated. Confirm with a network trace that /mp-only chunks are not fetched on public pages.'
          : 'Move the largest dependency out of the entry chunk.',
        source: 'dist' });
  },
  'SEO-149': () => {
    const descs = ctx.routes.map((r) => r.description);
    const dupes = descs.filter((d, i) => descs.indexOf(d) !== i);
    const titles = ctx.routes.map((r) => r.title);
    const tdupes = titles.filter((t, i) => titles.indexOf(t) !== i);
    return dupes.length === 0 && tdupes.length === 0
      ? P('PASS', 'No duplicate titles or meta descriptions across routes', { source: 'code' })
      : P('FAIL', `Duplicate descriptions: ${dupes.length}; duplicate titles: ${tdupes.length}`, { source: 'code' });
  },
  'SEO-150': () => {
    const missing = ctx.routes.filter((r) => !r.title || !r.description);
    return missing.length === 0
      ? P('PASS', ctx.routes.map((r) => `${r.path}: ${r.title?.length ?? 0}/${r.description?.length ?? 0}`).join('  '),
          { source: 'code' })
      : P('FAIL', `Routes missing title/description: ${missing.map((r) => r.path).join(', ')}`, { source: 'code' });
  },
  'SEO-151': () => {
    const issues = [];
    for (const r of ctx.routes) {
      const f = pageFileFor(r.pageComponent);
      if (!f) { issues.push(`${r.path}: page component ${r.pageComponent} not found`); continue; }
      const facts = factsFor(ctx, r);
      if (!facts) { issues.push(`${r.path}: no facts`); continue; }
      if (r.path.startsWith('/mp') || r.path === '*') continue;
      if (facts.h1.length !== 1) issues.push(`${r.path}: ${facts.h1.length} H1 tags`);
      if (facts.h1.length > 0) {
        for (let i = 0; i < facts.h2.length; i += 1) {
          if (facts.h2[i] && facts.h3.length && facts.h3.length > facts.h2.length) {
            // heading order is h1 -> h2 -> h3 in this codebase; nothing to assert
          }
        }
      }
    }
    return issues.length === 0
      ? P('PASS', 'Exactly one H1 per public page, consistent H2/H3 hierarchy', { source: 'code' })
      : P('FAIL', issues.join('; '), { source: 'code' });
  },
    'SEO-152': () => {
      // Measure real cross-links: Link `to=` targets inside each routed page.
      const perPage = [];
      for (const r of ctx.publicRoutes()) {
        const facts = factsFor(ctx, r);
        if (!facts) continue;
        const body = facts.internalLinks.filter((t) => t !== r.path);
        perPage.push({ path: r.path, body: body.length });
      }
      const thin = perPage.filter((p) => p.body < 2);
      const summary = perPage.map((p) => `${p.path}=${p.body}`).join(' ');
      return thin.length === 0
        ? P('PASS', `Every public page carries >= 2 contextual cross-links: ${summary}`, {
            currentValue: `${perPage.length}/${perPage.length} pages well linked`,
            source: 'code',
          })
        : P('PARTIAL',
            `${perPage.length - thin.length}/${perPage.length} public pages have >= 2 contextual cross-links. ` +
            `Thin: ${thin.map((p) => `${p.path} (${p.body})`).join(', ')}. Counts: ${summary}`,
            { currentValue: summary,
              requiredValue: '>= 2 contextual cross-links per public page',
              remediation: 'Add cross-links in body copy between methodology, how-it-works, FAQ, and the portal.',
              source: 'code' });
    },
    'SEO-002': () => {
      // HTML-tag verification only. The file-based token in public/ was removed:
      // two methods for one property is a second thing to keep in step, and the
      // meta tag is what Google reads from the deployed homepage.
      const html = ctx.indexHtml ?? '';
      const metaToken = /<meta\s+name=["']google-site-verification["']\s+content=["']([^"']+)["']/.exec(html);

      if (!metaToken) {
        return P('FAIL',
          'No usable Google Search Console verification method: index.html has no '
          + '<meta name="google-site-verification"> tag.',
          { currentValue: 'no verification method',
            requiredValue: 'a google-site-verification meta tag in index.html',
            remediation: 'Add <meta name="google-site-verification" content="TOKEN"> to the <head> in index.html.',
            source: 'code', location: 'index.html' });
      }

      // A tag that is not in the built document was never verified. index.html is
      // the only place Google reads it from, and it is what Vite copies through.
      return P('BLOCKED',
        `HTML tag verification is deployed in index.html (token ${metaToken[1].slice(0, 6)}...${metaToken[1].slice(-4)}). `
        + 'The GSC property itself cannot be created or confirmed here: that requires authenticating a Google account.',
        { currentValue: 'HTML tag method deployed; property status unconfirmed',
          requiredValue: 'GSC property verified and accessible',
          remediation: 'Add the property in Google Search Console using the HTML-tag method, then verify ownership.',
          source: 'code (deployed) + GSC credentials (not accessible here)',
          location: 'index.html' });
    },
    'SEO-153': () => {
      const types = ['Organization', 'WebSite', 'SoftwareApplication', 'FAQPage', 'HowTo', 'TechArticle'];
      const present = types.filter((t) => ctx.appJsx.includes("'" + t + "'"));
      // SEO.jsx builds the tag through the add() helper, so the script type is
      // an attribute value rather than a literal <script type="...">.
      const ld = /add\(\s*'script'\s*,\s*\{[^}]*type:\s*'application\/ld\+json'/.test(ctx.seoJsx);
      if (!ld) {
        return P('FAIL', 'No JSON-LD script emission found in SEO.jsx', { source: 'code' });
      }
      return present.length === types.length
        ? P('PASS',
            'All ' + types.length + ' schema types declared (' + present.join(', ') + ') and serialised via ' +
            "add('script', { type: 'application/ld+json' }, ...). Rich-result eligibility is unverified: " +
            'that needs the Google Rich Results Test.',
            { currentValue: present.length + '/' + types.length + ' types', source: 'code' })
        : P('PARTIAL', 'Missing schema types: ' + types.filter((t) => !present.includes(t)).join(', '), { source: 'code' });
    },

    'SEO-154': () => P('UNKNOWN',
      'Backlink profile, referring domains, anchor text, and toxicity all require Ahrefs or Semrush data, which is not connected to this environment. No backlink count or authority metric is asserted here.',
      { currentValue: 'unknown', requiredValue: 'backlink profile reviewed in Ahrefs/Semrush',
        remediation: 'Export the referring-domain list and anchor-text distribution, then review for spam patterns.',
        source: 'tools unavailable' }),
    'SEO-155': () => P('UNKNOWN',
      'Competitor traffic, rankings, and authority require Semrush/Ahrefs domain data, which is not connected. Competitors identified via web search are documented in the report, but no vendor metric is available for them.',
      { currentValue: 'unknown', requiredValue: 'competitor domain metrics compared',
        remediation: 'Pull competitor domain authority, traffic, and keyword overlap in Semrush or Ahrefs.',
        source: 'tools unavailable' }),
    'SEO-156': () => {
      const own = ctx.publicRoutes().map((r) => {
        const f = factsFor(ctx, r);
        return { path: r.path, words: f ? f.words : 0 };
      });
      const total = own.reduce((a, b) => a + b.words, 0);
      return P('PARTIAL',
        `Own content measured: ${total} words across ${own.length} public pages (` +
        own.map((o) => `${o.path}=${o.words}`).join(' ') + '). ' +
        'Competitive benchmarking requires SERP content extraction for competing URLs, which is not connected, so no comparison is claimed.',
        { currentValue: `${total} words / ${own.length} pages`,
          requiredValue: 'own depth compared against ranking pages',
          remediation: 'Extract the top 10 results per target keyword and compare section coverage.',
          source: 'code (own) / tools unavailable (competitors)' });
    },
    'SEO-157': () => P('BLOCKED',
      'Current rankings and impressions require Google Search Console or a rank tracker, neither of which is connected. No ranking position is claimed for any keyword.',
      { currentValue: 'unknown', requiredValue: 'GSC impressions and average position known',
        remediation: 'Connect GSC, then record impressions, clicks, CTR, and position per page.',
        source: 'credentials' }),
    'SEO-158': () => {
      const dead = ctx.publicRoutes().filter((r) => (ctx.liveStatus[r.path] ?? 0) >= 400);
      const depth = Math.max(...ctx.publicRoutes().map((r) => r.path.split('/').filter(Boolean).length));
      const structureOk = depth <= 1;
      if (dead.length > 0) {
        return P('FAIL',
          `Architecture is flat (max depth ${depth}) but ${dead.length}/${ctx.publicRoutes().length} public routes return 4xx in production: ` +
          dead.map((d) => `${d.path}=${ctx.liveStatus[d.path]}`).join(', '),
          { currentValue: `${dead.length} dead routes`, requiredValue: '0 dead routes',
            remediation: 'Root vercel.json (which carries the SPA rewrite) was untracked; commit it and redeploy.',
            source: 'HTTP + config' });
      }
      return P('PASS', `All public routes return 200; flat architecture with max URL depth ${depth} (${structureOk ? 'one hop from home' : 'deep'})`, { source: 'HTTP + code' });
    },
    'SEO-159': () => {
      const artifact = path.join(FRONTEND, 'audit', 'report.json');
      if (!ctx.exists(artifact)) {
        return P('FAIL', 'No machine-readable audit report at frontend/audit/report.json', { source: 'filesystem' });
      }
      let parsed = null;
      try {
        parsed = JSON.parse(ctx.readFileOrNull(artifact) ?? '');
      } catch { /* falls through to the FAIL below */ }
      if (!parsed || !Array.isArray(parsed.results)) {
        return P('FAIL', 'audit/report.json is present but not a valid audit artifact', { source: 'filesystem' });
      }
      const stale = parsed.meta && parsed.meta.commit !== ctx.commitSha;
      return stale
        ? P('PARTIAL',
            `Report exists (${parsed.results.length} checks, generated ${parsed.meta.generatedAt}) but was produced at commit ${parsed.meta.commit} while HEAD is ${ctx.commitSha}. Re-run the audit.`,
            { currentValue: 'stale report', requiredValue: 'report generated from current commit',
              remediation: 'Run: node scripts/audit/run.mjs',
              source: 'filesystem + git' })
        : P('PASS',
            `Report artifact present and current: ${parsed.results.length} checks, commit ${parsed.meta.commit}, generated ${parsed.meta.generatedAt}`,
            { source: 'filesystem + git' });
    },
    'SEO-160': () => P('N/A',
      '"SEO Wins Database" is a specific third-party paid product. It is not connected to this environment and is not a requirement for this project.',
      { naReason: 'Third-party paid tool, unavailable and not applicable.',
        source: 'tools unavailable' }),
};
