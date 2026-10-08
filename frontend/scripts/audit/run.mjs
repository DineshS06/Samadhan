#!/usr/bin/env node
/**
 * Samadhan SEO audit runner.
 *
 * Single source of truth for status and completion. The console report and
 * the JSON artifact are both generated from the same `results` array and the
 * same `calculateCompletion` call, so they can never disagree.
 *
 * Usage:  node scripts/audit/run.mjs [--no-live]
 * Exit:   0 only when completion === 'COMPLETE'
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHECKS, TOTAL_CHECKS, SITE_URL, registryIntegrity } from './registry.mjs';
import { calculateCompletion, STATES } from './completion.mjs';
import {
  FRONTEND, loadProject, parseRoutes, pageFacts, listPages, scanEncoding,
  distAssets, gitCommit, gitDirty, httpStatus, httpGet,
} from './evidence.mjs';
import { VERIFIERS, initContext } from './verifiers.mjs';

const USE_LIVE = !process.argv.includes('--no-live');
const OUT_DIR = path.join(FRONTEND, 'audit');

const SYM = {
  [STATES.PASS]: 'PASS',
  [STATES.FAIL]: 'FAIL',
  [STATES.PARTIAL]: 'PARTIAL',
  [STATES.BLOCKED]: 'BLOCKED',
  [STATES.UNKNOWN]: 'UNKNOWN',
  [STATES.NA]: 'N/A',
};

function loadCtx() {
  const project = loadProject();
  const routes = parseRoutes(project.appJsx);
  const pageFiles = listPages(project.pagesDir);
  const facts = {};
  for (const f of pageFiles) facts[path.basename(f, '.jsx')] = pageFacts(f);

  const routedComponents = new Set(routes.map((r) => r.pageComponent).filter(Boolean));
  // The 404 page is deliberately served by the '*' catch-all route, and parseRoutes
  // skips '*', so NotFound must be treated as routed or it looks like an orphan.
  routedComponents.add('NotFound');
  const unroutedPages = fs
    .readdirSync(project.pagesDir)
    .filter((f) => f.endsWith('.jsx'))
    .map((f) => path.basename(f, '.jsx'))
    .filter((n) => !routedComponents.has(n));

  const sitemapPaths = [
    ...new Set(
      [...(project.sitemap.matchAll(/<loc>https:\/\/[^<]*?(\/[^<]*)<\/loc>/g))].map((m) => m[1] || '/')
    ),
  ];

  // Internal link targets across nav + page bodies.
  const internalLinkTargets = new Set([
    ...[...project.headerJsx.matchAll(/'(\/[^']*)'/g)].map((m) => m[1]),
    ...[...project.footerJsx.matchAll(/to='(\/[^']*)'/g)].map((m) => m[1]),
    ...Object.values(facts).flatMap((f) => f.internalLinks),
  ]);

  const publicRoutes = () => routes.filter((r) => !r.path.startsWith('/mp'));

  const ctx = {
    ...project,
    routes,
    pageFacts: facts,
    unroutedPages,
    sitemapPaths,
    internalLinkTargets: [...internalLinkTargets],
    publicRoutes,
    exists: (p) => fs.existsSync(p),
    readFileOrNull: (p) => {
      try {
        return fs.readFileSync(p, 'utf8');
      } catch {
        return null;
      }
    },
    encodingIssues: scanEncoding(path.join(FRONTEND, 'src')),
    registryIntegrity: registryIntegrity(),
    commitSha: gitCommit(),
    liveStatus: {},
    siteUrl: SITE_URL,
  };

  if (USE_LIVE) {
    const targets = [...new Set([...ctx.sitemapPaths, ...routes.map((r) => r.path)])];
    for (const p of targets) {
      try {
        ctx.liveStatus[p] = httpStatus(SITE_URL + (p === '/' ? '/' : p)).status;
      } catch {
        ctx.liveStatus[p] = 0;
      }
    }
    try {
      const home = httpGet(SITE_URL);
      ctx.liveHtml = home.body;
      ctx.liveHomeStatus = home.status;
    } catch {
      ctx.liveHtml = null;
      ctx.liveHomeStatus = 0;
    }
  }

  initContext(ctx);
  return ctx;
}

function run() {
  const ctx = loadCtx();
  const results = [];

  for (const check of CHECKS) {
    const verifier = VERIFIERS[check.id];
    const base = {
      id: check.id,
      csvNumber: check.csvNumber,
      name: check.name,
      category: check.category,
      type: check.type,
      difficulty: check.difficulty,
    };

    if (!verifier) {
      results.push({
        ...base,
        status: STATES.UNKNOWN,
        evidence: 'No verifier implemented for this check.',
        remediation: 'Implement a verifier so this check is measured rather than assumed.',
        source: 'registry',
        verifiedAt: new Date().toISOString(),
      });
      continue;
    }

    let out;
    try {
      out = verifier(ctx);
    } catch (err) {
      out = {
        status: STATES.BLOCKED,
        evidence: `Verifier could not complete: ${err.message}`,
        remediation: 'Resolve the verifier error, then re-run.',
        source: 'verifier',
      };
    }

    results.push({
      ...base,
      status: out.status,
      evidence: out.evidence ?? '',
      currentValue: out.currentValue ?? null,
      requiredValue: out.requiredValue ?? null,
      remediation: out.remediation ?? null,
      naReason: out.naReason ?? null,
      source: out.source ?? 'code',
      location: out.location ?? null,
      verifiedAt: new Date().toISOString(),
    });
  }

  const completion = calculateCompletion(results, {
    totalChecks: TOTAL_CHECKS,
    generatedAt: new Date().toISOString(),
    commitSha: gitCommit(),
    stale: false,
  });

  return { results, completion, commit: gitCommit(), dirty: gitDirty(), liveMode: USE_LIVE };
}

// ---------------------------------------------------------------------------
// reporting
// ---------------------------------------------------------------------------

function render({ results, completion, commit, liveMode }) {
  const L = [];
  const line = '='.repeat(100);

  L.push(line);
  L.push('SAMADHAN SEO AUDIT -- evidence-based, completion-gated');
  L.push(line);
  L.push(`Site:            ${SITE_URL}`);
  L.push(`Live checks:     ${liveMode ? 'ENABLED' : 'DISABLED (--no-live)'}`);
  L.push(`Commit:          ${commit ?? 'unknown'}`);
  L.push(`Registry:        ${TOTAL_CHECKS} checks, IDs SEO-001..SEO-${String(TOTAL_CHECKS).padStart(3, '0')}`);
  L.push(`Run at:          ${completion.generatedAt}`);
  L.push('');

  const c = completion.counts;
  L.push('STATUS TOTALS');
  for (const s of ['PASS', 'FAIL', 'PARTIAL', 'BLOCKED', 'UNKNOWN', 'N/A']) {
    L.push(`  ${s.padEnd(9)} ${String(c[s]).padStart(4)}`);
  }
  L.push(`  ${'TOTAL'.padEnd(9)} ${String(completion.evaluated).padStart(4)}`);
  L.push('');
  L.push(`  Applicable (non N/A):  ${completion.applicable}`);
  L.push(`  PASS / APPLICABLE:     ${completion.passApplicable} / ${completion.applicable}`);
  L.push(`  Pass of all 160:       ${completion.completionPercent}%`);
  L.push('');
  L.push('COMPLETION');
  L.push(`  ${completion.status}`);
  L.push(`  ${completion.reason}`);
  L.push('');
  L.push('  NOTE: this score is NOT completion. Completion is gated on zero');
  L.push('  unresolved FAIL / PARTIAL / BLOCKED / UNKNOWN / undocumented N/A.');
  L.push(line);
  L.push('');

  const byCat = new Map();
  for (const r of results) {
    if (!byCat.has(r.category)) byCat.set(r.category, []);
    byCat.get(r.category).push(r);
  }

  for (const [cat, rows] of byCat) {
    const tally = rows.reduce((a, r) => ((a[r.status] = (a[r.status] ?? 0) + 1), a), {});
    L.push(`\n### ${cat}  (${Object.entries(tally).map(([k, v]) => `${k} ${v}`).join(', ')})`);
    for (const r of rows) {
      L.push(`${(SYM[r.status] ?? r.status).padEnd(8)} ${r.id}  ${r.name}`);
      L.push(`         evidence: ${r.evidence}`);
      if (r.remediation) L.push(`         fix:      ${r.remediation}`);
    }
  }

  const unresolved = results.filter(
    (r) => r.status !== STATES.PASS && !(r.status === STATES.NA && r.naReason)
  );
  if (unresolved.length) {
    L.push('');
    L.push(line);
    L.push(`UNRESOLVED -- ${unresolved.length} of ${TOTAL_CHECKS} (these prevent COMPLETE)`);
    L.push(line);
    for (const r of unresolved) {
      L.push(`${r.status.padEnd(8)} ${r.id}  ${r.name}`);
    }
  }

  L.push('');
  return L.join('\n');
}

function writeArtifact({ results, completion, commit, dirty, liveMode }) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, 'report.json'),
    JSON.stringify(
      {
        meta: {
          site: SITE_URL,
          commit,
          workingTreeDirty: dirty,
          liveChecks: liveMode,
          generatedAt: completion.generatedAt,
          totalChecks: TOTAL_CHECKS,
          sourceChecklist: '160+ SEO Checklist 2d480a0da8ba83eea7a80180d589bb43_all.csv',
          note: 'completion is gated; score is not completion',
        },
        completion,
        results,
      },
      null,
      2
    ),
    'utf8'
  );
}


/** Regenerate the human-readable table from the same results array. */
function writeMarkdown({ results, completion, commit, liveMode }) {
  const esc = (v) =>
    String(v == null ? '' : v)
      .replace(/\|/g, '/')
      .replace(/\s+/g, ' ')
      // Keep the generated report pure ASCII so it renders identically in any
      // console, editor, or code-hosting page view regardless of encoding.
      .replace(/[—–]/g, '-')
      .replace(/→/g, '->')
      .replace(/≥/g, '>=')
      .replace(/≤/g, '<=')
      .replace(/[‘’]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/·/g, '-')
      .trim();

  const head = ['ID', 'Category', 'Check', 'Status', 'Current value', 'Required value', 'Fix', 'Source', 'Last verified'];
  const body = results.map((r) => [
    r.id, esc(r.category), esc(r.name), r.status,
    esc(r.currentValue || r.evidence), esc(r.requiredValue),
    esc(r.remediation), esc(r.source), r.verifiedAt.slice(0, 19) + 'Z',
  ]);

  const c = completion;
  const out = [];
  out.push('# Samadhan SEO Audit -- ' + c.totalChecks + '-check verification table');
  out.push('');
  out.push('> Generated by npm run audit:seo. Do not hand-edit; regenerate by re-running the audit.');
  out.push('');
  out.push('| ' + head.join(' | ') + ' |');
  out.push('|' + head.map(() => '---').join('|') + '|');
  for (const row of body) out.push('| ' + row.join(' | ') + ' |');
  out.push('');
  out.push('## Totals');
  out.push('');
  out.push('| Status | Count |');
  out.push('|---|---|');
  out.push('| PASS | ' + c.counts.PASS + ' |');
  out.push('| FAIL | ' + c.counts.FAIL + ' |');
  out.push('| PARTIAL | ' + c.counts.PARTIAL + ' |');
  out.push('| BLOCKED | ' + c.counts.BLOCKED + ' |');
  out.push('| UNKNOWN | ' + c.counts.UNKNOWN + ' |');
  out.push('| N/A | ' + c.counts['N/A'] + ' |');
  out.push('| TOTAL | ' + c.totalChecks + ' |');
  out.push('| APPLICABLE (non N/A) | ' + c.applicable + ' |');
  out.push('| PASS / APPLICABLE | ' + c.passApplicable + ' / ' + c.applicable + ' |');
  out.push('');
  out.push('## Completion calculation');
  out.push('');
  out.push('`' + c.status + '`');
  out.push('');
  out.push(c.reason);
  out.push('');
  out.push('Generated: ' + c.generatedAt);
  out.push('Commit: ' + c.commitSha);
  out.push('Live checks: ' + liveMode);
  out.push('');
  out.push('## Reading this table');
  out.push('');
  out.push('- **PASS** -- requirement verified, evidence recorded.');
  out.push('- **FAIL** -- checked, does not meet the requirement.');
  out.push('- **PARTIAL** -- part of the requirement passes; incomplete.');
  out.push('- **BLOCKED** -- cannot verify: needs a credential, service, or environment not available here.');
  out.push('- **UNKNOWN** -- insufficient evidence to decide.');
  out.push('- **N/A** -- genuinely does not apply; reason is in the row.');
  out.push('');
  out.push('The pass rate is NOT completion. Completion requires every applicable check to');
  out.push('resolve to PASS or a documented N/A, with zero unresolved');
  out.push('FAIL / PARTIAL / BLOCKED / UNKNOWN.');
  out.push('');

  fs.writeFileSync(path.join(OUT_DIR, 'CHECKLIST-REPORT.md'), out.join('\n'), 'utf8');
}

const outcome = run();
console.log(render(outcome));
writeArtifact(outcome);
writeMarkdown(outcome);

const c = outcome.completion;
console.log(`\nArtifact: ${path.join(OUT_DIR, 'report.json')}`);
console.log(`RESULT: ${c.status}\n`);
process.exit(c.status === 'COMPLETE' ? 0 : 1);