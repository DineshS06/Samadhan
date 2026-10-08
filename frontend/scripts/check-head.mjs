/**
 * index.html <head> hygiene.
 *
 * Guards the head-level SEO claims that are easy to assert and easy to get
 * wrong: title/description limits, a self-referencing hreflang, obsolete
 * browser hints, and duplicate tags.
 *
 * Run: node scripts/check-head.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

const results = [];
const pass = (id, label, detail) => results.push({ id, label, status: 'PASS', detail });
const fail = (id, label, detail, fix) => results.push({ id, label, status: 'FAIL', detail, fix });

const comments = html.replace(/<!--[\s\S]*?-->/g, '');
const attrsOf = (tag) => {
  const o = {};
  for (const m of tag.matchAll(/([\w:-]+)\s*=\s*"([^"]*)"/g)) o[m[1]] = m[2];
  return o;
};
const metas = [...comments.matchAll(/<meta\b[^>]*>/g)].map((m) => attrsOf(m[0]));
const links = [...comments.matchAll(/<link\b[^>]*>/g)].map((m) => attrsOf(m[0]));
const byName = (n) => metas.filter((m) => m.name === n);
const byProperty = (p) => metas.filter((m) => m.property === p);

// --- HEAD-01: title within the search-display limit ---------------------
{
  const title = /<title>([\s\S]*?)<\/title>/.exec(comments)?.[1].trim() ?? '';
  title.length > 0 && title.length <= 70
    ? pass('HEAD-01', 'Title length', `${title.length}/70 chars`)
    : fail('HEAD-01', 'Title length', `${title.length} chars`, 'Google truncates past 60-70.');
}

// --- HEAD-02: description within limits --------------------------------
{
  const desc = byName('description')[0]?.content ?? '';
  desc.length >= 120 && desc.length <= 320
    ? pass('HEAD-02', 'Meta description length', `${desc.length}/320 chars`)
    : fail('HEAD-02', 'Meta description length', `${desc.length} chars`, 'Aim for 150-200.');
}

// --- HEAD-03: no duplicate identity tags --------------------------------
{
  const dupes = [];
  for (const n of new Set(metas.map((m) => m.name).filter(Boolean))) {
    if (byName(n).length > 1) dupes.push(`meta[name=${n}] x${byName(n).length}`);
  }
  for (const p of new Set(metas.map((m) => m.property).filter(Boolean))) {
    if (byProperty(p).length > 1) dupes.push(`meta[property=${p}] x${byProperty(p).length}`);
  }
  for (const r of new Set(links.map((l) => l.rel).filter(Boolean))) {
    const n = links.filter((l) => l.rel === r && (r === 'canonical' || r === 'alternate')).length;
    if (n > 1) dupes.push(`link[rel=${r}] x${n}`);
  }
  dupes.length === 0
    ? pass('HEAD-03', 'No duplicate head tags',
        `${metas.length} meta, ${links.length} link, all identities unique`)
    : fail('HEAD-03', 'No duplicate head tags', dupes.join('; '),
        'Two tags with the same identity are contradictory, not a fallback.');
}

// --- HEAD-04: no hreflang without real localized pages -------------------
{
  const alternates = links.filter((l) => l.rel === 'alternate' && l.hreflang);
  const langs = new Set(alternates.map((l) => l.hreflang));
  alternates.length === 0
    ? pass('HEAD-04', 'hreflang matches reality',
        'No hreflang emitted, correct for a single-language site')
    : langs.size < 2
      ? fail('HEAD-04', 'hreflang matches reality',
          `only one locale declared: ${[...langs].join(', ')}`,
          'A lone hreflang needs an x-default; omit both until localized pages exist.')
      : pass('HEAD-04', 'hreflang matches reality', `${langs.size} locales declared`);
}

// --- HEAD-05: no obsolete browser hints ---------------------------------
{
  const legacy = metas.filter((m) => (m['http-equiv'] || '').toUpperCase() === 'X-UA-COMPATIBLE');
  legacy.length === 0
    ? pass('HEAD-05', 'No obsolete browser hints', 'no X-UA-Compatible')
    : fail('HEAD-05', 'No obsolete browser hints', 'X-UA-Compatible present',
        'It only ever affected Internet Explorer.');
}

// --- HEAD-06: analytics loader appears once ------------------------------
{
  const gtmScripts = [...html.matchAll(/googletagmanager\.com\/gtm\.js/g)].length;
  const gtagScripts = [...html.matchAll(/googletagmanager\.com\/gtag\/js/g)].length;
  const noscript = [...html.matchAll(/googletagmanager\.com\/ns\.html/g)].length;
  gtmScripts === 1 && gtagScripts === 0 && noscript === 1
    ? pass('HEAD-06', 'Single analytics loader',
        `1 GTM snippet, 0 direct gtag.js, 1 noscript iframe`)
    : fail('HEAD-06', 'Single analytics loader',
        `gtm.js=${gtmScripts}, gtag/js=${gtagScripts}, ns.html=${noscript}`,
        'Loading GTM and gtag.js together double-counts every page view.');
}

// --- HEAD-07: the GTM container id agrees across the tree ----------------
{
  const ids = new Set([...html.matchAll(/GTM-[A-Z0-9]+/g)].map((m) => m[0]));
  const ga4 = fs.existsSync(path.join(ROOT, 'src', 'components', 'GA4.jsx'))
    ? fs.readFileSync(path.join(ROOT, 'src', 'components', 'GA4.jsx'), 'utf8')
    : '';
  const fromCode = [...ga4.matchAll(/GTM-[A-Z0-9]+/g)].map((m) => m[0]);
  const all = new Set([...ids, ...fromCode]);
  all.size === 1
    ? pass('HEAD-07', 'One GTM container id', [...all][0])
    : fail('HEAD-07', 'One GTM container id', [...all].join(', '),
        'Two container ids means data is split across properties.');
}

// --- HEAD-08: viewport and charset are declared first -------------------
{
  const hasViewport = metas.some((m) => m.name === 'viewport' && /width=device-width/.test(m.content ?? ''));
  const hasCharset = /<meta\s+charset=/i.test(comments);
  const viewportIdx = comments.indexOf('name="viewport"');
  const charsetIdx = comments.search(/<meta\s+charset=/i);
  hasViewport && hasCharset && charsetIdx < viewportIdx
    ? pass('HEAD-08', 'Charset precedes viewport',
        `charset at ${charsetIdx}, viewport at ${viewportIdx}`)
    : fail('HEAD-08', 'Charset precedes viewport',
        `charset=${hasCharset}, viewport=${hasViewport}, order ok=${charsetIdx < viewportIdx}`,
        'Charset must be within the first 1024 bytes.');
}

// --- HEAD-09: site verification tag present -----------------------------
{
  const gsv = byName('google-site-verification');
  gsv.length === 1
    ? pass('HEAD-09', 'Search Console verification tag', `1 tag, ${gsv[0].content.slice(0, 12)}...`)
    : fail('HEAD-09', 'Search Console verification tag',
        gsv.length === 0 ? 'absent' : `${gsv.length} tags`, 'Exactly one is required.');
}

// --- report ---
for (const r of results) {
  console.log(`${r.status.padEnd(4)} ${r.id}  ${r.label}`);
  console.log(`     ${r.detail}`);
  if (r.fix) console.log(`     fix: ${r.fix}`);
}
const fails = results.filter((r) => r.status === 'FAIL').length;
console.log('\n' + '-'.repeat(60));
console.log(`PASS ${results.filter((r) => r.status === 'PASS').length} | FAIL ${fails} | ${results.length} checks`);
console.log('-'.repeat(60));
process.exit(fails ? 1 : 0);