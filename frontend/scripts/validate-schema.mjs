#!/usr/bin/env node
/**
 * Structured data validation — measures the JSON-LD the app actually emits.
 *
 * Replaces the previous version, which printed "✅ Structured Data Validation
 * Complete!" unconditionally after printing a wall of ❌, and always exited 0.
 * This version reads the schema definitions from App.jsx (where they live),
 * checks them against the Google Rich Results required/recommended properties,
 * and fails the build when required properties are missing.
 *
 * Scope limit, stated plainly: this is a static source check. It cannot
 * confirm rich-result eligibility, which requires the Google Rich Results Test
 * or Schema.org Validator. Those remain unverified here.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

const app = read('src/App.jsx');

/**
 * Source with comments removed.
 *
 * Checks below look for literal type names such as 'BreadcrumbList'. Matching
 * raw source lets a prose comment satisfy the check, which is how this file
 * once reported "Present in the @graph" while emitting nothing.
 */
const noComments = (src) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/^\s*\/\/.*$/gm, ' ')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ');

const appNow = noComments(app);
const seo = read('src/components/SEO.jsx');

const results = [];
const pass = (label, detail) => results.push({ label, status: 'PASS', detail });
const fail = (label, detail, remediation) => results.push({ label, status: 'FAIL', detail, remediation });
const warn = (label, detail) => results.push({ label, status: 'PARTIAL', detail });
const na = (label, detail, reason) => results.push({ label, status: 'N/A', detail, reason });

console.log('Structured data validation (source-level)\n');

