#!/usr/bin/env node
/**
 * Measured contrast check.
 *
 * Three real defects were found by computing ratios rather than reading the
 * stylesheet:
 *
 *   focus ring    focus:ring-[#F28C0F]/40 is 1.43:1 on white. WCAG 2.2 SC 2.4.11
 *                 asks 3:1 for a focus indicator. The inputs also set
 *                 focus:outline-none, which suppressed the global outline too,
 *                 so the portal's fields had no compliant focus state at all.
 *   track button  white on #F28C0F is 2.46:1, under the 4.5:1 AA threshold for
 *                 body text. .button--primary already uses #142944 here.
 *   field hint    text-slate-400 on white is 2.56:1. Hints tell citizens where
 *                 to find their reference ID, so they are not decorative text.
 *
 * This measures the pairs rather than asserting them, so a future colour change
 * has to be re-justified instead of quietly failing.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

const css = read('src/index.css');

/**
 * Strip comments before matching anything.
 *
 * The suppressor check below greps for `outline: none`. FormField.jsx explains in
 * a comment that it deliberately does NOT set `focus:outline-none`, and the
 * comment matched — so the check failed on the file that had fixed the problem.
 * A token match that a comment can satisfy is not a check.
 */
const noComments = (src) =>
  (src ?? '')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/^\s*\/\/.*$/gm, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, ' ');

const formField = noComments(read('src/components/citizen/FormField.jsx'));
const portal = noComments(read('src/pages/CitizenPortal.jsx'));
const login = noComments(read('src/pages/MPLogin.jsx'));
const plainCss = noComments(css);

let passed = 0;
const results = [];
const ok = (l, d) => { passed += 1; results.push({ l, d, s: 'PASS' }); };
const bad = (l, d) => { results.push({ l, d, s: 'FAIL' }); };

