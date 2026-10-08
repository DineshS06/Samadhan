/**
 * Negative tests for the guards added in this pass.
 *
 * A regression guard that cannot fail is worse than no guard, because it reads
 * as coverage. Each case reintroduces a real defect that was fixed, confirms the
 * checker flags it, then restores the file.
 *
 * Run: node scripts/audit/guard-selftest.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const MARKUP = path.join(ROOT, 'scripts', 'check-markup.mjs');

function runMarkup() {
  try {
    const out = execFileSync(process.execPath, [MARKUP], { encoding: 'utf8' });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status ?? 1, out: (e.stdout ?? '') + (e.stderr ?? '') };
  }
}

const results = [];
let passed = 0;
let failed = 0;

/**
 * Apply a mutation, assert the named check FAILS, then restore.
 */
function expectCaught(label, checkId, file, mutate) {
  const full = path.join(ROOT, file);
  const original = fs.readFileSync(full, 'utf8');
  const mutated = mutate(original);
  if (mutated === original) {
    results.push({ label, status: 'FAIL', detail: 'mutation was a no-op, nothing was tested' });
    failed += 1;
    return;
  }
  fs.writeFileSync(full, mutated, 'utf8');
  let res;
  try {
    res = runMarkup();
  } finally {
    fs.writeFileSync(full, original, 'utf8');
  }
  const flagged = res.out.includes(`FAIL ${checkId}`) || res.out.includes(`${checkId}  `) === false
    ? res.out.includes(checkId)
    : false;
  const line = res.out.split('\n').find((l) => l.startsWith('FAIL ' + checkId));
  if (line) {
    passed += 1;
    results.push({
      label,
      status: 'PASS',
      detail: `${checkId} correctly failed: ${line.slice(5).trim()}`,
    });
  } else {
    failed += 1;
    results.push({
      label,
      status: 'FAIL',
      detail: `${checkId} did NOT fail when the defect was reintroduced`,
    });
  }
  void flagged;
}

// --- baseline: the clean tree must be green -----------------------------
{
  const res = runMarkup();
  if (res.code === 0) {
    passed += 1;
    results.push({ label: 'baseline clean tree passes', status: 'PASS', detail: 'check-markup exits 0' });
  } else {
    failed += 1;
    results.push({ label: 'baseline clean tree passes', status: 'FAIL', detail: 'check-markup already failing' });
  }
}

// --- MRK-14: reintroduce the shadowed `document` prop -------------------
expectCaught(
  'shadowed `document` prop is caught',
  'MRK-14',
  'src/components/SanctionModal.jsx',
  (s) =>
    s
      .replace(
        'export default function SanctionModal({ project, doc: sanctionDoc, loading, onClose, onForward })',
        'export default function SanctionModal({ project, document, loading, onClose, onForward })',
      )
      .replace('const doc = sanctionDoc || {}', 'const doc = document || {}')
);

// --- MRK-15: reintroduce the prop name mismatch -------------------------
expectCaught(
  'prop/call-site name mismatch is caught',
  'MRK-15',
  'src/components/SanctionModal.jsx',
  (s) => s.replace('doc: sanctionDoc,', 'sanctionDocument: sanctionDoc,')
);

// --- MRK-01: reintroduce the undefined setter --------------------------
expectCaught(
  'undeclared setter is caught',
  'MRK-01',
  'src/pages/MPDashboard.jsx',
  // Line endings are CRLF in this tree, so match on the bare call site rather
  // than on a multi-line block.
  (s) => s.replace('setSelectedProject(null)', 'setSelectedPoint(null)')
);

// --- MRK-02: remove the h1 from a page ---------------------------------
expectCaught(
  'a page with two h1 is caught',
  'MRK-02',
  'src/pages/NotFound.jsx',
  (s) => s.replace('<h1 className="text-6xl font-bold text-[#032B5B]">404</h1>', '<h1>404</h1><h1>Not found</h1>')
);

// --- MRK-03: unbind a label -------------------------------------------
expectCaught(
  'unassociated label is caught',
  'MRK-03',
  'src/pages/MPLogin.jsx',
  (s) => s.replace(/htmlFor="mp-username"/, 'data-x="mp-username"')
);

// --- MRK-08: reintroduce `description=` on SectionHeading ---------------
// The anchor is derived, not hardcoded. A previous version matched a literal
// sentence from Methodology.jsx; that copy was later rewritten, the mutation
// became a no-op, and this guard silently stopped being tested.
expectCaught(
  'undeclared SectionHeading prop is caught',
  'MRK-08',
  'src/pages/Methodology.jsx',
  (s) => s.replace(/(<SectionHeading\b[\s\S]*?)\bcopy=/, '$1description=')
);

