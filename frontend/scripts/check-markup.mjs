#!/usr/bin/env node
/**
 * Markup and accessibility regression guard.
 *
 * Catches the structural defects found during the full-tree review:
 * a crash from an undefined setter, a label with no htmlFor, a page with no
 * h1, JSX-only pages whose copy lives in a data module, and dead exports.
 *
 * Run: node scripts/check-markup.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');

const results = [];
const pass = (id, label, detail) => results.push({ id, label, status: 'PASS', detail });
const fail = (id, label, detail, fix) => results.push({ id, label, status: 'FAIL', detail, fix });
const warn = (id, label, detail, fix) => results.push({ id, label, status: 'PARTIAL', detail, fix });

const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else if (/\.(jsx|js)$/.test(e.name)) files.push(full);
  }
})(SRC);

const read = (f) => fs.readFileSync(f, 'utf8');

/**
 * Source with JS comments removed.
 * A literal token inside a comment satisfies a regex without the element
 * existing, so token checks must run against this, not the raw file.
 */
const stripComments = (src) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/^\s*\/\/.*$/gm, ' ')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ');
const rel = (f) => path.relative(ROOT, f);
const pagesDir = path.join(SRC, 'pages');

// --- MRK-01: every referenced setter exists in scope ---------------------
// Found: MPDashboard called setSelectedPoint(), which was never declared, so
// clicking Forward threw a ReferenceError.
{
  const issues = [];
  for (const f of files) {
    const src = read(f);
    if (!/useState\(/.test(src)) continue;
    const declared = new Set(
      [...src.matchAll(/\bconst\s*\[\s*\w+\s*,\s*(\w+)\s*\]\s*=\s*useState/g)].map((m) => m[1])
    );
    // Also allow setters from custom hooks / context.
    const provided = new Set(
      [...src.matchAll(/\b(\w+)\s*[:}]\s*[,)]/g)].map((m) => m[1])
    );
    // Only bare identifiers: exclude member calls (localStorage.setItem()).
    const GLOBALS = new Set(['setTimeout', 'setInterval', 'setImmediate']);
    const called = new Set(
      [...src.matchAll(/(?<![.\w])set[A-Z]\w*\s*\(/g)]
        .map((m) => m[0].replace(/\s*\($/, ''))
        .filter((n) => !GLOBALS.has(n))
    );
    for (const c of called) {
      if (!declared.has(c) && !provided.has(c)) issues.push(`${rel(f)}: ${c}()`);
    }
  }
  issues.length === 0
    ? pass('MRK-01', 'All setters are declared in scope',
        'Every setXxx() call has a matching declaration')
    : fail('MRK-01', 'All setters are declared in scope',
        issues.join('; '), 'An undeclared setter throws a ReferenceError at call time.');
}

// --- MRK-02: exactly one h1 per page --------------------------------------
{
  const issues = [];
  for (const f of fs.readdirSync(pagesDir).filter((x) => x.endsWith('.jsx'))) {
    const src = read(path.join(pagesDir, f));
    const h1 = (src.match(/<h1[\s>]/g) || []).length;
    if (h1 !== 1) issues.push(`${f}: ${h1} h1`);
  }
  issues.length === 0
    ? pass('MRK-02', 'Exactly one h1 per page', `All ${fs.readdirSync(pagesDir).filter((x) => x.endsWith('.jsx')).length} pages`)
    : fail('MRK-02', 'Exactly one h1 per page', issues.join('; '),
        'A page with no h1 has no top-level heading for assistive tech.');
}

// --- MRK-03: every label has htmlFor --------------------------------------
{
  const issues = [];
  for (const f of files) {
    const src = read(f);
    for (const m of src.matchAll(/<label\b([^>]*?)>([\s\S]{0,600}?)<\/label>/g)) {
      const attrs = m[1];
      // Bound explicitly, or it wraps its own control (implicit association).
      if (/htmlFor=/.test(attrs)) continue;
      if (/<input|<select|<textarea/.test(m[2])) continue;
      issues.push(`${rel(f)}: <label> with no htmlFor and no nested control`);
    }
  }
  issues.length === 0
    ? pass('MRK-03', 'Labels are associated with controls',
        'Every <label> either has htmlFor or wraps its control')
    : fail('MRK-03', 'Labels are associated with controls',
        issues.join('; '), 'Screen readers announce an unassociated control as unlabelled.');
}

// --- MRK-04: FormField clones an id onto its child -----------------------
{
  const ff = stripComments(read(path.join(SRC, 'components', 'citizen', 'FormField.jsx')));
  // Accept either the direct childId or the controlId alias, and require that
  // the htmlFor target is the same id the child was cloned with.
  const usesId = /htmlFor=\{(?:childId|controlId)\}/.test(ff);
  const clones = /cloneElement/.test(ff);
  const sameId = /id=\{(?:childId|controlId)\}/.test(ff);
  usesId && clones && sameId
    ? pass('MRK-04', 'FormField generates label associations',
        'FormField assigns a useId() id to its child and links the label with htmlFor')
    : fail('MRK-04', 'FormField generates label associations',
        'FormField must clone the child with an id and point htmlFor at it',
        'Every citizen-portal field depends on this.');
}

// --- MRK-05: JSX pages that render from a data module still have copy ----
// Found: moving the FAQ array into data/faqData.js left the page with 84
// measurable words, which the audit read as thin content.
{
  const issues = [];
  for (const f of fs.readdirSync(pagesDir).filter((x) => x.endsWith('.jsx'))) {
    const src = read(path.join(pagesDir, f));
    const dataImport = /from\s+['"]([^'"]*data[/\\][a-zA-Z0-9_]+)['"]/.exec(src);
    if (!dataImport) continue;
    const spec = dataImport[1].replace(/\\/g, '/');
    const mod = path.resolve(path.dirname(path.join(pagesDir, f)), spec + '.js');
    if (!fs.existsSync(mod)) {
      issues.push(`${f}: imports ${dataImport[1]} which does not exist`);
      continue;
    }
    const modSrc = read(mod);
    const pageWords = (src.replace(/<[^>]*>/g, ' ').match(/[A-Za-z]{3,}/g) || []).length;
    const modWords = (modSrc.match(/[A-Za-z]{3,}/g) || []).length;
    if (pageWords < 120 && modWords < 50) {
      issues.push(`${f}: page ${pageWords} words + data module ${modWords} words is thin`);
    }
  }
  issues.length === 0
    ? pass('MRK-05', 'Data-module pages carry their content',
        'Pages importing from /data/ have copy in either the page or the module')
    : fail('MRK-05', 'Data-module pages carry their content', issues.join('; '),
        'Content moved to a data module must still be measurable.');
}

// --- MRK-06: no fabricated place names in the geo lists ------------------
{
  const trans = read(path.join(SRC, 'i18n', 'translations.js'));
  const issues = [];
  const tsM = /TS_CONSTITUENCIES = \[([^\]]*)\]/.exec(trans);
  if (tsM) {
    const bad = [...tsM[1].matchAll(/'([^']+)'/g)].map((m) => m[1])
      .filter((n) => /Zachariah|Round Rock|Austin/i.test(n));
    if (bad.length) issues.push(`TS_CONSTITUENCIES: ${bad.join(', ')}`);
  }
  const gjM = /GJ_DISTRICTS = \[([^\]]*)\]/.exec(trans);
  if (gjM) {
    const names = [...gjM[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
    for (const n of names) {
      for (const o of names) {
        if (n !== o && o.startsWith(n) && n.length >= 4) issues.push(`GJ_DISTRICTS: '${n}' and '${o}'`);
      }
    }
  }
  issues.length === 0
    ? pass('MRK-06', 'Geo lists contain only real places',
        'No non-Indian place names or truncated duplicates')
    : fail('MRK-06', 'Geo lists contain only real places', issues.join('; '),
        'Citizens submit whatever this list offers.');
}

// --- MRK-07: Header accepts the props callers pass ----------------------
{
  const header = read(path.join(SRC, 'components', 'Header.jsx'));
  const sig = /function Header\(\{([^}]*)\}\)/.exec(header);
  const declared = new Set((sig ? sig[1] : '').split(',').map((s) => s.trim().split('=')[0].trim()).filter(Boolean));
  const issues = [];
  for (const f of files) {
    const src = read(f);
    for (const m of src.matchAll(/<Header\b([^>]*)\/>/g)) {
      for (const p of m[1].matchAll(/(\w+)=/g)) {
        if (!declared.has(p[1])) issues.push(`${rel(f)}: <Header ${p[1]}=...>`);
      }
    }
  }
  issues.length === 0
    ? pass('MRK-07', 'Header props are all declared',
        `Header accepts: ${[...declared].join(', ')}`)
    : fail('MRK-07', 'Header props are all declared',
        issues.join('; '),
        'An undeclared prop is silently discarded, so the caller thinks it rendered.');
}

