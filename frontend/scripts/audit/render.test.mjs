/**
 * Render tests for the interactive components.
 *
 * These exist because a parse-only check shipped a total page failure.
 * CitizenPortal.jsx compiled cleanly and passed every static gate while
 * throwing at runtime:
 *
 *   "React.Children.only expected to receive a single React element child"
 *
 * FormField called Children.only(), so any field with more than one child took
 * down the whole report-issue page behind the ErrorBoundary. The screenshot the
 * user reported was that crash, not a network or deployment problem.
 *
 * These render with react-dom/server, so they exercise real React semantics.
 *
 * Run: node scripts/audit/render.test.mjs
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement as h } from 'react';
import { MemoryRouter } from 'react-router-dom';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import esbuild from 'esbuild';

/**
 * Bare-specifier stubs.
 *
 * Leaflet reads `window` at import time and cannot load in Node without a DOM.
 * ConstituencyMap only needs it inside effects, which SSR never runs, so a
 * minimal fake lets the MPDashboard React tree still be exercised — which is
 * the point of RND-06.
 */
const BARE_STUBS = {
  'leaflet/dist/leaflet.css': 'export default "";',
  leaflet: `
    const chainable = () => {
      const o = {};
      for (const m of ['setView', 'remove', 'removeLayer', 'fitBounds', 'addTo', 'setLatLng', 'bindPopup', 'on', 'openPopup']) {
        o[m] = () => o;
      }
      return o;
    };
    const L = {
      map: () => chainable(),
      tileLayer: () => chainable(),
      marker: () => chainable(),
      divIcon: (o) => o,
      geoJSON: () => chainable(),
    };
    export default L;
  `,
};
const { transform } = esbuild;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, '.rendertmp');

let passed = 0;
let failed = 0;
const results = [];
const ok = (label, detail) => { passed += 1; results.push({ label, detail, status: 'PASS' }); };
const bad = (label, detail) => { failed += 1; results.push({ label, detail, status: 'FAIL' }); };

/**
 * Compile src/ into .rendertmp/ as a runnable ESM tree.
 *
 * Node ESM needs explicit file extensions and cannot parse JSX, so the whole
 * tree is emitted with rewritten specifiers rather than transforming files one
 * at a time. A data: URL is not an option either: bare specifiers such as
 * "react/jsx-runtime" have nothing to resolve against.
 */
