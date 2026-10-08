/**
 * SEO.jsx head-tag behaviour.
 *
 * The defect this locks: index.html ships static description/robots/OG/Twitter
 * tags so non-JS crawlers see them, and SEO.jsx appended a second managed set
 * on hydration. Every page ended up with two of each, which is contradictory
 * markup rather than a progressive fallback.
 *
 * Run: node scripts/audit/seo.test.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeHead } from './dom-shim.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

let passed = 0;
let failed = 0;
const results = [];
const ok = (label, detail) => { passed += 1; results.push({ label, detail, status: 'PASS' }); };
const bad = (label, detail) => { failed += 1; results.push({ label, detail, status: 'FAIL' }); };

/** The static tags index.html actually ships, read from the file. */
function staticTagsFromIndexHtml() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const tags = [];
  for (const m of html.matchAll(/<meta\s+([^>]+?)\/?>/g)) {
    const attrs = {};
    for (const a of m[1].matchAll(/([\w:-]+)\s*=\s*"([^"]*)"/g)) attrs[a[1]] = a[2];
    if (attrs.name || attrs.property) tags.push(['meta', attrs]);
  }
  for (const m of html.matchAll(/<link\s+([^>]+?)\/?>/g)) {
    const attrs = {};
    for (const a of m[1].matchAll(/([\w:-]+)\s*=\s*"([^"]*)"/g)) attrs[a[1]] = a[2];
    if (attrs.rel) tags.push(['link', attrs]);
  }
  return tags;
}

/**
 * Extract the `add` upsert helper from SEO.jsx and run it against a shim DOM.
 * Evaluated as a function body so the test exercises the shipped source rather
 * than a copy that could drift.
 */
function extractAdd(source) {
  const start = source.indexOf('const identityOf');
  const end = source.indexOf('export default function SEO');
  if (start === -1 || end === -1) throw new Error('could not locate the head-tag helpers in SEO.jsx');
  const block = source.slice(start, end);
  // eslint-disable-next-line no-new-func
  return new Function('document', `${block}\nreturn add;`);
}

const seoSource = fs.readFileSync(path.join(ROOT, 'src', 'components', 'SEO.jsx'), 'utf8');
const addSource = extractAdd(seoSource);

const staticTags = staticTagsFromIndexHtml();

// --- 1. the static tags the duplicate bug depends on really exist --------
{
  const names = staticTags.filter(([t]) => t === 'meta').map(([, a]) => a.name || a.property);
  const hasDescription = names.includes('description');
  const hasOg = names.some((n) => String(n).startsWith('og:'));
  hasDescription && hasOg
    ? ok('index.html ships static SEO tags', `${names.length} static head tags, incl. description and og:*`)
    : bad('index.html ships static SEO tags', `found: ${names.join(', ') || 'none'}`);
}

// --- 2. upsert replaces the static tag instead of duplicating it ---------
{
  const doc = makeHead(staticTags);
  const add = addSource(doc);
  add('meta', { name: 'description', content: 'New description' });

  const descriptions = doc.head
    .querySelectorAll('meta')
    .filter((n) => n.getAttribute('name') === 'description');
  descriptions.length === 1
    ? ok('description is replaced, not duplicated',
        `1 meta[name=description] after upsert`)
    : bad('description is replaced, not duplicated',
        `${descriptions.length} meta[name=description] tags after upsert`);
}

// --- 3. every managed tag is unique ---------------------------------------
{
  const doc = makeHead(staticTags);
  const add = addSource(doc);
  add('meta', { name: 'description', content: 'D' });
  add('meta', { name: 'robots', content: 'R' });
  add('meta', { property: 'og:title', content: 'T' });
  add('meta', { property: 'og:image', content: 'I' });
  add('meta', { name: 'twitter:card', content: 'summary_large_image' });
  add('link', { rel: 'canonical', href: 'https://example.test/' });

  const count = (pred) => doc.head.querySelectorAll('meta').concat(doc.head.querySelectorAll('link')).filter(pred).length;
  const dupes = [];
  if (count((n) => n.getAttribute('name') === 'description') !== 1) dupes.push('description');
  if (count((n) => n.getAttribute('property') === 'og:title') !== 1) dupes.push('og:title');
  if (count((n) => n.getAttribute('property') === 'og:image') !== 1) dupes.push('og:image');
  if (count((n) => n.getAttribute('name') === 'twitter:card') !== 1) dupes.push('twitter:card');
  if (count((n) => n.getAttribute('rel') === 'canonical') !== 1) dupes.push('canonical');

  dupes.length === 0
    ? ok('each managed head tag is unique', 'description, robots, og:title, og:image, twitter:card, canonical all single')
    : bad('each managed head tag is unique', `duplicated after upsert: ${dupes.join(', ')}`);
}

// --- 4. two upserts in a row do not accumulate ---------------------------
{
  const doc = makeHead([]);
  const add = addSource(doc);
  add('meta', { property: 'og:title', content: 'First' });
  add('meta', { property: 'og:title', content: 'Second' });
  const titles = doc.head.querySelectorAll('meta').filter((n) => n.getAttribute('property') === 'og:title');
  titles.length === 1 && titles[0].getAttribute('content') === 'Second'
    ? ok('repeated upsert keeps one element', 'second call replaced the first, content is "Second"')
    : bad('repeated upsert keeps one element',
        `${titles.length} og:title tags, content="${titles[0]?.getAttribute('content')}"`);
}

// --- 5. unrelated tags are left alone ------------------------------------
{
  const doc = makeHead([]);
  const add = addSource(doc);
  add('meta', { name: 'googlebot', content: 'index, follow' });
  add('meta', { name: 'description', content: 'D' });
  const googlebots = doc.head.querySelectorAll('meta').filter((n) => n.getAttribute('name') === 'googlebot');
  googlebots.length === 1
    ? ok('different identities do not collide', 'meta[name=googlebot] survives alongside meta[name=description]')
    : bad('different identities do not collide', `${googlebots.length} googlebot tags`);
}

// --- report ---
for (const r of results) {
  console.log(`${r.status.padEnd(4)} ${r.label}`);
  console.log(`     ${r.detail}`);
}
console.log('\n' + '-'.repeat(60));
console.log(`${passed} passed, ${failed} failed`);
console.log('-'.repeat(60));
process.exit(failed ? 1 : 0);