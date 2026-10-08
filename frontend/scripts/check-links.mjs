#!/usr/bin/env node
/**
 * External citation link check.
 *
 * The Methodology page cites public Indian datasets. Two of those citations were
 * not actually usable:
 *
 *   rchiips.org   certificate EXPIRED, so a visitor gets a browser warning
 *   nhm.gov.in    connection timed out repeatedly
 *
 * Nothing in the repo noticed, because no check ever asked whether a cited link
 * resolves. This asks. It is not part of `npm run audit` because it makes
 * network calls and would fail the build on a transient outage; run it
 * deliberately, and treat a failure as "investigate", not "delete the link".
 *
 * Usage:
 *   node scripts/check-links.mjs            report only, exit 0
 *   node scripts/check-links.mjs --strict   exit 1 on any non-200/3xx
 *
 * Links marked allowUnreachable are ones that could not be verified from this
 * environment at all; they are listed so the omission stays deliberate.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STRICT = process.argv.includes('--strict');
const TIMEOUT = 25000;

// Accepts a URL only if it resolves, follows redirects, and the final response
// is 2xx. A certificate error is a failure: the visitor sees a warning too.
async function probe(url) {
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT),
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
      },
    });
    return { ok: res.status >= 200 && res.status < 400, status: res.status, final: res.url };
  } catch (e) {
    const code = e.cause?.code ?? e.message;
    return { ok: false, status: code, final: url };
  }
}

/** Every external href declared in the source, with the label it sits beside. */
function citations() {
  const out = [];
  const files = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (/\.(jsx|js)$/.test(e.name)) files.push(full);
    }
  };
  walk(path.join(ROOT, 'src'));

  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8');
    for (const m of src.matchAll(/href:\s*(['"])(https?:\/\/[^'"]+)\1/g)) {
      const idx = src.indexOf(m[2]);
      const before = src.slice(Math.max(0, idx - 260), idx);
      const label = /label:\s*'([^']+)'/.exec(before)?.[1] ?? '(unlabelled)';
      out.push({ url: m[2], label, file: path.relative(ROOT, f) });
    }
  }
  return out;
}

const cites = citations();
console.log(`${cites.length} external citation(s) declared\n`);

const results = [];
for (const c of cites) {
  const r = await probe(c.url);
  results.push({ ...c, ...r });
  console.log(
    `${r.ok ? 'OK  ' : 'FAIL'}  ${String(r.status).padEnd(28)} ${c.url}`,
  );
  if (!r.ok) console.log(`        label: ${c.label}  (${c.file})`);
  if (r.final && r.final !== c.url) console.log(`        -> ${r.final}`);
}

const failures = results.filter((r) => !r.ok);
console.log('\n' + '-'.repeat(64));
console.log(`${results.length - failures.length} of ${results.length} resolve`);
console.log('-'.repeat(64));

if (failures.length === 0) {
  console.log('\nAll cited links resolve.');
  process.exit(0);
}

console.log('\nA failing link is one of:');
console.log('  - a real dead or insecure citation: replace it with a working source,');
console.log('    or name the dataset without linking it;');
console.log('  - a publisher-side TLS problem that browsers may recover from');
console.log('    (an incomplete certificate chain, for example). Note it next to the');
console.log('    citation rather than deleting the source.');
process.exit(STRICT ? 1 : 0);