/**
 * Automated completion-logic tests.
 *
 * These lock the rules that the old audit engine violated. If any of these
 * fail, the engine must not be trusted to report a completion state.
 *
 * Run: node scripts/audit/completion.test.mjs
 */
import { calculateCompletion, STATES } from './completion.mjs';

let passed = 0;
let failed = 0;
const failures = [];

function check(name, condition, detail = '') {
  if (condition) {
    passed += 1;
    console.log(`  ok   ${name}`);
  } else {
    failed += 1;
    failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
    console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

/** Build a synthetic registry of `n` checks, all PASS by default. */
function registry(n, status = STATES.PASS) {
  return Array.from({ length: n }, (_, i) => ({
    id: `SEO-${String(i + 1).padStart(3, '0')}`,
    name: `synthetic check ${i + 1}`,
    status,
    evidence: 'measured',
  }));
}

/** Same, but one check at `index` gets `status` and no evidence. */
function registryWithOne(n, index, status, evidence = 'measured') {
  const list = registry(n);
  list[index] = { ...list[index], status, evidence };
  return list;
}

console.log('\n' + '='.repeat(72));
console.log('AUDIT COMPLETION LOGIC TESTS');
console.log('='.repeat(72));

// --- Rule 1: only an all-PASS registry is COMPLETE -----------------------
{
  const r = calculateCompletion(registry(10), { totalChecks: 10 });
  check('10/10 PASS => COMPLETE', r.status === 'COMPLETE', r.status);
  check('10/10 PASS => 100%', r.completionPercent === 100, String(r.completionPercent));
}

// --- Rule 2: any unresolved state blocks completion ----------------------
{
  const r = calculateCompletion(registryWithOne(160, 159, STATES.FAIL), { totalChecks: 160 });
  check('159 PASS + 1 FAIL => NOT COMPLETE', r.status === 'NOT COMPLETE', r.status);
  check('159 PASS + 1 FAIL => not 100%', r.completionPercent !== 100, String(r.completionPercent));
  check('FAIL id surfaced', r.unresolvedIds.includes('SEO-160'));
}

{
  const r = calculateCompletion(registryWithOne(160, 159, STATES.UNKNOWN, ''), { totalChecks: 160 });
  check('299-style UNKNOWN blocks', r.status === 'NOT COMPLETE', r.status);
  check('UNKNOWN counted in blockers', r.blockers.unknown === 1, JSON.stringify(r.blockers));
}

{
  const r = calculateCompletion(registryWithOne(160, 42, STATES.PARTIAL), { totalChecks: 160 });
  check('PARTIAL blocks completion', r.status === 'NOT COMPLETE', r.status);
  check('PARTIAL counted in blockers', r.blockers.partial === 1);
}

{
  const r = calculateCompletion(registryWithOne(160, 7, STATES.BLOCKED, ''), { totalChecks: 160 });
  check('BLOCKED blocks completion', r.status === 'NOT COMPLETE', r.status);
  check('BLOCKED counted in blockers', r.blockers.blocked === 1);
}

// --- Rule 3: PARTIAL-only runs must NOT exit clean ------------------------
{
  const list = registry(160).map((c) => ({ ...c, status: STATES.PARTIAL }));
  const r = calculateCompletion(list, { totalChecks: 160 });
  check('all-PARTIAL => NOT COMPLETE', r.status === 'NOT COMPLETE', r.status);
  check('all-PARTIAL => zero passes', r.passApplicable === 0, String(r.passApplicable));
}

// --- Rule 4: UNKNOWN -> PASS coercion is impossible -----------------------
{
  const r = calculateCompletion(registryWithOne(160, 3, STATES.UNKNOWN, ''), { totalChecks: 160 });
  check('UNKNOWN never counts as PASS', !r.unresolvedIds.includes('SEO-004') === false);
  check('UNKNOWN leaves completion < 100', r.completionPercent < 100, String(r.completionPercent));
}

// --- Rule 5: an undocumented N/A is not a pass ---------------------------
{
  const list = registry(160);
  list[5] = { id: 'SEO-006', name: 'x', status: STATES.NA, evidence: 'n/a' }; // no naReason
  const r = calculateCompletion(list, { totalChecks: 160 });
  check('N/A without reason blocks completion', r.status === 'NOT COMPLETE', r.status);
  check('undocumented N/A surfaced', r.blockers.undocumentedNA === 1);
}

{
  const list = registry(160);
  list[5] = { id: 'SEO-006', name: 'x', status: STATES.NA, evidence: 'n/a', naReason: 'No video on site' };
  const r = calculateCompletion(list, { totalChecks: 160 });
  check('documented N/A resolves', r.status === 'COMPLETE', r.status);
  check('documented N/A still visible in counts', r.counts['N/A'] === 1);
  check('N/A not counted as applicable', r.applicable === 159, String(r.applicable));
}

// --- Rule 6: PASS without evidence is not a verified pass ----------------
{
  const list = registry(160);
  list[9] = { id: 'SEO-010', name: 'x', status: STATES.PASS, evidence: '' };
  const r = calculateCompletion(list, { totalChecks: 160 });
  check('PASS without evidence blocks completion', r.status === 'NOT COMPLETE', r.status);
}

// --- Rule 7: stale results never complete --------------------------------
{
  const r = calculateCompletion(registry(160), { totalChecks: 160, stale: true });
  check('stale all-PASS => NOT COMPLETE', r.status === 'NOT COMPLETE', r.status);
  check('staleness reason reported', /stale/i.test(r.reason), r.reason);
}

// --- Rule 8: denominator cannot shrink -----------------------------------
{
  // The old engine dropped failed/missing checks from the denominator via
  // required:false. Here 40 of 160 checks are simply absent.
  const r = calculateCompletion(registry(120), { totalChecks: 160 });
  check('missing checks do not inflate completion', r.completionPercent === 75, String(r.completionPercent));
  check('missing checks => NOT COMPLETE', r.status === 'NOT COMPLETE', r.status);
  check('shortfall reported', /160 registered/.test(r.reason), r.reason);
}

// --- Rule 9: empty input is never complete -------------------------------
{
  const r = calculateCompletion([], { totalChecks: 160 });
  check('empty registry => NOT COMPLETE', r.status === 'NOT COMPLETE', r.status);
}

// --- Rule 10: score never implies completion -----------------------------
{
  const list = registry(160);
  list[0] = { ...list[0], status: STATES.FAIL, evidence: 'measured' };
  const r = calculateCompletion(list, { totalChecks: 160 });
  check('high score + 1 FAIL => NOT COMPLETE', r.status === 'NOT COMPLETE', r.status);
  check('result is explicitly not conflated with score', r.scoreIsNotCompletion === true);
}

console.log('='.repeat(72));
console.log(`${passed} passed, ${failed} failed`);
if (failed) {
  console.log('\nFAILURES:');
  failures.forEach((f) => console.log('  - ' + f));
}
console.log('='.repeat(72));

process.exit(failed ? 1 : 0);