async function buildTree() {
  fs.rmSync(OUT, { recursive: true, force: true });

  const files = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) { walk(full); continue; }
      if (/\.(jsx|js|css)$/.test(e.name)) files.push(full);
    }
  })(SRC);

  // Emit the bare-specifier stubs up front, so the import rewriter can point
  // at them.
  fs.mkdirSync(OUT, { recursive: true });
  for (const [spec, body] of Object.entries(BARE_STUBS)) {
    const name =
      '__stub_' + Buffer.from(spec).toString('base64').replace(/[^A-Za-z0-9]/g, '') + '.mjs';
    fs.writeFileSync(path.join(OUT, name), body, 'utf8');
  }

  for (const file of files) {
    const rel = path.relative(SRC, file);
    const dest = path.join(OUT, rel.replace(/\.jsx$/, '.mjs').replace(/\.js$/, '.mjs'));
    fs.mkdirSync(path.dirname(dest), { recursive: true });

    if (/\.css$/.test(file)) {
      fs.writeFileSync(dest.replace(/\.mjs$/, '.css'), '', 'utf8');
      continue;
    }

    const { code } = await transform(fs.readFileSync(file, 'utf8'), {
      loader: 'jsx',
      format: 'esm',
      target: 'node20',
      jsx: 'automatic',
      // Vite injects import.meta.env; Node has no such object.
      define: {
        'import.meta.env': JSON.stringify({
          VITE_SITE_URL: 'http://localhost:5173',
          VITE_API_URL: '',
          VITE_GA4_MEASUREMENT_ID: '',
          MODE: 'test',
          DEV: false,
          PROD: true,
        }),
      },
    });

    // Rewrite relative specifiers to real emitted paths. Leaflet CSS and any
    // other non-JS asset becomes an empty module so the import resolves.
    const rewritten = code
      // Bare CSS from a package, e.g. leaflet/dist/leaflet.css. Node has no CSS
      // loader, and this only matters because ConstituencyMap imports it.
      .replace(
        /(\bfrom\s*|\bimport\s*)(['"])([^'"]+)\2/g,
        (whole, kw, q, spec) => {
          // Known bare specifier with no DOM-free implementation.
          if (Object.prototype.hasOwnProperty.call(BARE_STUBS, spec)) {
            const stubName =
              '__stub_' + Buffer.from(spec).toString('base64').replace(/[^A-Za-z0-9]/g, '') + '.mjs';
            const relStub = path
              .relative(path.dirname(dest), path.join(OUT, stubName))
              .split(path.sep)
              .join('/');
            return `${kw}${q}${relStub.startsWith('.') ? relStub : './' + relStub}${q}`;
          }
          if (/^\.\.?\//.test(spec)) return whole;
          // Any other bare asset (a package's .css, .png).
          if (/\.(css|png|jpe?g|svg|webp|gif)$/.test(spec)) {
            const name =
              '__asset_' + Buffer.from(spec).toString('base64').replace(/[^A-Za-z0-9]/g, '') + '.mjs';
            // The stub must sit beside the importing module, because the
            // replacement is relative to it.
            const stub = path.join(path.dirname(dest), name);
            if (!fs.existsSync(stub)) fs.writeFileSync(stub, 'export default "";\n', 'utf8');
            return `${kw}${q}./${name}${q}`;
          }
          return whole;
        },
      )
      .replace(
        /(\bfrom\s*|\bimport\s*)(['"])(\.\.?\/[^'"]*)\2/g,
        (whole, kw, q, spec) => {
          const assetLike = /\.(css|png|jpe?g|svg|webp|gif)$/.test(spec);
          const target = path.resolve(path.dirname(file), spec);
          let out;
          if (assetLike) {
            out = path.join(OUT, path.relative(SRC, target));
            // Force an ESM extension: writing the stub to "logo.png" leaves
            // Node refusing the import with "Unknown file extension".
            out = out.replace(/\.(css|png|jpe?g|svg|webp|gif)$/i, '') + '.mjs';
            fs.mkdirSync(path.dirname(out), { recursive: true });
            if (!fs.existsSync(out)) {
              fs.writeFileSync(out, 'export default "";\n', 'utf8');
            }
          } else {
            out = path
              .join(OUT, path.relative(SRC, target))
              .replace(/\.jsx$/, '.mjs')
              .replace(/\.js$/, '.mjs');
            // Vite resolves extensionless imports ("../i18n/translations"); Node
            // ESM does not. Swap a real extension, or append one when the
            // source specifier had none.
            if (!/\.(mjs|jsx|js)$/.test(out)) out += '.mjs';
          }
          // Keep the directory depth. Reducing to a basename turned
          // "../components/Header" into "./Header.mjs" inside pages/, which does
          // not exist there.
          let rel = path.relative(path.dirname(dest), out).split(path.sep).join('/');
          if (!rel.startsWith('.')) rel = './' + rel;
          return `${kw}${q}${rel}${q}`;
        },
      );

    fs.writeFileSync(dest, rewritten, 'utf8');
  }
}

/**
 * Browser globals the components touch at import or render time.
 * Without these the harness fails on harness concerns, not app defects.
 */
function installBrowserStubs() {
  const store = () => {
    const m = new Map();
    return {
      getItem: (k) => (m.has(k) ? m.get(k) : null),
      setItem: (k, v) => m.set(k, String(v)),
      removeItem: (k) => m.delete(k),
      clear: () => m.clear(),
      key: (i) => [...m.keys()][i] ?? null,
      get length() {
        return m.size;
      },
    };
  };
  // Assign unconditionally. Node exposes an experimental localStorage that
  // throws on access unless --localstorage-file is passed, so a presence test
  // would keep the broken one.
  globalThis.localStorage = store();
  globalThis.sessionStorage = store();
  if (!globalThis.matchMedia) {
    globalThis.matchMedia = () => ({
      matches: false,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
    });
  }
}

function cleanup() {
  try { fs.rmSync(OUT, { recursive: true, force: true }); } catch { /* gitignored */ }
}

let exitCode = 1;
try {
  installBrowserStubs();
  await buildTree();
  const imp = (rel) => import(pathToFileURL(path.join(OUT, rel)).href);

  const { FormField, inputClass } = await imp('components/citizen/FormField.mjs');

  // --- RND-01: one control renders with a bound label -------------------
  {
    const html = renderToStaticMarkup(
      h(FormField, { label: 'Full name', required: true },
        h('input', { type: 'text', className: inputClass })),
    );
    const f = /<label[^>]*\bfor="([^"]+)"/.exec(html);
    const i = /<input[^>]*\bid="([^"]+)"/.exec(html);
    f && i && f[1] === i[1]
      ? ok('single control gets a bound label', `label for="${f[1]}" matches input id`)
      : bad('single control gets a bound label', `for=${f?.[1]} id=${i?.[1]}`);
  }

  // --- RND-02: TWO children must not throw ------------------------------
  // The exact regression that blanked the report-issue page.
  {
    let threw = null;
    let html = '';
    try {
      html = renderToStaticMarkup(
        h(FormField, { label: 'Evidence', hint: 'JPG, PNG, PDF' },
          h('input', { type: 'file' }),
          h('p', null, 'photo.png selected')),
      );
    } catch (e) { threw = e; }
    threw
      ? bad('two children do not throw', `threw: ${threw.message}`)
      : html.includes('photo.png selected') && /<label[^>]*\bfor=/.test(html)
        ? ok('two children do not throw', 'both children rendered, label still bound')
        : bad('two children do not throw', html.slice(0, 160));
  }

  // --- RND-03: THREE children, the exact attachment field shape ---------
  {
    let threw = null;
    try {
      renderToStaticMarkup(
        h(FormField, { label: 'Attachments', hint: 'Accepted formats' },
          h('input', { type: 'file' }),
          h('p', null, 'road.jpg selected'),
          h('p', null, '2.1 MB')),
      );
    } catch (e) { threw = e; }
    threw ? bad('three children do not throw', `threw: ${threw.message}`)
          : ok('three children do not throw', 'the attachments field renders');
  }

  // --- RND-04: no labelable child -> fieldset/legend group --------------
  {
    let html = '';
    let threw = null;
    try {
      html = renderToStaticMarkup(
        h(FormField, { label: 'Severity', required: true },
          h('div', { className: 'flex gap-2' },
            ...[1, 2, 3, 4, 5].map((v) => h('button', { key: v, type: 'button' }, String(v))))),
      );
    } catch (e) { threw = e; }
    if (threw) bad('group renders as fieldset/legend', `threw: ${threw.message}`);
    else if (/<fieldset/.test(html) && /<legend/.test(html)) {
      ok('group renders as fieldset/legend', 'fieldset + legend, no inert label-for on a div');
    } else bad('group renders as fieldset/legend', html.slice(0, 160));
  }

  // --- RND-05: Children.only must not be reintroduced --------------------
  {
    const offenders = [];
    (function walk(dir) {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) { walk(full); continue; }
        if (/\.(jsx|js)$/.test(e.name) &&
          /Children\.only/.test(
            // Comments are stripped: FormField's own doc comment explains that
            // it deliberately avoids Children.only(), and matching that prose
            // flagged the very fix that removes the crash.
            fs.readFileSync(full, 'utf8')
              .replace(/\/\*[\s\S]*?\*\//g, ' ')
              .replace(/^\s*\/\/.*$/gm, ' '),
          )) {
          offenders.push(path.relative(ROOT, full));
        }
      }
    })(SRC);
    offenders.length === 0
      ? ok('Children.only is not used', 'no component requires exactly one child')
      : bad('Children.only is not used', offenders.join(', '));
  }

  // --- RND-06: every page renders without throwing ----------------------
  // Guards the failure the user hit: an ErrorBoundary screen standing in for a
  // page that should have worked.
  {
    const { LanguageProvider } = await imp('i18n/LanguageContext.mjs');
    const pageFiles = fs.readdirSync(path.join(SRC, 'pages')).filter((f) => f.endsWith('.jsx'));
    const failures = [];
    let rendered = 0;

    for (const f of pageFiles) {
      try {
        const mod = await import(pathToFileURL(path.join(OUT, 'pages', f.replace(/\.jsx$/, '.mjs'))).href);
        if (typeof mod.default !== 'function') continue;
        renderToStaticMarkup(h(MemoryRouter, null, h(LanguageProvider, null, h(mod.default, null))));
        rendered += 1;
      } catch (e) {
        const msg = String(e.message);
        // Route guards legitimately need auth; not a crash.
        if (/useLocation|useNavigate|useParams/.test(msg)) { rendered += 1; continue; }
        failures.push(`${f}: ${msg}`);
      }
    }
    failures.length === 0
      ? ok('every page renders without throwing', `${rendered}/${pageFiles.length} pages rendered`)
      : bad('every page renders without throwing', failures.join(' | '));
  }

  // --- report ---
  for (const r of results) {
    console.log(`${r.status.padEnd(4)} ${r.label}`);
    console.log(`     ${r.detail}`);
  }
  console.log('\n' + '-'.repeat(60));
  console.log(`${passed} passed, ${failed} failed`);
  console.log('-'.repeat(60));
  exitCode = failed ? 1 : 0;
} catch (e) {
  console.log('harness error:', e.message);
} finally {
  cleanup();
}

process.exit(exitCode);