// --- MRK-08: SectionHeading uses declared prop names ---------------------
{
  const sh = read(path.join(SRC, 'components', 'SectionHeading.jsx'));
  const sig = /function SectionHeading\(\{([^}]*)\}\)/.exec(sh);
  const declared = new Set((sig ? sig[1] : '').split(',').map((s) => s.trim().split('=')[0].trim()).filter(Boolean));
  const issues = [];
  for (const f of files) {
    const src = read(f);
    for (const m of src.matchAll(/<SectionHeading\b([\s\S]*?)\/>/g)) {
      for (const p of m[1].matchAll(/\b(\w+)=/g)) {
        if (!declared.has(p[1])) issues.push(`${rel(f)}: <SectionHeading ${p[1]}=...>`);
      }
    }
  }
  issues.length === 0
    ? pass('MRK-08', 'SectionHeading props are all declared',
        `SectionHeading accepts: ${[...declared].join(', ')}`)
    : fail('MRK-08', 'SectionHeading props are all declared',
        issues.join('; '),
        'Found: description= passed where the component expects copy=, so the text never rendered.');
}

// --- MRK-09: no optional-chained value rendered without a fallback ------
// Found: MPDashboard rendered feed.mp_office?.constituency with no fallback,
// printing the literal "undefined".
{
  const issues = [];
  for (const f of files) {
    const src = read(f);
    for (const m of src.matchAll(/\{([a-zA-Z_$][\w$]*(?:\?\.[\w$]+)+)\}/g)) {
      const expr = m[1];
      if (!/\?\./.test(expr)) continue;
      // A bare `{a?.b}` with no || fallback renders undefined.
      const line = src.slice(0, m.index).split('\n').pop() + expr;
      if (!/\|\|/.test(line) && !/&&/.test(line) && !/\?\s/.test(line) && !/join|String\(|Number\(/.test(line)) {
        issues.push(`${rel(f)}: {${expr}} has no fallback`);
      }
    }
  }
  issues.length === 0
    ? pass('MRK-09', 'Optional-chained values render a fallback',
        'No bare {a?.b} that can print "undefined"')
    : fail('MRK-09', 'Optional-chained values render a fallback',
        issues.join('; '), 'Add a || fallback so the UI never shows the string undefined.');
}

// --- MRK-10: FormField hints are wired via aria-describedby -------------
{
  const ff = read(path.join(SRC, 'components', 'citizen', 'FormField.jsx'));
  const describedBy = /aria-describedby/.test(ff);
  const hintId = /hintId/.test(ff);
  describedBy && hintId
    ? pass('MRK-10', 'FormField hints reach assistive tech',
        'Hint text is given an id and linked with aria-describedby')
    : fail('MRK-10', 'FormField hints reach assistive tech',
        'FormField renders hint text without aria-describedby',
        'A screen reader will not announce the hint.');
}

// --- MRK-11: the six workflow steps are unique and ordered ---------------
{
  const hw = read(path.join(pagesDir, 'HowItWorks.jsx'));
  const nums = [...hw.matchAll(/\bn:\s*'(\d+)'/g)].map((m) => m[1]);
  const uniq = new Set(nums);
  const titles = [...hw.matchAll(/\btitle:\s*'([^']+)'/g)].map((m) => m[1]);
  const dupTitles = titles.filter((t, i) => titles.indexOf(t) !== i);
  if (nums.length === 6 && uniq.size === 6 && dupTitles.length === 0) {
    pass('MRK-11', 'Workflow steps are unique and ordered',
      `6 steps, unique numbering (${nums.join(',')}), unique titles`);
  } else {
    fail('MRK-11', 'Workflow steps are unique and ordered',
      `steps=${nums.length} unique=${uniq.size} duplicateTitles=${dupTitles.join(', ')}`,
      'Numbering collisions make the grid look broken.');
  }
}

// --- MRK-12: no inline style overriding a CSS grid -----------------------
// Found: HowItWorks carried gridTemplateColumns inline, which overrode the
// mobile media query and forced a 300px minimum, causing horizontal overflow.
{
  const issues = [];
  for (const f of fs.readdirSync(pagesDir).filter((x) => x.endsWith('.jsx'))) {
    const src = stripComments(read(path.join(pagesDir, f)));
    if (/gridTemplateColumns/.test(src)) {
      issues.push(`${f}: inline gridTemplateColumns overrides the mobile media query`);
    }
  }
  issues.length === 0
    ? pass('MRK-12', 'No inline grid overrides', 'Grid layout is controlled by CSS only')
    : fail('MRK-12', 'No inline grid overrides', issues.join('; '),
        'An inline style beats the stylesheet, so responsive rules never apply.');
}

// --- MRK-13: grid track minimums cannot exceed the viewport --------------
{
  const css = stripComments(read(path.join(ROOT, 'src', 'index.css')));
  const bad = [...css.matchAll(/minmax\(\s*(\d{3,})px\s*,/g)].map((m) => Number(m[1]));
  const tooWide = bad.filter((px) => px > 320);
  tooWide.length === 0
    ? pass('MRK-13', 'Grid tracks fit small viewports',
        bad.length ? `${bad.length} minmax() track(s), all <= 320px` : 'no fixed minmax tracks')
    : fail('MRK-13', 'Grid tracks fit small viewports',
        `minmax() minimum of ${tooWide.join(', ')}px overflows a 320px viewport`,
        'Use min(100%, Npx) so the track can shrink.');
}

// --- MRK-14: no prop shadows a browser global --------------------------
// Found: SanctionModal destructured a prop named `document`, so the scroll-lock
// effect ran `document.body.style.overflow` against the payload object and threw.
{
  const GLOBALS = [
    'document', 'window', 'navigator', 'location', 'history', 'console',
    'fetch', 'localStorage', 'sessionStorage', 'alert', 'name', 'length', 'top',
  ];
  const issues = [];
  for (const f of files) {
    const src = read(f);
    // Destructured props and parameter lists of any function component.
    for (const m of src.matchAll(/function\s+[A-Za-z0-9_]+\s*\(\s*\{([\s\S]{0,300}?)\}\s*\)/g)) {
      for (const part of m[1].split(',')) {
        const name = part.split(':')[0].split('=')[0].trim();
        if (!GLOBALS.includes(name)) continue;
        // A shadow is only a defect when the component also touches the real
        // global. A prop called \`name\` with no window.name access is fine.
        const body = src.slice(m.index + m[0].length);
        const usesGlobal = new RegExp('(?<![\\w$.])' + name + '\\.').test(body);
        if (usesGlobal) issues.push(`${rel(f)}: \`${name}\` prop shadows the global and the file uses \${name}.*`);
      }
    }
  }
  issues.length === 0
    ? pass('MRK-14', 'No prop shadows a browser global',
        'No component parameter shadows document/window/navigator')
    : fail('MRK-14', 'No prop shadows a browser global', issues.join('; '),
        'A shadowed `document` makes document.body throw inside effects.');
}

// --- MRK-15: component props are consumed with the name they were passed --
// Found: SanctionModal was passed document={...} while destructuring `document`.
// Renaming one side silently breaks the other.
{
  const issues = [];
  for (const f of files) {
    const src = read(f);
    const sig =
      /export\s+default\s+function\s+[A-Za-z0-9_]+\s*\(\s*\{([\s\S]*?)\}\s*\)/.exec(src) ||
      /export\s+default\s+function\s+[A-Za-z0-9_]+\s*\(\s*\{([\s\S]*?)\}\s*\)/.exec(src);
    if (!sig) continue;
    // `{ variant = 'citizen' }` must yield `variant`, not
    // `variant = 'citizen'`. Split on the default value as well as on rename.
    const accepted = new Set(
      sig[1]
        .split(',')
        .map((part) => part.split(':')[0].split('=')[0].trim())
        .filter((n) => /^[A-Za-z0-9_]+$/.test(n))
    );
    // Find JSX usages of this component across the tree.
    const name = /export\s+default\s+function\s+([A-Za-z0-9_]+)/.exec(src)?.[1];
    if (!name) continue;
    for (const other of files) {
      if (other === f) continue;
      const osrc = read(other);
      for (const m of osrc.matchAll(new RegExp(`<${name}\\b([\\s\\S]*?)/>`, 'g'))) {
        for (const p of m[1].matchAll(/(?:^|\s)([A-Za-z0-9_]+)=/g)) {
          const prop = p[1];
          if (prop === 'key' || prop === 'className') continue;
          if (!accepted.has(prop)) issues.push(`${rel(other)}: <${name} ${prop}=...> not accepted`);
        }
      }
    }
  }
  issues.length === 0
    ? pass('MRK-15', 'Component props match their call sites',
        'Every prop passed to a component is in its parameter list')
    : fail('MRK-15', 'Component props match their call sites', issues.join('; '),
        'An unaccepted prop is silently discarded.');
}

// --- MRK-16: FormField renders groups as fieldset/legend -----------------
// Found: the language and severity button rows are wrapped in a div, so a
// <label for> pointed at a non-labelable element and the group had no name.
{
  const ff = stripComments(read(path.join(SRC, 'components', 'citizen', 'FormField.jsx')));
  const hasFieldset = /<fieldset/.test(ff);
  const hasLegend = /<legend/.test(ff);
  const labelable = /LABELABLE = new Set/.test(ff);
  hasFieldset && hasLegend && labelable
    ? pass('MRK-16', 'FormField handles control groups',
        'Non-labelable children render as fieldset/legend; labelable children get htmlFor')
    : fail('MRK-16', 'FormField handles control groups',
        'FormField must branch on fieldset/legend for groups and htmlFor for single controls',
        'A <label for> pointing at a <div> is inert.');
}

// --- MRK-17: no HTML entity inside a JS string literal -------------------
// Found: Leaflet's attribution option was '&copy; OpenStreetMap'. Leaflet
// injects that string as HTML, but React never decodes entities inside a JS
// string, so the map credit rendered literally as "&copy; OpenStreetMap".
{
  const ENTITIES = '&(copy|nbsp|mdash|ndash|middot|times|amp|lt|gt|quot|apos|hellip|rsquo|lsquo|ldquo|rdquo);';
  const issues = [];
  for (const f of files) {
    const src = stripComments(read(f));
    src.split(/\r?\n/).forEach((line, i) => {
      // A quoted string literal on this line that contains an entity.
      for (const m of line.matchAll(new RegExp(`(['"\`][^'"\`]*${ENTITIES}[^'"\`]*)['"\`]`, 'g'))) {
        issues.push(`${rel(f)}:${i + 1}  ${m[1].slice(0, 60)}`);
      }
    });
  }
  issues.length === 0
    ? pass('MRK-17', 'No HTML entity inside a JS string literal',
        'JS strings use real characters; entities are only used in JSX text, which React decodes')
    : fail('MRK-17', 'No HTML entity inside a JS string literal', issues.join('; '),
        'React does not decode entities in JS strings, so they render as literal text. Use the character.');
}

// --- MRK-18: heading levels never skip ---------------------------------
// Found: the six Methodology guardrails were <h2> inside a <section> that
// already carried an <h2> heading, so a screen reader's heading list presented
// them as top-level sections equal in rank to their own parent. It also
// contradicted the Accessibility page, which promises a consistent H2/H3
// hierarchy.
{
  const issues = [];
  for (const f of fs.readdirSync(pagesDir).filter((x) => x.endsWith('.jsx'))) {
    const src = stripComments(read(path.join(pagesDir, f)));
    // Sequence of heading levels in document order. <SectionHeading> renders an
    // <h2 className='section-title'>, so it must count as level 2 or every page
    // looks like it skips from h1 straight to h3.
    const levels = [...src.matchAll(/<SectionHeading\b|<h([1-6])\b/g)].map((m) =>
      m[0].startsWith('<Section') ? 2 : Number(m[1]),
    );
    let prev = 0;
    levels.forEach((lv, i) => {
      if (prev && lv > prev + 1) {
        issues.push(`${f}: h${prev} -> h${lv} at heading ${i + 1} skips a level`);
      }
      prev = lv;
    });
  }
  issues.length === 0
    ? pass('MRK-18', 'Heading levels never skip',
        'every page descends one level at a time from its single h1')
    : fail('MRK-18', 'Heading levels never skip', issues.join('; '),
        'A skipped level reads as a peer section to assistive tech.');
}

// --- MRK-19: section headings all carry a lead paragraph -----------------
// About and Privacy opened every section cold with a bare <ul> or <p>, which is
// the main reason they read as thinner than Methodology independent of wording.
{
  const pages = ['Home.jsx', 'HowItWorks.jsx', 'Methodology.jsx', 'FAQ.jsx',
    'About.jsx', 'Privacy.jsx', 'Accessibility.jsx'];
  const issues = [];
  const detail = [];
  for (const f of pages) {
    const file = path.join(pagesDir, f);
    if (!fs.existsSync(file)) continue;
    const src = stripComments(read(file));
    const heads = [...src.matchAll(/<SectionHeading\b([\s\S]*?)\/>/g)].map((m) => m[1]);
    const withCopy = heads.filter((h) => /\bcopy=/.test(h)).length;
    detail.push(`${f} ${withCopy}/${heads.length}`);
    if (heads.length >= 3 && withCopy / heads.length < 0.8) {
      issues.push(`${f}: only ${withCopy}/${heads.length} sections have a lead paragraph`);
    }
  }
  issues.length === 0
    ? pass('MRK-19', 'Content sections carry a lead paragraph',
        detail.join(', '))
    : fail('MRK-19', 'Content sections carry a lead paragraph', issues.join('; '),
        'A section that opens cold with a bare list gives the reader no orientation.');
}

// --- MRK-20: exactly one disclosure control per FAQ row ----------------
// Found: the accordion CSS renders a "+" via summary::after, and Home.jsx also
// carried a literal <span>+</span> inside its summary, so the homepage showed
// two plus symbols while the FAQ page showed one. A second marker was also left
// visible in Firefox because only the WebKit one was hidden.
{
  const issues = [];
  for (const f of files) {
    const src = stripComments(read(f));
    for (const m of src.matchAll(/<summary\b[^>]*>([\s\S]{0,400}?)<\/summary>/g)) {
      // A literal glyph inside the summary duplicates the ::after control.
      if (/[+−\-–]\s*<\/span>|>\s*[+−]\s*</.test(m[1])) {
        issues.push(`${rel(f)}: <summary> contains a literal +/- alongside the CSS control`);
      }
    }
  }
  const css = stripComments(read(path.join(ROOT, 'src', 'index.css')));
  const webkit = /\.faq-list summary::-webkit-details-marker\{display:none\}/.test(css);
  const marker = /\.faq-list summary::marker\{content:""\}/.test(css);
  if (!webkit || !marker) {
    issues.push(`index.css hides only ${webkit ? 'the WebKit marker' : 'neither marker'}; Firefox draws its own triangle`);
  }
  issues.length === 0
    ? pass('MRK-20', 'One disclosure control per FAQ row',
        'CSS supplies the +/-, no literal glyph, and both marker implementations are hidden')
    : fail('MRK-20', 'One disclosure control per FAQ row', issues.join('; '),
        'Two plus symbols leave the user unsure what to click.');
}

// --- MRK-21: CTA buttons align with the card heading ---------------------
// Found: .hero__actions carries margin-top:28px for its hero context. Inside
// .cta-card, which is align-items:center, that margin pushed the buttons out of
// line with the heading beside them on six pages.
{
  const css = stripComments(read(path.join(ROOT, 'src', 'index.css')));
  const zeroes = /\.cta-card \.hero__actions\{[^}]*margin-top:0/.test(css);
  zeroes
    ? pass('MRK-21', 'CTA buttons align with their card heading',
        '.cta-card .hero__actions overrides the hero margin-top')
    : fail('MRK-21', 'CTA buttons align with their card heading',
        '.cta-card .hero__actions does not reset margin-top, so the buttons sit lower than the text',
        'Add .cta-card .hero__actions{margin-top:0}.');
}

// --- report ---
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