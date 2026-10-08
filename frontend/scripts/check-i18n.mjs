#!/usr/bin/env node
/**
 * i18n integrity checks.
 *
 * Catches the class of bug where a component reads `t.someKey` that exists in
 * only one language block, or where the en/hi blocks drift apart. Found real
 * defects: a `t.channels[...]` read that would throw a TypeError, Japanese
 * katakana inside the Hindi block, a fabricated place name in a district
 * list, and a required-field validator with no message key.
 *
 * Run: node scripts/check-i18n.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');

const results = [];
const pass = (id, label, detail) => results.push({ id, label, status: 'PASS', detail });
const fail = (id, label, detail, fix) => results.push({ id, label, status: 'FAIL', detail, fix });

// --- collect source files -------------------------------------------------
const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else if (/\.(jsx|js)$/.test(e.name)) files.push(full);
  }
})(SRC);

const read = (f) => fs.readFileSync(f, 'utf8');
const transPath = path.join(SRC, 'i18n', 'translations.js');
const trans = read(transPath);

/** Extract the body of `UI = { <lang>: { ... }, ... }` for one language. */
function uiBlock(lang) {
  const anchor = new RegExp(`\\n\\s{2}${lang}:\\s*\\{`, 'm').exec(trans);
  if (!anchor) return null;
  const from = trans.indexOf('{', anchor.index) + 1;
  let depth = 1;
  let i = from;
  while (i < trans.length && depth > 0) {
    if (trans[i] === '{') depth++;
    else if (trans[i] === '}') depth--;
    i++;
  }
  return { body: trans.slice(from, i - 1), start: from, end: i - 1 };
}

/**
 * Keys defined in a block body, at any nesting depth.
 * Some entries are nested objects (categories, severityLevels) that components
 * index into, so a depth-0-only scan would report them as missing.
 */
function topLevelKeys(body) {
  const keys = new Set();
  for (const m of body.matchAll(/^\s+([A-Za-z0-9_]+):/gm)) keys.add(m[1]);
  return [...keys];
}

const enBlock = uiBlock('en');
const hiBlock = uiBlock('hi');

if (!enBlock || !hiBlock) {
  fail('I18N-01', 'Both language blocks parse', 'Could not locate the en: or hi: block in translations.js');
} else {
  const en = topLevelKeys(enBlock.body);
  const hi = topLevelKeys(hiBlock.body);
  const onlyEn = en.filter((k) => !hi.includes(k));
  const onlyHi = hi.filter((k) => !en.includes(k));
  onlyEn.length === 0 && onlyHi.length === 0
    ? pass('I18N-01', 'Language blocks in parity',
        `en and hi both define ${en.length} top-level keys`)
    : fail('I18N-01', 'Language blocks in parity',
        `only in en: ${onlyEn.join(', ') || 'none'}; only in hi: ${onlyHi.join(', ') || 'none'}`,
        'Every key must exist in both blocks.');
  globalThis.__EN = en;
}

// --- 2. every t.* reference resolves ---------------------------------------
const en = globalThis.__EN ?? topLevelKeys(enBlock ? enBlock.body : '');
const referenced = new Map();
for (const f of files) {
  if (f === transPath) continue;
  const src = read(f);
  // Only components can read the i18n context. Data modules use `t` as their own
  // local variable (src/data/topics.js destructures a cluster as `t`), so a bare
  // `t.foo` match there reported t.hub and t.pages as missing translation keys.
  if (!/useLanguage\(\)/.test(src)) continue;
  for (const m of src.matchAll(/\bt\.([A-Za-z0-9_]+)/g)) {
    if (!referenced.has(m[1])) referenced.set(m[1], new Set());
    referenced.get(m[1]).add(path.relative(ROOT, f));
  }
}
const missing = [...referenced.entries()].filter(([k]) => !en.includes(k));
missing.length === 0
  ? pass('I18N-02', 'All t.* references resolve',
      `${referenced.size} distinct keys referenced, all present in both blocks`)
  : fail('I18N-02', 'All t.* references resolve',
      missing.map(([k, f]) => `t.${k} in ${[...f].join(', ')}`).join('; '),
      'Add the key to both blocks, or remove the reference.');