// --- MRK-09: reintroduce the bare optional chain -----------------------
expectCaught(
  'undefined-printing optional chain is caught',
  'MRK-09',
  'src/pages/NotFound.jsx',
  (s) => s.replace('<p className="text-slate-600 mt-2">{t.notFound}</p>', '<p>{t?.notFound?.missing?.deep}</p>')
);

// --- MRK-12: reintroduce the inline grid override ----------------------
expectCaught(
  'inline grid override is caught',
  'MRK-12',
  'src/pages/HowItWorks.jsx',
  (s) =>
    s.replace(
      "className='pipeline-grid pipeline-grid--steps'",
      "className='pipeline-grid' style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))' }}",
    )
);

// --- MRK-13: reintroduce a track minimum wider than the viewport -------
expectCaught(
  'oversized grid track minimum is caught',
  'MRK-13',
  'src/index.css',
  (s) => s + '\n.rogue{grid-template-columns:repeat(auto-fit,minmax(420px,1fr))}\n'
);

// --- MRK-16: break FormField's group branch ---------------------------
expectCaught(
  'FormField losing fieldset/legend is caught',
  'MRK-16',
  'src/components/citizen/FormField.jsx',
  // The checker strips comments, so the doc comment mentioning "<fieldset>"
  // cannot keep this green on its own.
  (s) => s.replace('<fieldset className={fieldsetClass}>', '<div>').replace('</fieldset>', '</div>')
);

// --- MRK-17: entity-in-string must be caught ------------------------------
// Found: the Leaflet attribution was '&copy; OpenStreetMap', which Leaflet injects
// as HTML, so the map credit rendered literally.
expectCaught(
  'HTML entity inside a JS string is caught',
  'MRK-17',
  'src/components/ConstituencyMap.jsx',
  (s) => s.replace("attribution: '\\u00A9 OpenStreetMap contributors',", "attribution: '&copy; OpenStreetMap',")
);

// --- MRK-20 / MRK-21: the FAQ and CTA regressions -----------------------
expectCaught(
  'a literal plus beside the CSS control is caught',
  'MRK-20',
  'src/pages/Home.jsx',
  (s) => s.replace('<summary>{x[0]}</summary>', '<summary>{x[0]}<span>+</span></summary>'),
);

expectCaught(
  'a restored Firefox disclosure triangle is caught',
  'MRK-20',
  'src/index.css',
  (s) => s.replace('.faq-list summary::marker{content:""}', ''),
);

expectCaught(
  'CTA buttons losing their margin reset is caught',
  'MRK-21',
  'src/index.css',
  (s) => s.replace(/\.cta-card \.hero__actions\{margin-top:0/, '.cta-card .hero__actions{'),
);

// --- validate-schema: a comment must not satisfy a literal token check ---
// Found: 'BreadcrumbList' reported "Present in the @graph" purely because a
// prose comment in App.jsx contained the word.
{
  const VALIDATE = path.join(ROOT, 'scripts', 'validate-schema.mjs');
  const appFile = path.join(ROOT, 'src', 'App.jsx');
  const appOriginal = fs.readFileSync(appFile, 'utf8');
  const injected = appOriginal.replace(
    'return [...nodes, BreadcrumbSchema(path)]',
    "// BreadcrumbList would go here.\n  return [...nodes]",
  );
  if (injected === appOriginal) {
    results.push({
      label: 'comment cannot satisfy validate-schema token check',
      status: 'FAIL',
      detail: 'could not find the crumbs() anchor in App.jsx to mutate',
    });
    failed += 1;
  } else {
    fs.writeFileSync(appFile, injected, 'utf8');
    let out;
    try {
      out = execFileSync(process.execPath, [VALIDATE], { encoding: 'utf8' });
    } catch (e) {
      out = (e.stdout ?? '') + (e.stderr ?? '');
    } finally {
      fs.writeFileSync(appFile, appOriginal, 'utf8');
    }
    // With the call removed and only a comment remaining, the check must NOT
    // report a pass.
    const stillPassing = /PASS\s+BreadcrumbList/.test(out);
    if (!stillPassing) {
      passed += 1;
      results.push({
        label: 'comment cannot satisfy validate-schema token check',
        status: 'PASS',
        detail: 'removing the call stops the PASS even with the name in a comment',
      });
    } else {
      failed += 1;
      results.push({
        label: 'comment cannot satisfy validate-schema token check',
        status: 'FAIL',
        detail: 'validate-schema still reported PASS BreadcrumbList from a comment',
      });
    }
  }
}

// --- report ---
for (const r of results) {
  console.log(`${r.status.padEnd(4)} ${r.label}`);
  console.log(`     ${r.detail}`);
}
console.log('\n' + '-'.repeat(60));
console.log(`${passed} passed, ${failed} failed`);
console.log('-'.repeat(60));
process.exit(failed ? 1 : 0);