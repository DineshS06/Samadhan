/**
 * Single source of truth for audit completion calculation.
 *
 * Rules (non-negotiable):
 *  - COMPLETE requires every check to be PASS or a documented N/A.
 *  - UNKNOWN / BLOCKED / PARTIAL / FAIL never resolve to COMPLETE.
 *  - The denominator is FIXED (every registered check), never shrunk.
 *  - A score never implies completion.
 *  - Stale results never resolve to COMPLETE.
 */

export const STATES = Object.freeze({
  PASS: 'PASS',
  FAIL: 'FAIL',
  PARTIAL: 'PARTIAL',
  BLOCKED: 'BLOCKED',
  UNKNOWN: 'UNKNOWN',
  NA: 'N/A',
});

/** States that count as "resolved" — nothing else does. */
const RESOLVED = new Set([STATES.PASS, STATES.NA]);

/**
 * A check is COMPLETE-eligible only when it is verified evidence of a pass,
 * or an N/A that carries a written justification.
 */
function isResolved(check) {
  if (!RESOLVED.has(check.status)) return false;
  if (check.status === STATES.NA) {
    return typeof check.naReason === 'string' && check.naReason.trim().length > 0;
  }
  // A PASS without evidence is not a verified pass.
  return typeof check.evidence === 'string' && check.evidence.trim().length > 0;
}

/**
 * @param {Array} checks      every registered check, each {id,status,evidence,naReason,...}
 * @param {object} meta       {totalChecks, generatedAt, commitSha, stale}
 * @returns {object} immutable completion result
 */
export function calculateCompletion(checks, meta = {}) {
  const list = Array.isArray(checks) ? checks : [];

  const counts = {
    PASS: 0,
    FAIL: 0,
    PARTIAL: 0,
    BLOCKED: 0,
    UNKNOWN: 0,
    'N/A': 0,
  };
  for (const c of list) {
    if (Object.prototype.hasOwnProperty.call(counts, c.status)) counts[c.status] += 1;
  }

  const applicable = list.filter((c) => c.status !== STATES.NA).length;
  const passApplicable = list.filter((c) => c.status === STATES.PASS && isResolved(c)).length;
  const naWithReason = list.filter((c) => c.status === STATES.NA && isResolved(c)).length;
  const naWithoutReason = list.filter((c) => c.status === STATES.NA && !isResolved(c)).length;
  const unresolved = list.filter((c) => !isResolved(c));

  // Denominator is the full registry, fixed at construction time.
  const denominator = meta.totalChecks ?? list.length;
  const completionPercent = denominator > 0 ? Math.round((passApplicable / denominator) * 100) : 0;

  // A PASS asserted without evidence is an unverified claim, not a pass.
  const undocumentedPass = list.filter(
    (c) => c.status === STATES.PASS && !isResolved(c)
  ).length;

  const blockers = {
    failed: list.filter((c) => c.status === STATES.FAIL).length,
    partial: list.filter((c) => c.status === STATES.PARTIAL).length,
    blocked: list.filter((c) => c.status === STATES.BLOCKED).length,
    unknown: list.filter((c) => c.status === STATES.UNKNOWN).length,
    undocumentedNA: naWithoutReason,
    undocumentedPass,
  };

  const blockersTotal =
    blockers.failed +
    blockers.partial +
    blockers.blocked +
    blockers.unknown +
    blockers.undocumentedNA +
    blockers.undocumentedPass;

  let status;
  let reason;

  if (!Array.isArray(checks) || list.length === 0) {
    status = 'NOT COMPLETE';
    reason = 'No checks were supplied — an empty result set is never complete.';
  } else if (list.length < denominator) {
    status = 'NOT COMPLETE';
    reason = `Only ${list.length} of ${denominator} registered checks were evaluated. Missing checks are not passes.`;
  } else if (meta.stale === true) {
    status = 'NOT COMPLETE';
    reason = 'Audit results are stale relative to the current code/commit. Re-run the audit.';
  } else if (blockersTotal > 0) {
    status = 'NOT COMPLETE';
    reason =
      `${blockers.failed} FAIL, ${blockers.partial} PARTIAL, ${blockers.blocked} BLOCKED, ` +
      `${blockers.unknown} UNKNOWN, ${blockers.undocumentedNA} undocumented N/A, ` +
      `${blockers.undocumentedPass} unevidenced PASS remain unresolved.`;
  } else {
    status = 'COMPLETE';
    reason = `All ${denominator} checks resolved to PASS or a documented N/A.`;
  }

  return Object.freeze({
    status,
    reason,
    counts: Object.freeze(counts),
    totalChecks: denominator,
    evaluated: list.length,
    applicable,
    passApplicable,
    naDocumented: naWithReason,
    completionPercent,
    unresolvedCount: unresolved.length,
    unresolvedIds: Object.freeze(unresolved.map((c) => c.id)),
    blockers: Object.freeze(blockers),
    generatedAt: meta.generatedAt ?? null,
    commitSha: meta.commitSha ?? null,
    scoreIsNotCompletion: true,
  });
}