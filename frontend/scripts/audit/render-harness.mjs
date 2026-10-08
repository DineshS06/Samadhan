/**
 * Shared tree-compiling harness for the render and UI tests.
 *
 * Node ESM needs explicit file extensions and cannot parse JSX, so src/ is
 * emitted as a runnable .mjs tree under OUT with rewritten specifiers. A data:
 * URL is not an option: bare specifiers such as "react/jsx-runtime" have no
 * node_modules to resolve against, and "leaflet/dist/leaflet.css" has no loader.
 */
import fs from 'node:fs';
import path from 'node:path';
import esbuild from 'esbuild';

const { transform } = esbuild;

/**
 * Bare-specifier stubs.
 *
 * Leaflet reads `window` at import time and cannot load in Node without a DOM.
 * ConstituencyMap only touches it inside effects, which SSR never runs, so a
 * minimal fake still lets the MPDashboard React tree be exercised.
 */
export const BARE_STUBS = {
  'leaflet/dist/leaflet.css': 'export default "";',
  leaflet: `
    const chainable = () => {
      const o = {};
      for (const m of ['setView', 'remove', 'removeLayer', 'fitBounds', 'addTo', 'setLatLng', 'bindPopup', 'on', 'openPopup']) {
        o[m] = () => o;
      }
      return o;
    };
    export default {
      map: () => chainable(),
      tileLayer: () => chainable(),
      marker: () => chainable(),
      divIcon: (o) => o,
      geoJSON: () => chainable(),
    };
  `,
};

export function installBrowserStubs() {
  const store = () => {
    const m = new Map();
    return {
      getItem: (k) => (m.has(k) ? m.get(k) : null),
      setItem: (k, v) => m.set(k, String(v)),
      removeItem: (k) => m.delete(k),
      clear: () => m.clear(),
      key: (i) => [...m.keys()][i] ?? null,
      get length() { return m.size; },
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
      addEventListener() {}, removeEventListener() {},
      addListener() {}, removeListener() {},
    });
  }
}

export async function buildTree(OUT, SRC) {
  fs.rmSync(OUT, { recursive: true, force: true });

  const files = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) { walk(full); continue; }
      if (/\.(jsx|js|css)$/.test(e.name)) files.push(full);
    }
  })(SRC);

  fs.mkdirSync(OUT, { recursive: true });
  for (const [spec, body] of Object.entries(BARE_STUBS)) {
    const name = '__stub_' + Buffer.from(spec).toString('base64').replace(/[^A-Za-z0-9]/g, '') + '.mjs';
    fs.writeFileSync(path.join(OUT, name), body, 'utf8');
  }

  for (const file of files) {
    const rel = path.relative(SRC, file);
    const dest = path.join(OUT, rel.replace(/\.jsx$/, '.mjs').replace(/\.js$/, '.mjs'));
    fs.mkdirSync(path.dirname(dest), { recursive: true });

    if (/\.css$/.test(file)) continue;

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

    const rewritten = code
      .replace(
        /(\bfrom\s*|\bimport\s*)(['"])([^'"]+)\2/g,
        (whole, kw, q, spec) => {
          if (Object.prototype.hasOwnProperty.call(BARE_STUBS, spec)) {
            const stubName =
              '__stub_' + Buffer.from(spec).toString('base64').replace(/[^A-Za-z0-9]/g, '') + '.mjs';
            const relStub = path.relative(path.dirname(dest), path.join(OUT, stubName))
              .split(path.sep).join('/');
            return `${kw}${q}${relStub.startsWith('.') ? relStub : './' + relStub}${q}`;
          }
          if (/^\.\.?\//.test(spec)) return whole;
          if (/\.(css|png|jpe?g|svg|webp|gif)$/.test(spec)) {
            const name = '__asset_' + Buffer.from(spec).toString('base64').replace(/[^A-Za-z0-9]/g, '') + '.mjs';
            const stub = path.join(path.dirname(dest), name);
            // A plausible URL, not "". React logs a warning for every empty src
            // and tells the developer to render nothing instead. Stubbing assets
            // as "" therefore made every render run emit that warning, which meant
            // the warning had no signal left: a genuine src="" introduced later
            // would have been lost in the noise.
            if (!fs.existsSync(stub)) {
              const url = '/assets/' + path.basename(spec).replace(/[^A-Za-z0-9._-]/g, '');
              fs.writeFileSync(stub, `export default ${JSON.stringify(url)};\n`, 'utf8');
            }
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
            out = path.join(OUT, path.relative(SRC, target))
              .replace(/\.(css|png|jpe?g|svg|webp|gif)$/i, '') + '.mjs';
            fs.mkdirSync(path.dirname(out), { recursive: true });
            // A plausible URL, not "". React logs a warning for every empty src
            // and tells the developer to render nothing instead. Stubbing assets
            // as "" therefore made every render run emit that warning, which meant
            // the warning carried no signal: a genuine src="" introduced later
            // would have been lost in the noise, and a test could not tell the
            // difference between a stub artefact and a real defect.
            if (!fs.existsSync(out)) {
              const url = '/assets/' + path.basename(spec).replace(/[^A-Za-z0-9._-]/g, '');
              fs.writeFileSync(out, `export default ${JSON.stringify(url)};\n`, 'utf8');
            }
          } else {
            out = path.join(OUT, path.relative(SRC, target))
              .replace(/\.jsx$/, '.mjs')
              .replace(/\.js$/, '.mjs');
            // Vite resolves extensionless imports ("../i18n/translations"); Node
            // ESM does not. Swap a real extension, or append one when the
            // source specifier had none.
            if (!/\.(mjs|jsx|js)$/.test(out)) out += '.mjs';
          }
          // Keep the directory depth: reducing to a basename turned
          // "../components/Header" into "./Header.mjs" inside pages/.
          let rel = path.relative(path.dirname(dest), out).split(path.sep).join('/');
          if (!rel.startsWith('.')) rel = './' + rel;
          return `${kw}${q}${rel}${q}`;
        },
      );

    fs.writeFileSync(dest, rewritten, 'utf8');
  }
}

export function cleanup(OUT) {
  try { fs.rmSync(OUT, { recursive: true, force: true }); } catch { /* gitignored */ }
}