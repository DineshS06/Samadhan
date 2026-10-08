/**
 * Samadhan SEO audit registry.
 *
 * The source of truth is the attached checklist CSV:
 *   "160+ SEO Checklist 2d480a0da8ba83eea7a80180d589bb43_all.csv"
 *
 * It contains 160 numbered checks (Number 1..160, each appearing exactly
 * once). Stable IDs are derived from that number: SEO-001 .. SEO-160.
 * Reading the CSV directly guarantees 1:1 integrity — nothing can be
 * silently dropped, duplicated, or renumbered by hand.
 *
 * NOTE ON THE "300 CHECKS" BRIEF: the attached checklist has 160 checks,
 * not 300. The registry reports the real count. Nothing is padded to 300.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND = path.resolve(__dirname, '..', '..');
const REPO = path.resolve(FRONTEND, '..');

export const SITE_URL = 'https://samadhan-chi.vercel.app';
export const CHECKLIST_CSV = path.join(REPO, '160+ SEO Checklist 2d480a0da8ba83eea7a80180d589bb43_all.csv');

/** Minimal RFC4180 CSV parser (handles quoted fields and embedded commas). */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i += 1;
      row.push(field);
      field = '';
      if (row.some((c) => c.trim() !== '')) rows.push(row);
      row = [];
    } else field += ch;
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function loadRegistry() {
  if (!fs.existsSync(CHECKLIST_CSV)) {
    throw new Error(`Checklist CSV not found at ${CHECKLIST_CSV}`);
  }
  const rows = parseCsv(fs.readFileSync(CHECKLIST_CSV, 'utf8'));
  const header = rows[0].map((h) => h.trim());
  const iName = header.indexOf('Checklist');
  const iCat = header.indexOf('Category');
  const iDiff = header.indexOf('Difficulty');
  const iNum = header.indexOf('Number');
  const iStatus = header.indexOf('Status');
  const iType = header.indexOf('Type');

  const checks = rows.slice(1).map((r) => {
    const num = Number(r[iNum]);
    return {
      id: `SEO-${String(num).padStart(3, '0')}`,
      csvNumber: num,
      name: (r[iName] || '').trim(),
      category: (r[iCat] || '').trim(),
      difficulty: (r[iDiff] || '').trim(),
      type: (r[iType] || '').trim(),
      sourceStatus: (r[iStatus] || '').trim(),
    };
  });

  return checks.sort((a, b) => a.csvNumber - b.csvNumber);
}

export const CHECKS = Object.freeze(loadRegistry());
export const TOTAL_CHECKS = CHECKS.length;

export const byId = (id) => CHECKS.find((c) => c.id === id);

/**
 * Integrity guard. Returns problems rather than throwing, so the audit can
 * surface a broken registry as a finding instead of crashing.
 */
export function registryIntegrity() {
  const nums = CHECKS.map((c) => c.csvNumber);
  const expected = Array.from({ length: nums.length }, (_, i) => i + 1);
  const missing = expected.filter((n) => !nums.includes(n));
  const duplicates = nums.filter((n, i) => nums.indexOf(n) !== i);
  const idMismatch = CHECKS.filter(
    (c, i) => c.id !== `SEO-${String(c.csvNumber).padStart(3, '0')}`
  ).map((c) => c.id);
  const unnamed = CHECKS.filter((c) => !c.name).map((c) => c.id);

  return {
    total: CHECKS.length,
    expectedTotal: nums.length,
    missingCsvNumbers: missing,
    duplicateCsvNumbers: duplicates,
    idMismatch,
    unnamed,
    ok: missing.length === 0 && duplicates.length === 0 && idMismatch.length === 0 && unnamed.length === 0,
  };
}

/** Group checks by category for report rendering. */
export function groupedByCategory(results) {
  const map = new Map();
  for (const r of results) {
    const cat = CHECKS.find((c) => c.id === r.id)?.category ?? 'Uncategorised';
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat).push(r);
  }
  return map;
}