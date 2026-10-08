#!/usr/bin/env node
/**
 * Verify the analytics integration is coherent.
 *
 * The failure this prevents: GTM loads Google Tag Manager in <head>, and
 * GA4.jsx also used to inject gtag.js. Both would fire page_view per
 * navigation, double-counting every metric. This asserts exactly one
 * loader exists.
 *
 * Run: node scripts/check-analytics.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

const results = [];
const pass = (id, label, detail) => results.push({ id, label, status: 'PASS', detail });
const fail = (id, label, detail, fix) => results.push({ id, label, status: 'FAIL', detail, fix });
const na = (id, label, detail, reason) => results.push({ id, label, status: 'N/A', detail, reason });

const html = read('index.html');
const ga4 = read('src/components/GA4.jsx');

const GTM_ID = 'GTM-NQ6GK9QG';

// --- GTM snippet present and correctly placed ---------------------------
const headIdx = html.indexOf('<head>');
const bodyIdx = html.indexOf('<body>');
const gtmIdx = html.indexOf('gtm.js');
const gtmIdIdx = html.indexOf(GTM_ID);

if (gtmIdx === -1 || gtmIdIdx === -1) {
  fail('ANL-01', 'GTM head snippet', `Container ${GTM_ID} not found in index.html`,
    'Add the GTM snippet as the first child of <head>.');
} else if (!(gtmIdx > headIdx && gtmIdx < bodyIdx)) {
  fail('ANL-01', 'GTM head snippet', 'GTM snippet exists but is not inside <head>',
    'Move the snippet to the top of <head>.');
} else {
  pass('ANL-01', 'GTM head snippet',
    `Container ${GTM_ID} loaded inside <head> at byte ${gtmIdx}, before <body> at ${bodyIdx}`);
}

// The snippet must precede the render-blocking app bundle so it fires early.
const moduleIdx = html.indexOf('/src/main.jsx');
if (moduleIdx !== -1 && gtmIdx !== -1) {
  gtmIdx < moduleIdx
    ? pass('ANL-02', 'GTM loads before app bundle', `gtm at ${gtmIdx} < main.jsx at ${moduleIdx}`)
    : fail('ANL-02', 'GTM loads before app bundle', 'App module script precedes the GTM snippet',
      'Move the GTM snippet above the module script.');
}

// --- noscript iframe immediately after <body> ---------------------------
const nsIdx = html.indexOf('/ns.html?id=' + GTM_ID);
if (nsIdx === -1) {
  fail('ANL-03', 'GTM noscript iframe', 'noscript iframe not found',
    'Add the GTM noscript iframe immediately after <body>.');
} else if (!(nsIdx > bodyIdx)) {
  fail('ANL-03', 'GTM noscript iframe', 'noscript iframe is not after <body>',
    'Move it to the first child of <body>.');
} else {
  const gap = html.slice(bodyIdx, nsIdx);
  const placement = gap.includes('Google Tag Manager (noscript)') ? 'inside its comment block' : 'after <body>';
  pass('ANL-03', 'GTM noscript iframe', `Present ${placement} at byte ${nsIdx}`);
}

// --- exactly one path to GA4 -------------------------------------------
// GA4 now loads from index.html via gtag.js, not through the GTM container.
// The invariant is not "gtag.js is absent" — it is that there is exactly one
// of each loader, so no tag is declared twice in the document. GA4.jsx must
// not inject gtag.js a second time, which is a real double-count risk.
const loadsGtagInJsx = /gtag\/js\?id=|googletagmanager\.com\/gtag/.test(ga4);
const gtagInHtml = [...html.matchAll(/googletagmanager\.com\/gtag\/js\?id=/g)].length;
const gtmInHtml = [...html.matchAll(/googletagmanager\.com\/gtm\.js/g)].length;
const measurementId = /gtag\('config',\s*'(G-[A-Z0-9]+)'/.exec(html)?.[1] ?? null;

if (loadsGtagInJsx) {
  fail('ANL-04', 'Single path to GA4',
    'GA4.jsx also injects gtag.js while index.html already loads it, so the library is fetched twice.',
    'Remove the gtag.js injection from GA4.jsx; index.html owns the loader.');
} else if (gtagInHtml !== 1 || gtmInHtml !== 1) {
  fail('ANL-04', 'Single path to GA4',
    `Expected exactly one gtag.js and one gtm.js in index.html; found gtag=${gtagInHtml}, gtm=${gtmInHtml}.`,
    'Load each library exactly once in the <head> of index.html.');
} else if (!measurementId) {
  fail('ANL-04', 'Single path to GA4',
    'gtag.js is loaded but no gtag(\'config\', \'G-...\') call was found, so GA4 never receives events.',
    "Add gtag('config', 'G-XXXXXXX') in index.html.");
} else {
  pass('ANL-04', 'Single path to GA4',
    `1 gtm.js, 1 gtag.js, configured for ${measurementId}; GA4.jsx does not inject a second loader. `
    + 'GA4 must NOT also be configured inside GTM-NQ6GK9QG.');
}

// --- SPA page-view tracking ---------------------------------------------
/dataLayer\.push/.test(ga4)
  ? pass('ANL-05', 'SPA route tracking', 'GA4.jsx pushes page_view to dataLayer on route change')
  : fail('ANL-05', 'SPA route tracking', 'No dataLayer push found',
    'Push a page_view event on location change so GTM records client-side navigations.');

/document\.title/.test(ga4)
  ? pass('ANL-06', 'Page title at time of tracking', 'page_title read from document.title after render')
  : fail('ANL-06', 'Page title at time of tracking', 'page_title not captured',
    'Read document.title so analytics titles match what users saw.');

// --- preconnect ----------------------------------------------------------
/rel="preconnect"[^>]*googletagmanager\.com/.test(html)
  ? pass('ANL-07', 'GTM preconnect', 'googletagmanager.com is preconnected')
  : fail('ANL-07', 'GTM preconnect', 'No preconnect for googletagmanager.com',
    'GTM is in the critical path; preconnect its origin.');

// --- no PII in tracked payloads -----------------------------------------
const pii = ['phone', 'phone_number', 'name', 'email', 'address', 'latitude', 'longitude', 'reference_id']
  .filter((k) => new RegExp('page_path:\\s*[^\\n]*\\b' + k + '\\b').test(ga4));
if (pii.length) {
  fail('ANL-08', 'No PII in analytics payloads', `Suspect keys in tracked payload: ${pii.join(', ')}`,
    'Never send citizen contact details or coordinates to an analytics property.');
} else {
  pass('ANL-08', 'No PII in analytics payloads',
    'Tracked events carry category/method/page_path only');
}

// --- the real remaining gap --------------------------------------------
na('ANL-09', 'Data reaches a GA4 property',
  'UNVERIFIABLE from the repository. GTM only forwards to Google Analytics after the container is configured in the GTM UI (Google Analytics > Configuration, or a GA4 Event tag). No tag can be deployed from this codebase.',
  'Requires GTM UI access and a GA4 property ID.');

// --- Search Console verification method ---------------------------------
// HTML tag in index.html only. The file-based token in public/ was removed: two
// methods for one property is another thing to keep in step, and the tag is what
// Google reads off the deployed homepage.
const metaVerify = /<meta\s+name=["']google-site-verification["']\s+content=["'][^"']+["']/.test(html);
if (metaVerify) {
  pass('ANL-10', 'Search Console verification deployed', 'Method: HTML tag in index.html');
} else {
  na('ANL-10', 'Search Console verification',
    'No verification tag in index.html. Verification can also be done via DNS TXT record, which leaves nothing in the repository.',
    'Method not deployed from the codebase');
}

// --- ANL-11: page views come from exactly one source ---------------------
// Google's SPA guide states that enabling GTM's History Change trigger AND
// pushing custom page_view events "can lead to double-counting page views".
// GA4.jsx pushes custom page_view events (option 2), so the container must NOT
// also use History Change. That configuration lives in the GTM UI and cannot be
// read from the repo, so this asserts the code side is unambiguous and records
// which option is active, so nobody adds the other one later.
{
  const ga4 = read('src/components/GA4.jsx');
  const pushesCustom = /event:\s*'page_view'/.test(ga4) && /dataLayer\.push/.test(ga4);
  const docsOption2 = /OPTION 2/.test(ga4);
  const warnsAgainstHistoryChange = /do not add a history change trigger/i.test(ga4);
  // GA4 parameter naming. page_path is the legacy convention; a page view that
  // carries it instead of page_location lands without a usable URL.
  const usesLegacyName = /page_path:\s*payload|page_path:\s*location/.test(ga4);
  const usesGa4Names = /page_location/.test(ga4) && /page_title/.test(ga4);

  const issues = [];
  if (!pushesCustom) issues.push('GA4.jsx no longer pushes a page_view event');
  if (!docsOption2) issues.push('GA4.jsx does not record which documented option is in use');
  if (!warnsAgainstHistoryChange) issues.push('GA4.jsx does not warn against also adding a History Change trigger');
  if (usesLegacyName) issues.push('GA4.jsx still uses the legacy page_path parameter name');
  if (!usesGa4Names) issues.push('GA4.jsx does not send GA4 page_location / page_title');

  issues.length === 0
    ? pass('ANL-11', 'Page views come from exactly one documented source',
        'Custom dataLayer page_view (Google option 2); History Change trigger must NOT also be enabled. ' +
        'GA4 page_location/page_title parameter names in use.')
    : fail('ANL-11', 'Page views come from exactly one documented source', issues.join('; '),
        'Enabling both the History Change trigger and custom page_view events double-counts every navigation.');
}

// --- ANL-12: analytics is not mounted as a page --------------------------
// Reported as a bug: "GA4 is a new page, it should be metadata on the
// homepage". It is neither. Assert it is not a route, and that the container
// snippet is in index.html rather than in a component.
{
  const app = read('src/App.jsx');
  const ga4Route = /path=['"][^'"]*(ga4|analytics)[^'"]*['"]/.test(app);
  const snippetInIndex = /googletagmanager\.com\/gtm\.js/.test(html);
  const snippetInComponent = /googletagmanager\.com\/gtm\.js/.test(
    read('src/components/GA4.jsx'),
  );
  const componentReturnsNull = /return null/.test(read('src/components/GA4.jsx'));

  const issues = [];
  if (ga4Route) issues.push('GA4 appears to be mounted as a route');
  if (!snippetInIndex) issues.push('the GTM snippet is not in index.html');
  if (snippetInComponent) issues.push('GA4.jsx injects a loader; GTM belongs in index.html only');
  if (!componentReturnsNull) issues.push('GA4.jsx does not return null, so it renders markup');

  issues.length === 0
    ? pass('ANL-12', 'Analytics is a loader plus a null-rendering component',
        'Container snippet lives in index.html <head>; GA4.jsx returns null and is not a route')
    : fail('ANL-12', 'Analytics is a loader plus a null-rendering component', issues.join('; '),
        'An SPA has one HTML document, so the snippet belongs in index.html and covers every route.');
}

// --- report --------------------------------------------------------------
const icon = { PASS: 'PASS', FAIL: 'FAIL', 'N/A': 'N/A' };
console.log('\nAnalytics integration check\n');
for (const r of results) {
  console.log(`${icon[r.status]}  ${r.id}  ${r.label}`);
  console.log(`      ${r.detail}`);
  if (r.fix) console.log(`      fix: ${r.fix}`);
  if (r.reason) console.log(`      N/A reason: ${r.reason}`);
}
const fails = results.filter((r) => r.status === 'FAIL').length;
console.log('\n' + '-'.repeat(60));
console.log(`PASS ${results.filter((r) => r.status === 'PASS').length} | FAIL ${fails} | N/A ${results.filter((r) => r.status === 'N/A').length} | ${results.length} checks`);
console.log(fails ? `\nRESULT: ${fails} check(s) FAILED.` : '\nRESULT: analytics wiring is coherent.');
console.log('-'.repeat(60));
process.exit(fails ? 1 : 0);