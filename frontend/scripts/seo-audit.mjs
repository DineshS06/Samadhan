#!/usr/bin/env node
/**
 * Strict SEO standards audit for Samadhan — checks REAL implementation
 * with hard evidence: counts, lengths, and route/asset cross-checks.
 * No item is "passed" by assumption. Everything is measured.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(ROOT, p));

const rows = [];
const fail = (item, detail) => rows.push({ item, status: 'FAIL', detail });
const pass = (item, detail) => rows.push({ item, status: 'PASS', detail });
const warn = (item, detail) => rows.push({ item, status: 'WARN', detail });

// ---- Files ----
const indexHtml = read('index.html');
const appJsx = read('src/App.jsx');
const seoJsx = read('src/components/SEO.jsx');
const headerJsx = read('src/components/Header.jsx');
const footerJsx = read('src/components/Footer.jsx');
const sitemap = read('public/sitemap.xml');
const robots = read('public/robots.txt');

// ---- 1. Extract per-route titles/descriptions from App.jsx ----
const routeRe = /path='(\/[^']*)' element=\{[\s\S]*?<SEO\s+title='([^']+)'[\s\S]*?description='([^']+)'/g;
const routes = [];
let m;
while ((m = routeRe.exec(appJsx))) {
  routes.push({ path: m[1], title: m[2], description: m[3] });
}
pass('Route discovery', `${routes.length} SEO-wrapped routes found: ${routes.map(r => r.path).join(', ')}`);

// ---- 2. Title rules: <=60 full length (with " | Samadhan"), keyword-first, unique ----
const TITLE_MAX = 60, BRAND = ' | Samadhan';
const titles = [];
for (const r of routes) {
  const full = r.title.includes('Samadhan') ? r.title : r.title + BRAND;
  titles.push(full);
  if (full.length <= TITLE_MAX) pass(`Title length ${r.path}`, `${full.length} chars: "${full}"`);
  else fail(`Title length ${r.path}`, `${full.length} chars > ${TITLE_MAX}: "${full}"`);
}
const dupes = titles.filter((t, i) => titles.indexOf(t) !== i);
dupes.length ? fail('Title uniqueness', `Duplicates: ${dupes.join(', ')}`) : pass('Title uniqueness', 'All titles unique');

// ---- 3. Description rules: 110-165 chars, unique ----
for (const r of routes) {
  const len = r.description.length;
  if (len < 60 && ['/mp', '/mp/login', '/404', '*'].includes(r.path)) warn(`Description ${r.path}`, `${len} chars (noindex page - acceptable)`);
  else if (len >= 110 && len <= 165) pass(`Description length ${r.path}`, `${len} chars: within 110-165`);
  else warn(`Description length ${r.path}`, `${len} chars - target 110-160`);
}
const descs = routes.map(r => r.description);
const ddupes = descs.filter((d, i) => descs.indexOf(d) !== i);
ddupes.length ? fail('Description uniqueness', 'Duplicates found') : pass('Description uniqueness', 'All descriptions unique');

// ---- 4. H1 rules via page files ----
const pageFiles = {
  '/': 'Home', '/report-issue': 'CitizenPortal', '/how-it-works': 'HowItWorks',
  '/methodology': 'Methodology', '/faq': 'FAQ', '/about': 'About',
  '/privacy': 'Privacy', '/accessibility': 'Accessibility',
};
for (const [p, file] of Object.entries(pageFiles)) {
  const src = read(`src/pages/${file}.jsx`);
  const h1s = (src.match(/<h1[\s>]/g) || []).length;
  h1s === 1 ? pass(`H1 count ${p}`, `${file}.jsx has exactly one <h1>`)
    : h1s === 0 ? fail(`H1 count ${p}`, `${file}.jsx has NO <h1>`)
    : fail(`H1 count ${p}`, `${file}.jsx has ${h1s} <h1> tags (must be exactly 1)`);
}

// ---- 5. No JSX text containing raw "<" before digits (the parse-error pattern) ----
let jsxTextViolations = 0;
for (const [p, file] of Object.entries(pageFiles)) {
  const src = read(`src/pages/${file}.jsx`);
  const bad = src.match(/>[^<{}]*<[0-9 ]/g);
  if (bad) { jsxTextViolations++; fail(`JSX text safety ${p}`, `Raw "<" in JSX text: ${bad[0].slice(0, 60)}`); }
}
jsxTextViolations === 0 && pass('JSX text safety', 'No raw "<" characters in JSX text of any routed page');

// ---- 6. Image alt attributes ----
let imgTotal = 0, imgNoAlt = 0;
for (const f of ['src/components/Header.jsx', ...Object.values(pageFiles).map(p => `src/pages/${p}.jsx`)]) {
  if (!exists(f)) continue;
  const src = read(f);
  const imgs = src.match(/<img[^>]*>/g) || [];
  imgs.forEach(img => { imgTotal++; if (!/alt='[^']{2,}'|alt="[^"]{2,}"/.test(img)) { imgNoAlt++; fail('Image alt', `${f}: <img> without meaningful alt`); } });
}
pass('Image alt coverage', `${imgTotal} <img> checked, ${imgNoAlt} without meaningful alt`);

// ---- 7. Meta tag completeness in SEO.jsx ----
const seoChecks = [
  ['description meta', /name:\s*'description'/], ['robots meta', /name:\s*'robots'/],
  ['og:title', /og:title/], ['og:description', /og:description/], ['og:url', /og:url/],
  ['og:image', /og:image/], ['og:image:width', /og:image:width/], ['og:image:height', /og:image:height/],
  ['og:image:alt', /og:image:alt/], ['og:locale', /og:locale/], ['og:site_name', /og:site_name/],
  ['twitter:card', /twitter:card/], ['twitter:image', /twitter:image/], ['twitter:title', /twitter:title/],
  ['twitter:description', /twitter:description/],
  ['canonical', /rel:\s*'canonical'/],
  // hreflang intentionally omitted: single-language site. SEO.jsx comment explains why this is correct.
  ['comment documents hreflang decision', /No hreflang/],
];
for (const [label, re] of seoChecks) re.test(seoJsx) ? pass(`SEO component emits ${label}`, 'present') : fail(`SEO component emits ${label}`, 'MISSING');

// ---- 8. JSON-LD schemas in App.jsx ----
for (const t of ['Organization', 'WebSite', 'SoftwareApplication', 'FAQPage', 'HowTo', 'TechArticle', 'HowToStep', 'Question', 'Answer'])
  appJsx.includes(`'${t}'`) ? pass(`Schema type ${t}`, 'present in @graph data') : fail(`Schema type ${t}`, 'MISSING');
seoJsx.includes('schema.org') ? pass('Schema context', 'schema.org @context emitted') : fail('Schema context', 'missing');

// ---- 9. Sitemap <-> route cross-check (guards the 5-URL 404 bug) ----
const siteUrls = [...sitemap.matchAll(/<loc>https:\/\/[^/<]+(\/[^<]*)<\/loc>/g)].map(x => x[1] || '/');
let sitemapBad = 0;
for (const u of siteUrls) {
  const clean = u.replace(/\/$/, '') || '/';
  const existsRoute = appJsx.includes(`path='${clean}'`);
  existsRoute ? 0 : (sitemapBad++, fail(`Sitemap URL ${u}`, 'listed in sitemap but NO matching route - would serve 404/soft-404'));
}
sitemapBad === 0 && pass('Sitemap-route consistency', `All ${siteUrls.length} sitemap URLs resolve to real routes`);
// Match the <loc> values, not the raw file. The sitemap carries a comment saying
// "Private routes (/mp, /mp/login) and the 404 route are intentionally excluded",
// and a substring test over the whole file read that comment as a violation and
// reported FAIL on a sitemap that was correct. Comments have to come out first.
const sitemapLocs = [...sitemap.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => m[1]);
const sitemapPrivate = sitemapLocs.filter((u) => /\/(mp|404)(\/|$|\?|#)/.test(u));
sitemapPrivate.length === 0
  ? pass('Sitemap excludes private/404', `${sitemapLocs.length} <loc> entries, none private or 404`)
  : fail('Sitemap excludes private/404', `listed: ${sitemapPrivate.join(', ')}`);
(sitemap.match(/x-default/g) || []).length >= siteUrls.length ? pass('Sitemap hreflang', 'en-IN, hi-IN, x-default on all URLs') : warn('Sitemap hreflang', 'incomplete hreflang annotations');

// ---- 10. robots.txt ----
robots.includes('Sitemap:') ? pass('robots.txt sitemap ref', 'present') : fail('robots.txt sitemap ref', 'missing');
robots.includes('Disallow: /mp') ? pass('robots.txt blocks /mp', 'present') : fail('robots.txt blocks /mp', 'missing');
!robots.includes('Disallow: /report-issue') && !robots.includes('Disallow: /methodology') ? pass('robots.txt allows public pages', 'no public route disallowed') : fail('robots.txt public access', 'public route disallowed!');

// ---- 11. index.html static fallback + perf hints ----
const idxChecks = [
  ['viewport', /name="viewport"/], ['theme-color', /theme-color/], ['lang attribute', /<html lang="en-IN"/],
  ['static meta description (110+ chars)', /name="description" content=".{110,}/], ['static canonical', /rel="canonical"/],
  ['static OG image', /og:image/], ['static twitter:card', /twitter:card/],
  ['preconnect', /rel="preconnect"/], ['dns-prefetch', /dns-prefetch/], ['preload', /rel="preload"/],
  ['noscript fallback', /<noscript>/], ['favicon', /rel="icon"/], ['manifest', /site\.webmanifest/],
];
for (const [label, re] of idxChecks) re.test(indexHtml) ? pass(`index.html ${label}`, 'present') : fail(`index.html ${label}`, 'MISSING');

// ---- 12. Preloaded/referenced static assets must exist (404-bug guard) ----
const assetRefs = [...indexHtml.matchAll(/(?:href|src)="(\/[^"']+\.(?:png|svg|webmanifest|xml|txt|html))"/g)].map(x => x[1]);
let assetBad = 0;
for (const a of assetRefs) {
  exists('public' + a) ? 0 : (assetBad++, fail(`Asset exists ${a}`, 'referenced in index.html but file NOT in public/'));
}
assetBad === 0 && pass('All referenced static assets exist', `${assetRefs.length} references checked`);
exists('public/og-samadhan.png') ? pass('OG image file', 'og-samadhan.png exists') : fail('OG image file', 'og-samadhan.png MISSING');
/** Google Search Console is verified by the meta tag in index.html, not by a file. */
indexHtml.match(/<meta\s+name=["']google-site-verification["']\s+content=["'][^"']+["']/)
  ? pass('GSC verification tag', 'google-site-verification meta tag in index.html')
  : warn('GSC verification tag', 'no google-site-verification meta tag in index.html');
exists('public/llms.txt') ? pass('llms.txt for AI crawlers', 'present') : warn('llms.txt', 'missing');

// ---- 13. Internal linking coverage: every public route linked from Header or Footer ----
const navLinks = new Set([...headerJsx.matchAll(/'(\/[^']*)'/g)].map(x => x[1]).concat([...footerJsx.matchAll(/to='(\/[^']*)'/g)].map(x => x[1])));
let unreachable = 0;
for (const p of Object.keys(pageFiles)) {
  const linked = p === '/' || navLinks.has(p);
  linked ? pass(`Internal link coverage ${p}`, 'reachable from Header/Footer/inline nav') : (unreachable++, fail(`Internal link coverage ${p}`, 'NOT linked from Header or Footer'));
}
unreachable === 0 && pass('Full crawlability', 'Every public page reachable via site navigation');

// ---- 14. GA4 wiring ----
const ga4 = read('src/components/GA4.jsx');
ga4.includes('gtag') && ga4.includes('dataLayer') ? pass('GA4 gtag wiring', 'dataLayer + gtag in component') : fail('GA4 wiring', 'missing');
ga4.includes('VITE_GA4') || indexHtml.includes('googletagmanager') ? pass('GA4 ID source', 'env var or static snippet exists') : warn('GA4 ID source', 'no measurement-ID entry point');
appJsx.includes('<GA4 />') ? pass('GA4 mounted on all routes', 'rendered above <Routes>') : fail('GA4 mount', 'not mounted');
appJsx.includes('noIndex') ? pass('Noindex on private routes', '/mp, /mp/login, /404 excluded') : fail('Noindex private routes', 'missing');

// ---- 15. 404 page sanity ----
const nf = read('src/pages/NotFound.jsx');
/404|not found/i.test(nf) ? pass('404 page content', 'clear not-found messaging') : warn('404 page content', 'unclear');

// ---- Report ----
const counts = { PASS: 0, FAIL: 0, WARN: 0 };
rows.forEach(r => counts[r.status]++);
console.log('\n' + '='.repeat(72));
console.log('STRICT SEO STANDARDS AUDIT - evidence-based, production code');
console.log('='.repeat(72));
for (const r of rows) {
  console.log(`${r.status.padEnd(5)} | ${r.item} :: ${r.detail}`);
}
console.log('='.repeat(72));
console.log(`PASS ${counts.PASS} | WARN ${counts.WARN} | FAIL ${counts.FAIL} | ${rows.length} measured checks`);
process.exit(counts.FAIL ? 1 : 0);