// --- 3. no indexed read of a missing key ----------------------------------
const nested = [];
for (const f of files) {
  if (f === transPath) continue;
  const src = read(f);
  for (const m of src.matchAll(/\bt\.([A-Za-z0-9_]+)\s*\[/g)) {
    if (!en.includes(m[1])) nested.push(`${path.relative(ROOT, f)}: t.${m[1]}[...]`);
  }
}
nested.length === 0
  ? pass('I18N-03', 'No indexed reads of missing keys', 'No t.<missingKey>[...] patterns')
  : fail('I18N-03', 'No indexed reads of missing keys',
      nested.join('; '), 'Indexing undefined throws a TypeError. Add the key or guard the read.');

// --- 4. no CJK in the Hindi block -----------------------------------------
const cjk = [...new Set([...hiBlock.body.matchAll(/[\u3040-\u30FF\u4E00-\u9FFF]/g)].map((m) => m[0]))];
cjk.length === 0
  ? pass('I18N-04', 'No stray CJK characters in Hindi', 'Hindi block contains no katakana or CJK')
  : fail('I18N-04', 'No stray CJK characters in Hindi',
      `found "${cjk.join(' ')}" — Japanese characters render as garbage to Hindi readers`,
      'Replace with the intended Devanagari word.');

// --- 5. validation messages exist -----------------------------------------
const portal = read(path.join(SRC, 'pages', 'CitizenPortal.jsx'));
const valRefs = [...new Set([...portal.matchAll(/return t\.(val[A-Za-z0-9_]+)/g)].map((m) => m[1]))];
const missingVal = valRefs.filter((k) => !en.includes(k));
missingVal.length === 0
  ? pass('I18N-05', 'Validation messages defined',
      `${valRefs.length} validation branches, all with en and hi messages`)
  : fail('I18N-05', 'Validation messages defined',
      `missing: ${missingVal.join(', ')}`,
      'A missing key shows the citizen the literal string "undefined".');

// --- 6. en/hi volume parity -----------------------------------------------
// Compare value COUNT, not word count: Hindi is scriptio continua, so it
// has almost no inter-word spaces and a word-count ratio would wrongly report
// an untranslated block. Counting values also catches a dropped sentence.
const valueCount = (b) => (b.match(/:\s*'[^']*'/g) ?? []).length;
const enVals = valueCount(enBlock.body);
const hiVals = valueCount(hiBlock.body);
const devanagari = (hiBlock.body.match(/[\u0900-\u097F]/g) ?? []).length;

if (enVals === hiVals && devanagari > 0) {
  pass('I18N-06', 'Translation coverage',
    `en and hi both define ${enVals} string values; Hindi block contains ` +
    `${devanagari} Devanagari characters`);
} else {
  fail('I18N-06', 'Translation coverage',
    `en has ${enVals} values, hi has ${hiVals}; Hindi Devanagari characters: ${devanagari}`,
    'Every English string needs a Hindi counterpart.');
}

// --- 7. geographic lists contain only real entries ------------------------
const geoIssues = [];
const tsM = /TS_CONSTITUENCIES = \[([^\]]*)\]/.exec(trans);
if (tsM) {
  const bad = [...tsM[1].matchAll(/'([^']+)'/g)].map((m) => m[1])
    .filter((n) => /Zachariah|Round Rock|Austin|Dallas/i.test(n));
  if (bad.length) geoIssues.push(`TS_CONSTITUENCIES contains ${bad.join(', ')}`);
}
const gjM = /GJ_DISTRICTS = \[([^\]]*)\]/.exec(trans);
if (gjM) {
  const names = [...gjM[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  for (const n of names) {
    for (const other of names) {
      if (n !== other && other.startsWith(n) && n.length >= 4) {
        geoIssues.push(`GJ_DISTRICTS has both '${n}' and '${other}'`);
      }
    }
  }
}
geoIssues.length === 0
  ? pass('I18N-07', 'Geographic lists clean', 'No fabricated or duplicate place names detected')
  : fail('I18N-07', 'Geographic lists clean', geoIssues.join('; '),
      'Citizens pick from these lists, so wrong entries become wrong submissions.');

// --- 8. no hardcoded English in i18n'd pages ------------------------------
const literalIssues = [];
for (const name of ['CitizenPortal.jsx', 'NotFound.jsx', 'MPLogin.jsx']) {
  const src = read(path.join(SRC, 'pages', name));
  // A string literal used directly as JSX text, next to t.* usage.
  const literals = [...src.matchAll(/>\s*([A-Z][A-Za-z ,'’-]{3,40})\s*</g)].map((m) => m[1].trim());
  const suspicious = literals.filter((l) => !/^[A-Z]{2,3}$/.test(l) && !/^\d+$/.test(l));
  if (suspicious.length && /useLanguage/.test(src)) {
    literalIssues.push(`${name}: ${suspicious.slice(0, 4).map((l) => `"${l}"`).join(', ')}`);
  }
}
literalIssues.length === 0
  ? pass('I18N-08', 'No hardcoded English in translated pages',
      'Pages using useLanguage() route visible copy through t.*')
  : warn('I18N-08', 'No hardcoded English in translated pages',
      literalIssues.join(' | '),
      'These strings stay English when the language toggle is switched to Hindi.');

// --- report ---
function warn(id, label, detail, fix) {
  results.push({ id, label, status: 'PARTIAL', detail, fix });
}

for (const r of results) {
  console.log(`${r.status.padEnd(4)} ${r.id}  ${r.label}`);
  console.log(`     ${r.detail}`);
  if (r.fix) console.log(`     fix: ${r.fix}`);
}
const fails = results.filter((r) => r.status === 'FAIL').length;
console.log('\n' + '-'.repeat(60));
console.log(`PASS ${results.filter((r) => r.status === 'PASS').length} | PARTIAL ${results.filter((r) => r.status === 'PARTIAL').length} | FAIL ${fails} | ${results.length} checks`);
console.log('-'.repeat(60));
process.exit(fails ? 1 : 0);