// --- 1. Emission plumbing -------------------------------------------------
// SEO.jsx builds tags via the `add(tag, attrs, text)` helper, so the script
// type is an attribute value rather than a literal <script type="...">.
const ldEmit = /add\(\s*['"]script['"]\s*,\s*\{[^}]*type:\s*['"]application\/ld\+json['"][^}]*\}/.test(seo);
ldEmit
  ? pass('JSON-LD script tag', "SEO.jsx emits add('script', { type: 'application/ld+json' }, ...)")
  : fail('JSON-LD script tag', 'No application/ld+json script emitted', 'Add the JSON-LD script in SEO.jsx');

/JSON\.stringify\(\{[\s\S]*?'@context':\s*'https:\/\/schema\.org'/.test(seo)
  ? pass('@context', 'https://schema.org declared on the @graph wrapper')
  : fail('@context', 'Missing or malformed schema.org @context', 'Set @context to https://schema.org');

// noIndex routes must not emit schema
if (/!noIndex && schema\.length/.test(seo)) {
  pass('noindex suppression', 'Schema is suppressed on noIndex routes');
} else {
  warn('noindex suppression', 'Could not confirm schema is suppressed on noIndex routes');
}

// --- 2. Types actually defined -------------------------------------------
const TYPES = ['Organization', 'WebSite', 'SoftwareApplication', 'FAQPage', 'HowTo', 'TechArticle', 'HowToStep', 'Question', 'Answer'];
const found = TYPES.filter((t) => app.includes(`'${t}'`));
const missing = TYPES.filter((t) => !found.includes(t));

found.length === TYPES.length
  ? pass('Schema types defined', `All present: ${found.join(', ')}`)
  : fail('Schema types defined', `Missing: ${missing.join(', ')}`, 'Define the missing types or drop them from this expectation list.');

// --- 3. Required properties per type -------------------------------------
/** property must appear somewhere in App.jsx */
const has = (prop) => app.includes(prop);

const ORG_REQUIRED = ['@id', 'name', 'url', 'logo'];
const ORG_RECOMMENDED = ['description', 'sameAs'];
const missingOrgReq = ORG_REQUIRED.filter((p) => !has(p));
const missingOrgRec = ORG_RECOMMENDED.filter((p) => !has(p));

missingOrgReq.length === 0
  ? pass('Organization required properties', ORG_REQUIRED.join(', '))
  : fail('Organization required properties', `Missing: ${missingOrgReq.join(', ')}`, 'Add the missing required properties to the org node.');

missingOrgRec.length === 0
  ? pass('Organization recommended properties', ORG_RECOMMENDED.join(', '))
  : warn('Organization recommended properties', `Missing: ${missingOrgRec.join(', ')}`, 'sameAs links the entity to other profiles; description helps entity understanding.');

// sameAs values must be real profiles, not placeholders
const sameAs = /sameAs:\s*\[([^\]]*)\]/.exec(app);
if (sameAs) {
  const urls = sameAs[1].split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
  const placeholders = urls.filter((u) => /example\.com|example\.org|twitter\.com\/[a-z]+$|github\.com\/[a-z]+$/i.test(u));
  placeholders.length
    ? fail('Organization sameAs targets', `Unverifiable profile URLs: ${placeholders.join(', ')}`,
        'Point sameAs at profiles the project actually controls, or remove the field. Unverifiable sameAs is a spam signal.')
    : pass('Organization sameAs targets', `${urls.length} profile URL(s) look like real profiles`);
} else {
  warn('Organization sameAs targets', 'No sameAs declared');
}

// WebSite
const WS_REQUIRED = ['@id', 'name', 'url', 'publisher'];
const missingWs = WS_REQUIRED.filter((p) => !has(p));
missingWs.length === 0
  ? pass('WebSite required properties', WS_REQUIRED.join(', '))
  : fail('WebSite required properties', `Missing: ${missingWs.join(', ')}`, 'Complete the WebSite node.');

// FAQPage
const literalQuestions = (app.match(/'@type': 'Question'/g) ?? []).length;
const literalAnswers = (app.match(/'@type': 'Answer'/g) ?? []).length;
const fromArray = /FAQS\.map/.test(app);
// When the graph is map()-generated, the emitted count equals the array length,
// not the number of literal "'@type': 'Question'" strings in the source.
let faqCount = literalQuestions;
if (fromArray) {
  const faqDataFile = path.join('src', 'data', 'faqData.js');
  const faqData = fs.existsSync(faqDataFile) ? fs.readFileSync(faqDataFile, 'utf8') : '';
  faqCount = (faqData.match(/^\s*q:\s*'/gm) ?? []).length;
}
const faqAnswers = fromArray ? faqCount : literalAnswers;
faqCount > 0 && faqCount === faqAnswers
  ? pass('FAQPage Q/A pairs',
      `${faqCount} Question nodes each with an Answer${fromArray ? ' (generated from the shared FAQS array, so it cannot drift from visible copy)' : ''}`)
  : fail('FAQPage Q/A pairs',
      `${faqCount} Question vs ${faqAnswers} Answer nodes (literal Q/A in App.jsx: ${literalQuestions}/${literalAnswers})`,
      'Every Question needs exactly one acceptedAnswer.');

// FAQPage must mirror visible copy. The questions live in a shared data
// module that both the schema and the page import, so verify both consumers
// point at the same module and that the counts agree.
const faqPage = read('src/pages/FAQ.jsx');
const dataModPath = /from\s+['"]([^'"]*data[/\\][a-zA-Z0-9_]*faqData)['"]/.exec(faqPage)?.[1] ?? null;
const appUsesSame = dataModPath
  ? app.includes("'./data/faqData'") || app.includes("'../data/faqData'")
  : false;

let visibleQ = 0;
let sourceLabel = 'inline in FAQ.jsx';
if (dataModPath) {
  const dataFile = path.resolve('src/pages', dataModPath.replace(/\\/g, '/') + '.js');
  if (fs.existsSync(dataFile)) {
    visibleQ = (fs.readFileSync(dataFile, 'utf8').match(/^\s*q:\s*'/gm) ?? []).length;
    sourceLabel = dataModPath + '.js';
  }
} else {
  visibleQ = (faqPage.match(/^\s*q:\s*'/gm) ?? []).length;
}

fromArray && appUsesSame && visibleQ > 0 && visibleQ === faqCount
  ? pass('FAQ schema matches page copy',
      `Both the JSON-LD and the visible page import ${sourceLabel} (${visibleQ} questions), so schema and visible copy cannot diverge.`)
  : fail('FAQ schema matches page copy',
      `schema=${faqCount}, visible=${visibleQ} (from ${sourceLabel}), array-generated=${fromArray}, shared-module=${appUsesSame}`,
      'Both App.jsx (schema) and FAQ.jsx (page) must import the same data module.');

// HowTo
const steps = (app.match(/'@type': 'HowToStep'/g) ?? []).length;
const stepProps = ['position', 'name', 'text'].every(has);
steps > 0 && stepProps
  ? pass('HowTo steps', `${steps} HowToStep nodes with position/name/text`)
  : fail('HowTo steps', `${steps} steps, required props present: ${stepProps}`, 'Each step needs position, name, and text.');

// SoftwareApplication
const SA_REQ = ['name', 'applicationCategory', 'operatingSystem'];
const missingSa = SA_REQ.filter((p) => !has(p));
missingSa.length === 0
  ? pass('SoftwareApplication required properties', SA_REQ.join(', '))
  : fail('SoftwareApplication required properties', `Missing: ${missingSa.join(', ')}`, 'Complete the SoftwareApplication node.');

// --- 4. Types deliberately absent ----------------------------------------
/'Article'|'BlogPosting'|'Product'|'Course'|'VideoObject'/.test(app)
  ? warn('Absent type check', 'Found an Article/Product/Course/VideoObject node; the site has no such content')
  : na('Absent type check',
      'No Article, Product, Course, or VideoObject markup. Correct: this site has no articles, products, courses, or video, so emitting that schema would be invalid.',
      'Content type does not exist on this site');

// BreadcrumbList. Requires an actual BreadcrumbSchema() CALL, not the string
// 'BreadcrumbList' appearing anywhere: the type name only exists in
// Breadcrumb.jsx, so App.jsx can only emit it by invoking the builder.
// A previous version matched the raw string and reported "Present in the
// @graph" on the strength of a prose comment in App.jsx alone.
const bc = noComments(read('src/components/Breadcrumb.jsx'));
const bcSchema = /'@type': 'BreadcrumbList'/.test(bc);
const bcCalled = /BreadcrumbSchema\s*\(/.test(appNow);
bcSchema && bcCalled
  ? pass('BreadcrumbList', 'Emitted by a BreadcrumbSchema() call in the @graph')
  : bcSchema
    ? warn('BreadcrumbList',
        'Breadcrumb.jsx defines BreadcrumbList, but App.jsx never calls BreadcrumbSchema()',
        'Wrap the route graph in crumbs(path, nodes) so the visible trail has matching structured data.')
    : na('BreadcrumbList',
        'No BreadcrumbList schema emitted. Correct while breadcrumbs render as plain <nav> without structured data.',
        'No qualifying breadcrumb trail');

const localBusiness = /LocalBusiness|PostalAddress/.test(app);
localBusiness
  ? fail('LocalBusiness', 'LocalBusiness schema present',
      'Samadhan is civic-tech software, not a local business with a public storefront. Remove it rather than emit a false local signal.')
  : na('LocalBusiness', 'No LocalBusiness/PostalAddress markup. Correct: a Google Business Profile would misrepresent a software prototype.', 'Not a local business');

// --- 5. Report ------------------------------------------------------------
const byStatus = (s) => results.filter((r) => r.status === s).length;
for (const r of results) {
  const icon = r.status === 'PASS' ? 'PASS' : r.status === 'N/A' ? ' N/A' : r.status === 'FAIL' ? 'FAIL' : 'PART';
  console.log(`${icon}  ${r.label}`);
  console.log(`      ${r.detail}`);
  if (r.remediation) console.log(`      fix: ${r.remediation}`);
  if (r.reason) console.log(`      N/A reason: ${r.reason}`);
}

const fails = byStatus('FAIL');
const partials = byStatus('PARTIAL');
console.log('\n' + '-'.repeat(60));
console.log(`PASS ${byStatus('PASS')} | PARTIAL ${partials} | FAIL ${fails} | N/A ${byStatus('N/A')} | ${results.length} checks`);
console.log('NOT VERIFIED by this script: rich-result eligibility (needs Google Rich Results Test)');
if (fails > 0) {
  console.log(`\nRESULT: ${fails} required property/structure check(s) FAILED.`);
  console.log('NOT VALIDATED - do not report structured data as passing.');
} else {
  console.log(`\nRESULT: source-level structure valid${partials ? ` with ${partials} partial` : ''}.`);
  console.log('This does NOT mean rich results are eligible.');
}
console.log('-'.repeat(60));

process.exit(fails > 0 ? 1 : 0);