#!/usr/bin/env node
/**
 * Bundle-splitting regression guard.
 *
 * The bug this prevents: App.jsx imported { FAQS } from ./pages/FAQ to build
 * the FAQPage JSON-LD. That static import pulled the entire FAQ page component
 * into the entry chunk, silently defeating the lazy() route split — the build
 * succeeded and emitted no FAQ-*.js chunk at all, so nothing looked wrong.
 *
 * Run after `npm run build`: node scripts/check-bundles.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const ASSETS = path.join(DIST, 'assets');

const results = [];
const pass = (id, label, detail) => results.push({ id, label, status: 'PASS', detail });
const fail = (id, label, detail, fix) => results.push({ id, label, status: 'FAIL', detail, fix });

if (!fs.existsSync(ASSETS)) {
  console.error('dist/ not found. Run: npm run build');
  process.exit(2);
}

const files = fs.readdirSync(ASSETS);
const js = files.filter((f) => f.endsWith('.js')).map((f) => ({
  name: f,
  bytes: fs.statSync(path.join(ASSETS, f)).size,
}));

const entry = js.find((f) => /^index-[^/]*\.js$/.test(f.name));
const entrySrc = entry ? fs.readFileSync(path.join(ASSETS, entry.name), 'utf8') : '';

// Every lazy() route must exist as its own chunk. If one is missing, it got
// inlined into the entry chunk by a static import somewhere.
const EXPECTED_CHUNKS = [
  'CitizenPortal', 'HowItWorks', 'Methodology', 'FAQ',
  'About', 'Privacy', 'Accessibility', 'MPDashboard', 'MPLogin', 'NotFound',
];

const missing = EXPECTED_CHUNKS.filter((name) => !js.some((f) => f.name.startsWith(name + '-')));
if (missing.length) {
  fail('BND-01', 'Route chunks emitted',
    `No separate chunk for: ${missing.join(', ')}. These routes are being inlined into the entry chunk, so a static import is defeating the lazy() call.`,
    'Import shared data from a module (e.g. src/data/) rather than from the page component.');
} else {
  pass('BND-01', 'Route chunks emitted',
    `All ${EXPECTED_CHUNKS.length} lazy routes have their own chunk`);
}

// Page *markup* must not be in the entry chunk.
//
// Note: FAQ answer strings and the TechArticle headline DO legitimately appear
// in the entry chunk — they are the JSON-LD schema source in App.jsx, which must
// render on every page. So those strings are not valid leak markers; only
// component markup and copy that is not part of the schema are.
const LEAKS = [
  { id: 'Answer centre', label: 'FAQ page hero markup' },
  { id: 'page-hero__lead', label: 'Methodology page markup' },
  { id: 'Priority methodology</h1>', label: 'Methodology H1 markup' },
  { id: 'Samadhan accessibility statement', label: 'Accessibility page H1' },
  { id: 'How grievance information should be handled', label: 'Privacy page H1' },
];
const leaked = LEAKS.filter((l) => entrySrc.includes(l.id));
if (leaked.length) {
  fail('BND-02', 'No page markup in entry chunk',
    `Entry chunk contains page markup: ${leaked.map((l) => l.label).join(', ')}`,
    'Move the shared import to a data module so the page component stays lazy.');
} else {
  pass('BND-02', 'No page markup in entry chunk',
    `None of ${LEAKS.length} page-markup markers appear in the ${(entry.bytes / 1024).toFixed(0)}KB entry chunk ` +
    `(FAQ answers and the TechArticle headline are present by design as schema data)`);
}

// FAQPage schema must still be built from the shared data, not duplicated.
const app = fs.readFileSync(path.join(ROOT, 'src', 'App.jsx'), 'utf8');
const fromData = /import\s*\{\s*FAQS\s*\}\s*from\s*'\.\/data\/faqData'/.test(app);
fromData
  ? pass('BND-03', 'FAQ schema sourced from shared data', 'App.jsx imports FAQS from ./data/faqData')
  : fail('BND-03', 'FAQ schema sourced from shared data',
      'App.jsx does not import FAQS from ./data/faqData',
      'Import { FAQS } from "./data/faqData" rather than from "./pages/FAQ".');

// The data module and the page must agree, or schema drifts from visible copy.
const dataMod = fs.readFileSync(path.join(ROOT, 'src', 'data', 'faqData.js'), 'utf8');
const faqPage = fs.readFileSync(path.join(ROOT, 'src', 'pages', 'FAQ.jsx'), 'utf8');
const dataQs = (dataMod.match(/^\s*q:\s*'/gm) ?? []).length;
const pageUsesData = /from\s*'\.\.\/data\/faqData'/.test(faqPage);
const inlineQs = (faqPage.match(/^\s*q:\s*'/gm) ?? []).length;
if (pageUsesData && inlineQs === 0 && dataQs > 0) {
  pass('BND-04', 'FAQ page and schema share one source',
    `${dataQs} questions defined once in data/faqData.js; FAQ.jsx imports rather than redefining`);
} else {
  fail('BND-04', 'FAQ page and schema share one source',
      `FAQ.jsx inline=${inlineQs}, uses data module=${pageUsesData}, data module has ${dataQs}`,
      'FAQ.jsx must import FAQS from ../data/faqData and not redefine the array.');
}

// Report the split.
const byRoute = js.filter((f) => EXPECTED_CHUNKS.some((n) => f.name.startsWith(n + '-')));
const totalJs = js.reduce((a, b) => a + b.bytes, 0);
const biggest = [...js].sort((a, b) => b.bytes - a.bytes)[0];
pass('BND-05', 'Bundle sizes',
    `entry ${(entry.bytes / 1024).toFixed(0)}KB, ${EXPECTED_CHUNKS.length} route chunks ` +
    `(${byRoute.reduce((a, b) => a + b.bytes, 0) / 1024 | 0}KB), largest ${biggest.name} ` +
    `${(biggest.bytes / 1024).toFixed(0)}KB, total ${(totalJs / 1024).toFixed(0)}KB`);

// --- report ---
for (const r of results) {
  console.log(`${r.status.padEnd(4)} ${r.id}  ${r.label}`);
  console.log(`     ${r.detail}`);
  if (r.fix) console.log(`     fix: ${r.fix}`);
}
const fails = results.filter((r) => r.status === 'FAIL').length;
console.log('\n' + '-'.repeat(60));
console.log(`PASS ${results.length - fails} | FAIL ${fails} | ${results.length} checks`);
console.log('-'.repeat(60));
process.exit(fails ? 1 : 0);