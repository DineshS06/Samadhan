#!/usr/bin/env node
/**
 * Backend import check.
 *
 * `backend/server.py` had two functions named `get_grievance_by_reference` both
 * registered on `/api/grievance/<reference_id>`. Flask refuses to start when two
 * rules map one endpoint name to different functions:
 *
 *   AssertionError: View function mapping is overwriting an existing endpoint
 *   function: get_grievance_by_reference
 *
 * That is raised at import time, so it did not degrade the tracking endpoint —
 * it stopped the entire API from starting. Every frontend call therefore fell
 * back to mock data and the site behaved as though it were working.
 *
 * This boots the real app in-process and asks it what it actually registered. It
 * needs the packages in backend/requirements.txt installed; if they are not, it
 * says so and exits non-zero rather than passing, because "cannot check" and
 * "backend is fine" must never look the same.
 *
 * Run from the repo root:
 *   node frontend/scripts/check-backend.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const BACKEND = path.join(ROOT, 'backend');
const SERVER = path.join(BACKEND, 'server.py');

let passed = 0;
const results = [];
const ok = (l, d) => { passed += 1; results.push({ l, d, s: 'PASS' }); };
const bad = (l, d) => { results.push({ l, d, s: 'FAIL' }); };

// Two things the static source cannot answer: does the module import at all, and
// what did Flask end up registering. Both need the real interpreter.
if (!fs.existsSync(SERVER)) {
  results.push({ l: 'server.py exists', d: SERVER, s: 'FAIL' });
} else {
  const probe = `
import sys, json, os
sys.path.insert(0, ${JSON.stringify(BACKEND)})
try:
    import server
except Exception as e:
    print("@@IMPORT_FAIL@@" + type(e).__name__ + ": " + str(e))
    raise SystemExit(0)

out = []
for r in server.app.url_map.iter_rules():
    methods = sorted(r.methods - {"HEAD", "OPTIONS"})
    out.append({"rule": str(r.rule), "endpoint": r.endpoint, "methods": methods})
print("@@OK@@" + json.dumps(out))
`;
  const py = spawnSync('python', ['-c', probe], { encoding: 'utf8', cwd: ROOT });
  const stdout = py.stdout ?? '';

  if (stdout.includes('@@IMPORT_FAIL@@')) {
    const msg = stdout.split('@@IMPORT_FAIL@@')[1].split('\n')[0].trim();
    bad('the backend imports', msg + ' — the API cannot start, so every call falls back to mock data');
  } else if (!stdout.includes('@@OK@@')) {
    const stderr = (py.stderr ?? '').trim().split('\n').filter(Boolean).slice(0, 3).join(' | ');
    bad('the backend imports',
        `python produced no route table. ${stderr || 'no output'} — ` +
        'run `pip install -r backend/requirements.txt`');
  } else {
    const routes = JSON.parse(stdout.split('@@OK@@')[1].split('\n')[0]);
    ok('the backend imports', `${routes.length} routes registered`);

    // The duplicate that broke it: one rule, one endpoint, no shadowing.
    const byRule = new Map();
    for (const r of routes) {
      const key = r.rule + ' ' + r.methods.join(',');
      byRule.set(key, (byRule.get(key) ?? 0) + 1);
    }
    const dupes = [...byRule.entries()].filter(([, n]) => n > 1);
    dupes.length === 0
      ? ok('no route is registered twice',
          `${byRule.size} distinct rule+method pairs, no shadowing`)
      : bad('no route is registered twice',
          dupes.map(([k, n]) => `${k} x${n}`).join('; '));

    // Each public route the frontend calls must exist and allow GET/POST.
    const expected = [
      ['/api/health', 'GET'], ['/api/submit', 'POST'], ['/api/prioritize', 'POST'],
      ['/api/geo/states', 'GET'], ['/api/geo/constituency/by-name/<name>', 'GET'],
      ['/api/grievance/<reference_id>', 'GET'], ['/api/grievances', 'GET'],
      ['/api/dashboard', 'GET'], ['/api/mp/login', 'POST'], ['/api/mp/me', 'GET'],
    ];
    const have = new Set(routes.map((r) => r.rule + ' ' + r.methods.join(',')));
    const missing = expected.filter(([rule, m]) => !have.has(rule + ' ' + m));
    missing.length === 0
      ? ok('every route the frontend calls exists', `${expected.length}/${expected.length} present`)
      : bad('every route the frontend calls exists',
          missing.map(([r, m]) => `${r} (${m})`).join(', '));
  }

  // The static shape of the duplicate, so the failure is caught even by someone
  // who cannot run Python.
  const src = fs.readFileSync(SERVER, 'utf8').replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*#.*$/gm, ' ');
  const fnNames = [...src.matchAll(/@app\.route\(\s*["']([^"']+)["'][^)]*\)\s*\n\s*def\s+(\w+)/g)]
    .map((m) => `${m[1]}|${m[2]}`);
  const seen = new Set();
  const shadowed = fnNames.filter((k) => (seen.has(k) ? true : (seen.add(k), false)));
  shadowed.length === 0
    ? ok('no two routes share a rule and a function name',
        `${fnNames.length} decorated handlers, all distinct`)
    : bad('no two routes share a rule and a function name',
        shadowed.join(', ') + ' — Flask raises AssertionError at import');
}

const failed = results.filter((r) => r.s === 'FAIL').length;
for (const r of results) console.log(`${r.s.padEnd(4)} ${r.l}\n     ${r.d}`);
console.log('\n' + '-'.repeat(60));
console.log(`${passed} passed, ${failed} failed`);
console.log('-'.repeat(60));
process.exit(failed ? 1 : 0);