/** WCAG relative luminance. */
function luminance(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

function ratio(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/** Flatten `fg` at `alpha` over `bg`, the way a browser composites it. */
function over(fg, bg, alpha) {
  const parse = (h) => {
    const n = parseInt(h.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const f = parse(fg), b = parse(bg);
  return (
    '#' +
    f.map((v, i) => Math.round(v * alpha + b[i] * (1 - alpha)).toString(16).padStart(2, '0')).join('')
  );
}

// ---------------------------------------------------------------- focus ring
{
  const m = /:focus-visible\{([^}]*)\}/.exec(plainCss);
  if (!m) {
    bad('the focus indicator clears 3:1', 'no :focus-visible rule found in index.css');
  } else {
    const rule = m[1];
    const outline = /outline:\s*\d+px solid (#[0-9a-f]{3,8})/i.exec(rule);
    const halo = /box-shadow:[^;]*?rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)/i.exec(rule);

    if (!outline) {
      bad('the focus indicator clears 3:1', 'the :focus-visible rule has no solid outline colour');
    } else {
      // The outline must clear 3:1 against every light surface the site uses.
      const light = { white: '#ffffff', canvas: '#F7F8FA', soft: '#EAF3FF', band: '#EEF3F8' };
      const worst = Object.entries(light)
        .map(([k, v]) => [k, ratio(outline[1], v)])
        .sort((a, b) => a[1] - b[1]);
      const [name, r] = worst[0];
      r >= 3
        ? ok('the focus outline clears 3:1 on light surfaces',
            `${outline[1]}: worst is ${name} at ${r.toFixed(2)}:1`)
        : bad('the focus outline clears 3:1 on light surfaces',
            `${outline[1]} is ${r.toFixed(2)}:1 on ${name}, below 3:1`);

      // On the dark surfaces only the halo can carry it.
      if (halo) {
        const hex = '#' + [halo[1], halo[2], halo[3]]
          .map((v) => Number(v).toString(16).padStart(2, '0')).join('');
        const dark = { navy: '#0B2A52', hero: '#081E3B', footer: '#081E3B' };
        const dworst = Object.entries(dark)
          .map(([k, v]) => [k, ratio(hex, v)])
          .sort((a, b) => a[1] - b[1]);
        const [dn, dr] = dworst[0];
        dr >= 3
          ? ok('the focus halo clears 3:1 on dark surfaces',
              `${hex}: worst is ${dn} at ${dr.toFixed(2)}:1`)
          : bad('the focus halo clears 3:1 on dark surfaces',
              `${hex} is ${dr.toFixed(2)}:1 on ${dn}, below 3:1`);
      } else {
        bad('the focus halo clears 3:1 on dark surfaces',
            'no halo in the :focus-visible rule, so focus fails on the navy hero');
      }
    }

    // A halo alone is not enough if nothing carries it on light surfaces.
    const noHalo = !halo;
    noHalo
      ? bad('focus is visible on dark surfaces', 'the rule has only an outline, which disappears on navy')
      : ok('focus is visible on dark surfaces', 'outline for light surfaces, halo for dark');
  }

  // Nothing may switch the outline off. outline-none was suppressing the global
  // ring on every portal and login field.
  const suppressors = [];
  if (/focus:outline-none|outline:\s*none|outline:\s*0\b/.test(formField)) suppressors.push('FormField.jsx');
  if (/focus:outline-none|outline:\s*none|outline:\s*0\b/.test(portal)) suppressors.push('CitizenPortal.jsx');
  if (/focus:outline-none|outline:\s*none|outline:\s*0\b/.test(login)) suppressors.push('MPLogin.jsx');
  if (/focus:outline-none|outline:\s*none|outline:\s*0\b/.test(plainCss)) suppressors.push('index.css');
  suppressors.length === 0
    ? ok('no control suppresses the focus outline', 'focus-visible survives everywhere')
    : bad('no control suppresses the focus outline',
        `${suppressors.join(', ')} remove it, leaving those controls with no compliant focus state`);

  // Any half-opacity ring is a weak indicator; flag one if it comes back.
  const weak = [...(formField + portal + login).matchAll(/focus:ring-\[?#?[0-9A-Fa-f]{3,8}\]?\/(\d{1,2})\b/g)]
    .filter((m) => Number(m[1]) < 100);
  weak.length === 0
    ? ok('no translucent focus ring', 'every focus affordance is fully opaque')
    : bad('no translucent focus ring',
        weak.map((m) => `${m[0]} composites to ${ratio(over('#F28C0F', '#ffffff', Number(m[1]) / 100), '#ffffff').toFixed(2)}:1`).join('; '));
}

// ------------------------------------------------------- track button colours
{
  // Every interactive element's own className, matched across lines.
  //
  // Two earlier attempts at this were wrong in opposite directions. Scanning
  // per-line reported the decorative orange dot on each Section heading and
  // light-tinted cards whose text is set by a child, so it cried wolf. Taking a
  // single regex hit passed while the main grievance submit button — the primary
  // action of the whole site — was still white-on-orange at 2.46:1.
  //
  // So: match real <button> and <a> elements, take each element's own className,
  // and skip anything that is not an explicit background colour. Text colour
  // defaults to white, because inheriting white onto a saturated background is
  // the failure mode worth catching.
  const files = ['src/pages/CitizenPortal.jsx', 'src/pages/MPLogin.jsx',
    'src/pages/MPDashboard.jsx', 'src/components/Header.jsx', 'src/components/Footer.jsx'];
  const offenders = [];
  let measured = 0;

  for (const f of files) {
    let src;
    try { src = noComments(read(f)); } catch { continue; }
    for (const m of src.matchAll(/<(button|a)\b([^>]*)>/g)) {
      const cls = /className=(?:"([^"]*)"|\{`([^`]*)`\}|\{'([^']*)'\})/.exec(m[2]);
      const classes = cls ? (cls[1] ?? cls[2] ?? cls[3] ?? '') : '';
      if (!classes) continue;
      const bg = /bg-\[#([0-9A-Fa-f]{6})\]/.exec(classes);
      if (!bg) continue;                 // no explicit background: inherits, not a pairing we own
      const explicit = /text-\[#([0-9A-Fa-f]{6})\]/.exec(classes);
      const white = /\btext-white\b/.test(classes);
      const fg = explicit ? '#' + explicit[1] : '#ffffff';
      measured += 1;
      const r = ratio('#' + bg[1], fg);
      if (r < 4.5) {
        offenders.push(`${path.basename(f)} <${m[1]}> #${bg[1]} + ${white ? 'white' : fg} = ${r.toFixed(2)}:1`);
      }
    }
  }

  offenders.length === 0
    ? ok('every button on a coloured background clears 4.5:1',
        `${measured} explicit background/text pairing(s) measured, all pass`)
    : bad('every button on a coloured background clears 4.5:1', offenders.join('; '));
}

// -------------------------------------------------------------- field hint
{
  const m = /const hintClass = '([^']+)'/.exec(formField);
  const colour = m && /text-slate-(\d{3})/.exec(m[1]);
  if (!colour) {
    bad('the field hint clears 4.5:1', 'hintClass no longer names a slate shade; re-measure it');
  } else {
    const shades = { 400: '#94A3B8', 500: '#64748B', 600: '#475569', 700: '#334155' };
    const hex = shades[colour[1]];
    const r = hex ? ratio(hex, '#ffffff') : 0;
    r >= 4.5
      ? ok('the field hint clears 4.5:1', `${hex} on white is ${r.toFixed(2)}:1`)
      : bad('the field hint clears 4.5:1',
          `${hex ?? 'slate-' + colour[1]} on white is ${r.toFixed(2)}:1, below 4.5:1`);
  }
}

const failed = results.filter((r) => r.s === 'FAIL').length;
for (const r of results) console.log(`${r.s.padEnd(4)} ${r.l}\n     ${r.d}`);
console.log('\n' + '-'.repeat(64));
console.log(`${passed} passed, ${failed} failed`);
console.log('-'.repeat(64));
process.exit(failed ? 1 : 0);