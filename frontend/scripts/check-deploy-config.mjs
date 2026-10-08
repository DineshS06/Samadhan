#!/usr/bin/env node
/**
 * Deployment config integrity.
 *
 * The live site 404s on every route except "/" because the SPA rewrite lives in
 * a vercel.json that was never committed, and only the frontend is deployed.
 * A rewrite that exists only on an uncommitted local file fixes nothing, so
 * this asserts the file is tracked and that the two copies agree.
 *
 * Run: node scripts/check-deploy-config.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const FRONTEND = path.join(ROOT, 'frontend');

const results = [];
const pass = (id, label, detail) => results.push({ id, label, status: 'PASS', detail });
const fail = (id, label, detail, fix) => results.push({ id, label, status: 'FAIL', detail, fix });

const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const routes = [
  ...fs.readFileSync(path.join(FRONTEND, 'src', 'App.jsx'), 'utf8').matchAll(/path='([^']+)'/g),
].map((m) => m[1]);

const CONFIGS = [
  { label: 'vercel.json', file: path.join(ROOT, 'vercel.json'), cd: ROOT },
  { label: 'frontend/vercel.json', file: path.join(FRONTEND, 'vercel.json'), cd: FRONTEND },
];

function isTracked(file, cwd) {
  try {
    execFileSync('git', ['ls-files', '--error-unmatch', path.relative(cwd, file)], {
      cwd,
      stdio: 'pipe',
    });
    return true;
  } catch {
    return false;
  }
}

// --- DEP-01: the SPA rewrite exists ---------------------------------------
{
  const missing = CONFIGS.filter((c) => {
    if (!fs.existsSync(c.file)) return true;
    const r = read(c.file).rewrites ?? [];
    return !r.some((w) => w.source === '/(.*)' && w.destination === '/index.html');
  });
  missing.length === 0
    ? pass('DEP-01', 'SPA rewrite configured', 'catch-all /(.*) -> /index.html in both files')
    : fail('DEP-01', 'SPA rewrite configured',
        `missing in: ${missing.map((c) => c.label).join(', ')}`,
        'Without the rewrite every route except / returns 404.');
}

// --- DEP-02: the config is actually committed -----------------------------
// The defect that caused the outage: vercel.json existed locally but was never
// tracked, so no deployment could have used it.
{
  const untracked = CONFIGS.filter((c) => fs.existsSync(c.file) && !isTracked(c.file, c.cd));
  untracked.length === 0
    ? pass('DEP-02', 'Deployment config is tracked in git',
        'both vercel.json files are committed')
    : fail('DEP-02', 'Deployment config is tracked in git',
        `untracked: ${untracked.map((c) => c.label).join(', ')}`,
        'An untracked config is invisible to CI and to every deployment.');
}

// --- DEP-03: the two copies agree -----------------------------------------
{
  const [a, b] = CONFIGS.map((c) => read(c.file));
  const rules = (cfg) => ({
    rewrites: JSON.stringify(cfg.rewrites),
    redirects: JSON.stringify(cfg.redirects),
    headers: JSON.stringify(cfg.headers),
    cleanUrls: cfg.cleanUrls,
    trailingSlash: cfg.trailingSlash,
  });
  const ra = rules(a);
  const rb = rules(b);
  const diff = Object.keys(ra).filter((k) => ra[k] !== rb[k]);
  diff.length === 0
    ? pass('DEP-03', 'Both vercel.json files agree',
        'rewrites, redirects, headers, cleanUrls and trailingSlash match')
    : fail('DEP-03', 'Both vercel.json files agree', `differ on: ${diff.join(', ')}`,
        'Vercel reads whichever matches its Root Directory, so they must not diverge.');
}

// --- DEP-04: build/output paths are right for their depth ------------------
{
  const issues = [];
  const root = read(CONFIGS[0].file);
  const front = read(CONFIGS[1].file);
  if (root.buildCommand !== 'cd frontend && npm run build') {
    issues.push(`root buildCommand is "${root.buildCommand}"`);
  }
  if (root.outputDirectory !== 'frontend/dist') {
    issues.push(`root outputDirectory is "${root.outputDirectory}"`);
  }
  if (front.buildCommand !== 'npm run build') {
    issues.push(`frontend buildCommand is "${front.buildCommand}"`);
  }
  if (front.outputDirectory !== 'dist') {
    issues.push(`frontend outputDirectory is "${front.outputDirectory}"`);
  }
  issues.length === 0
    ? pass('DEP-04', 'Build and output paths match each config depth',
        'root: cd frontend && npm run build -> frontend/dist; frontend: npm run build -> dist')
    : fail('DEP-04', 'Build and output paths match each config depth', issues.join('; '),
        'A wrong outputDirectory publishes nothing.');
}

// --- DEP-05: every redirect lands on a real route -------------------------
{
  const dead = [];
  for (const c of CONFIGS) {
    if (!fs.existsSync(c.file)) continue;
    for (const r of read(c.file).redirects ?? []) {
      const dest = r.destination === '/' ? '/' : r.destination.replace(/\/$/, '');
      if (!routes.includes(dest)) dead.push(`${c.label}: ${r.source} -> ${r.destination}`);
    }
  }
  dead.length === 0
    ? pass('DEP-05', 'Redirects resolve to real routes',
        `${read(CONFIGS[0].file).redirects.length} redirects, all destinations are routed`)
    : fail('DEP-05', 'Redirects resolve to real routes', dead.join('; '),
        'A redirect to a missing route just produces a soft 404.');
}

// --- DEP-06: /mp is excluded from indexing at the edge --------------------
{
  const hasNoIndex = CONFIGS.every((c) =>
    (read(c.file).headers ?? []).some(
      (h) => h.source === '/mp/(.*)' && (h.headers ?? []).some((x) => /noindex/i.test(x.value ?? '')),
    ),
  );
  hasNoIndex
    ? pass('DEP-06', 'MP routes send X-Robots-Tag noindex',
        'the private dashboard is not crawlable even if a crawler reaches it')
    : fail('DEP-06', 'MP routes send X-Robots-Tag noindex',
        'missing X-Robots-Tag: noindex on /mp/*',
        'The dashboard must not be indexed.');
}

// --- DEP-07: assets get long-lived immutable caching ----------------------
{
  const ok = CONFIGS.every((c) =>
    (read(c.file).headers ?? []).some(
      (h) => h.source === '/assets/(.*)' && (h.headers ?? []).some((x) => /immutable/.test(x.value ?? '')),
    ),
  );
  ok
    ? pass('DEP-07', 'Hashed assets are cached immutably', 'max-age=31536000, immutable on /assets/*')
    : fail('DEP-07', 'Hashed assets are cached immutably', 'no immutable Cache-Control on /assets/*',
        'Vite fingerprints asset filenames, so they can be cached forever.');
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