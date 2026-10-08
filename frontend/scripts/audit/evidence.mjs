/**
 * Evidence collectors for the Samadhan SEO audit.
 *
 * Every collector returns a real measurement or throws. Nothing is assumed.
 * Network calls have a hard timeout; a failure surfaces as a thrown error so
 * the caller can record BLOCKED rather than silently passing.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const FRONTEND = path.resolve(__dirname, '..', '..');
export const REPO = path.resolve(FRONTEND, '..');

const read = (p) => fs.readFileSync(p, 'utf8');
const readOrNull = (p) => {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch {
    return null;
  }
};
const exists = (p) => fs.existsSync(p);

/** HTTP GET returning {status, headers, body, finalUrl} using curl. */
export function httpGet(url, { followRedirects = false, ua } = {}) {
  const args = ['-s', '-o', '-', '-w', '\n__STATUS__%{http_code}\n__URL__%{url_effective}', '--max-time', '25'];
  if (!followRedirects) args.push('--max-redirs', '0');
  if (ua) args.push('-A', ua);
  args.push(url);

  let out;
  try {
    out = execFileSync('curl.exe', args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  } catch (err) {
    throw new Error(`network failure fetching ${url}: ${err.message.split('\n')[0]}`);
  }

  const statusMatch = out.match(/\n__STATUS__(\d{3})\n/);
  const urlMatch = out.match(/\n__URL__(.*)$/);
  if (!statusMatch) throw new Error(`could not parse HTTP status for ${url}`);
  const body = out.replace(/\n__STATUS__\d{3}\n__URL__.*$/, '');
  return {
    status: Number(statusMatch[1]),
    finalUrl: urlMatch ? urlMatch[1].trim() : url,
    body,
    get location() {
      return null;
    },
  };
}

/** HTTP status only (fast, no body). */
export function httpStatus(url, { ua } = {}) {
  const args = ['-s', '-o', 'NUL', '-w', '%{http_code}|%{redirect_url}|%{time_total}', '--max-time', '25'];
  if (ua) args.push('-A', ua);
  args.push(url);
  try {
    const out = execFileSync('curl.exe', args, { encoding: 'utf8', maxBuffer: 1024 * 1024 }).trim();
    const [status, redirect, time] = out.split('|');
    return { status: Number(status), redirectUrl: redirect || null, timeSeconds: Number(time) };
  } catch (err) {
    throw new Error(`network failure for ${url}: ${err.message.split('\n')[0]}`);
  }
}

/** HTTP response headers as a lowercased map. */
export function httpHeaders(url) {
  let out;
  try {
    out = execFileSync('curl.exe', ['-s', '-D', '-', '-o', 'NUL', '--max-time', '25', url], {
      encoding: 'utf8',
      maxBuffer: 4 * 1024 * 1024,
    });
  } catch (err) {
    throw new Error(`network failure for headers ${url}: ${err.message.split('\n')[0]}`);
  }
  const headers = {};
  for (const line of out.split(/\r?\n/)) {
    const i = line.indexOf(':');
    if (i > 0) headers[line.slice(0, i).trim().toLowerCase()] = line.slice(i + 1).trim();
  }
  return headers;
}

// ---------------------------------------------------------------------------
// Static project facts
// ---------------------------------------------------------------------------

export function loadProject() {
  const appJsx = read(path.join(FRONTEND, 'src', 'App.jsx'));
  const seoJsx = read(path.join(FRONTEND, 'src', 'components', 'SEO.jsx'));
  const indexHtml = read(path.join(FRONTEND, 'index.html'));
  const ga4 = read(path.join(FRONTEND, 'src', 'components', 'GA4.jsx'));
  const headerJsx = read(path.join(FRONTEND, 'src', 'components', 'Header.jsx'));
  const footerJsx = read(path.join(FRONTEND, 'src', 'components', 'Footer.jsx'));
  const robots = read(path.join(FRONTEND, 'public', 'robots.txt'));
  const sitemap = read(path.join(FRONTEND, 'public', 'sitemap.xml'));
  const llms = readOrNull(path.join(FRONTEND, 'public', 'llms.txt'));
  const vercel = readOrNull(path.join(REPO, 'vercel.json'));
  const vercelFrontend = readOrNull(path.join(FRONTEND, 'vercel.json'));
  const pkg = JSON.parse(read(path.join(FRONTEND, 'package.json')));
  const vite = read(path.join(FRONTEND, 'vite.config.js'));

  return {
    appJsx, seoJsx, indexHtml, ga4, headerJsx, footerJsx, robots, sitemap, llms,
    vercel, vercelFrontend, pkg, vite,
    pagesDir: path.join(FRONTEND, 'src', 'pages'),
    publicDir: path.join(FRONTEND, 'public'),
  };
}

/**
 * Parse App.jsx routes robustly for BOTH quote styles.
 * The previous audit regex only matched single quotes and silently skipped
 * 2 of 11 routes, which is how a wrong title got attributed to /about.
 */
export function parseRoutes(appJsx) {
  const routes = [];
  const routeRe = /<Route\s+path=(['"])([^'"]+)\1/g;
  const starts = [];
  let scan;
  while ((scan = routeRe.exec(appJsx))) starts.push({ index: scan.index, rawPath: scan[2] });

  starts.forEach((entry, i) => {
    const rawPath = entry.rawPath;
    if (rawPath === '*') return; // 404 route, not a sitemap candidate
    // A Route element runs until the next <Route, so slice by those bounds
    // rather than guessing at the first '/>' (which is the SEO component).
    const start = entry.index;
    const end = i + 1 < starts.length ? starts[i + 1].index : appJsx.length;
    const body = appJsx.slice(start, end);

    const seo = /<SEO\b([\s\S]*?)\/>/.exec(body);
    const title = seo ? attr(seo[1], 'title') : null;
    const description = seo ? attr(seo[1], 'description') : null;
    const path_ = seo ? attr(seo[1], 'path') : null;
    const noIndex = seo ? /noIndex/.test(seo[1]) : false;
    const schema = seo ? /\bschema=/.test(seo[1]) : false;
    const pageComponent = /<([A-Z]\w*)\s*\/>/.exec(body)?.[1] ?? null;

    routes.push({ rawPath, path: path_ ?? rawPath, title, description, noIndex, schema, pageComponent, routeBody: body });
  });
  return routes;
}

function attr(jsxProps, name) {
  const re = new RegExp(`\\b${name}=(["'])([\\s\\S]*?)\\1`);
  const m = re.exec(jsxProps);
  return m ? m[2] : null;
}

/**
 * Remove JS/JSX code (imports, exports, hooks, object literals) so word
 * counts reflect visible copy rather than identifiers. Without this, minified
 * single-line pages reported ~14 words of import statements.
 */
export function stripCode(s) {
  return (
    s
      // Drop import statements (these pages are minified to one line, so match
      // up to the statement terminator rather than relying on line anchors).
      .replace(/\bimport\s+[^;]*;/g, ' ')
      // Drop the component wrapper: `export default function Page() { return`
      .replace(/\bexport\s+default\s+function\s+\w*\s*\(\s*\)\s*\{\s*return\s*/g, ' ')
      .replace(/^\s*export\s+(const|function|default)\b/gm, ' ')
      // Closing brace of the component body, end of file.
      .replace(/;?\s*\}\s*$/, ' ')
  );
}

/** Visible text of a JSX page file, with tags and JSX expressions removed. */
/**
 * Resolve the internal links a page renders through <RelatedPages />.
 *
 * Pages generate their cross-links from src/data/topics.js rather than
 * hand-placing them, so counting only literal to="..." attributes reported
 * /report-issue as having zero contextual cross-links while it was in fact
 * rendering four. Parsed from the topic map rather than by rendering React,
 * which keeps this check dependency-free.
 */
let topicCache = null;
function topicMap() {
  if (topicCache) return topicCache;
  try {
    const src = readOrNull(path.join(FRONTEND, 'src', 'data', 'topics.js')) ?? '';
    const clusters = [];
    for (const b of src.split(/\n  \{/).slice(1)) {
      const hub = /hub: '([^']+)'/.exec(b)?.[1];
      const pages = [...b.matchAll(/path: '([^']+)'/g)].map((m) => m[1]);
      if (hub) clusters.push({ hub, pages });
    }
    topicCache = clusters;
  } catch {
    topicCache = [];
  }
  return topicCache;
}

/**
 * The links <RelatedPages path={p} /> renders for page p.
 *
 * Unions every cluster the page takes part in, mirroring linksFor() in
 * src/data/topics.js. A single-cluster lookup understated /faq, which belongs to
 * both the reporting and the scoring cluster: only the reporting links were
 * counted, so the audit reported a reader on /faq as having no route to
 * /methodology even though the map lists one.
 */
function relatedLinksFor(p) {
  if (!p) return [];
  const mine = topicMap().filter((c) => c.hub === p || c.pages.includes(p));
  const out = [];
  const seen = new Set([p]);
  const push = (x) => {
    if (!x || seen.has(x)) return;
    seen.add(x);
    out.push(x);
  };
  for (const c of mine) {
    if (c.hub !== p) push(c.hub);
    for (const x of c.pages) push(x);
  }
  return out;
}

/**
 * Prose string literals from any /data/ module the file imports.
 *
 * Pages keep long copy in data modules so it stays next to the component that
 * renders it and can be shared with the JSON-LD. That copy is visible to a
 * reader but is not between JSX tags, so any check over page text has to follow
 * the imports or it reads as absent.
 */
function declaredDataText(src) {
  const out = [];
  // The page's own module-level arrays, and any /data/ module it imports.
  const sources = [src];
  for (const m of src.matchAll(/from\s+['"]([^'"]*\/data\/[a-zA-Z0-9_]+)['"]/g)) {
    const mod = readOrNull(path.join(FRONTEND, 'src', m[1].replace(/^\.\.\//, '') + '.js'));
    if (mod) sources.push(mod);
  }
  for (const s of sources) {
    // Single-quoted string literals long enough to be prose, not a key or path.
    for (const lit of s.matchAll(/'([^']{12,})'/g)) {
      if (/^[a-z]+_[a-z_]+$/.test(lit[1])) continue;    // an identifier
      if (/^\/?[a-z0-9-]*$/i.test(lit[1])) continue;     // a path or slug
      out.push(lit[1].replace(/\\u[0-9A-Fa-f]{4}/g, ' '));
    }
  }
  return out;
}

/**
 * Visible copy with the eyebrow label removed.
 *
 * The eyebrow is a short category tag rendered above the H1, e.g.
 * "System architecture" or "Answer centre". It is not the opening sentence, so a
 * check on whether a page states its answer first was reading the tag and
 * failing every page.
 */
function stripEyebrow(src, text) {
  const tags = [...src.matchAll(/<p className='eyebrow[^']*'>([^<]*)<\/p>/g)].map((m) => m[1].trim());
  let out = text;
  for (const t of tags) {
    if (t) out = out.replace(t, ' ');
  }
  return out.replace(/\s+/g, ' ').trim();
}

export function pageFacts(file) {
  const src = read(file);
  // The route this page serves, read from the <RelatedPages path='...' /> it
  // renders, so the topic map can be resolved for it.
  const pagePath = /<RelatedPages\b[^>]*\bpath=(['"])(\/[^'"]*)\1/.exec(src)?.[2] ?? null;
  const h1 = [...src.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => stripJsx(stripCode(m[1])));
  const h2 = [...src.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => stripJsx(stripCode(m[1])));
  const h3 = [...src.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/g)].map((m) => stripJsx(stripCode(m[1])));
  // Visible copy is the text that sits between JSX tags. Taking only those
  // segments avoids counting component-body code (useEffect bodies, handlers)
  // as page content, which previously inflated 'const' as a keyword.
  const text = extractJsxText(src);
  const words = (text.match(/[A-Za-z][A-Za-z'’-]*/g) || []).length;
  // Internal links, including the ones a page renders through <RelatedPages />.
// Counting only literal to="..." attributes reported /report-issue as having
// zero contextual cross-links even after the topic-map hub was wired into it,
// because the links live in src/data/topics.js rather than in the page source.
const internalLinks = [
  ...[...src.matchAll(/to=(['"])(\/[^'"]*)\1/g)].map((m) => m[2]),
  ...relatedLinksFor(pagePath),
];
  // External citations can live in JSX attributes (href="https://...") or in a
  // data array the page renders (href: 'https://...'). Methodology holds its
  // source list as data so the citations stay next to the component that uses
  // them; scanning only the attribute form reported a page with six authority
  // citations as having none.
  const externalLinks = [
    ...[...src.matchAll(/href=(["'])https?:\/\/[^"']+\1/g)].map((m) => m[0]),
    ...[...src.matchAll(/href:\s*(["'])https?:\/\/[^"']+\1/g)].map((m) => m[0]),
  ];
  const imgs = [...src.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
  const imgsNoAlt = imgs.filter((t) => !/\balt=(["'])[^"']{2,}\1/.test(t));
  const usesLazyImage = /<LazyImage\b/.test(src);
  const ctaCount = (src.match(/class(?:Name)?=['"][^'"]*button[^'"]*['"]/g) || []).length;
  const malformedUtf8 = (src.match(/â€|Â·|â€™|â€œ|â€˜|Ã©/g) || []).length;
  // Copy can also live in module-level data (an exported Q&A array) that React
  // renders but that never appears between JSX tags. Count only string
  // literals that read as prose, so code snippets are not counted as content.
  // Pages that render copy through the i18n layer get their text from
  // translations.js rather than inline JSX.
  let i18nWords = 0;
  if (/useLanguage\(\)|from '\.\.\/i18n/.test(src)) {
    const tr = readOrNull(path.join(FRONTEND, 'src', 'i18n', 'translations.js'));
    if (tr) {
      const vals = (tr.match(/'[^']{25,}'/g) ?? [])
        .filter((lit) => /[A-Z]/.test(lit) && !/[{}();=<>\\]/.test(lit));
      i18nWords = vals.join(' ').split(/\s+/).filter(Boolean).length;
    }
  }
  const declaredWords = (src.match(/'[^']{40,}'/g) ?? [])
    .filter((lit) => /[A-Z]/.test(lit) && /\s/.test(lit) && /[a-z]{3}/.test(lit) && !/[{}();=<>]/.test(lit))
    .join(' ')
    .replace(/[^A-Za-z ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;

  return {
    file, src, h1, h2, h3, words, declaredWords, i18nWords, internalLinks, externalLinks,
    imgCount: imgs.length, imgsNoAlt, usesLazyImage, ctaCount, malformedUtf8,
    // The opening paragraph a reader actually reads. The eyebrow label is a
    // category tag ("System architecture", "Answer centre"), not part of the
    // sentence, and including it made every answer-first check fail regardless of
    // how the lead was written.
    firstText: stripEyebrow(src, text),
    // Full visible copy, including copy the page renders from a data module.
    //
    // extractJsxText only sees text sitting between JSX tags. Methodology holds
    // its dataset list (Census of India, NFHS-5, UDISE+, PMGSY, NHM) in a
    // DEFICIT_SOURCES array so the citations sit next to the component that uses
    // them, and a check for named entities found only MPLADS. Follow the page's
    // own /data/ imports, the same way declaredWords follows the i18n layer.
    text: [text, ...declaredDataText(src)].join(' '),
  };
}

/**
 * Text nodes of a JSX file: everything between a closing `>` and the next
 * opening `<`. JavaScript inside braces and component-body code is excluded
 * because it never appears in that position.
 */
export function extractJsxText(src) {
  // Neutralise characters that look like tag delimiters but are operators:
  // arrow functions and comparisons. Without this, code between `=>` and the
  // next `<` was harvested as page copy.
  const cleaned = src.replace(/=>/g, '→').replace(/<=|>=/g, '≡').replace(/[<>]=/g, '≡');
  const segments = cleaned.match(/>([^<]+)</g) ?? [];
  return segments
    .map((seg) => seg.slice(1, -1))
    .filter((seg) => !/^\s*\{/.test(seg))
    // Prose only: reject any segment containing code punctuation. Real copy
    // on these pages does not contain braces, parens, semicolons or operators.
    .filter((seg) => /[A-Za-z]{3,}\s+[A-Za-z]{3,}/.test(seg))
    .filter((seg) => !/[{}()\[\];=+*/<>|→≡]/.test(seg))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}


export function stripJsx(s) {
  return s
    .replace(/<[^>]*>/g, ' ')
    .replace(/\{[^{}]*\}/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function listPages(pagesDir) {
  if (!exists(pagesDir)) return [];
  return fs
    .readdirSync(pagesDir)
    .filter((f) => f.endsWith('.jsx'))
    .map((f) => path.join(pagesDir, f));
}

/** Mojibake / broken-encoding scan across source. */
export function scanEncoding(dir) {
  const bad = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) walk(full);
      else if (/\.(jsx|js|css|html|txt|json)$/.test(e.name)) {
        const c = fs.readFileSync(full, 'utf8');
        const hits = [...c.matchAll(/â€|Â·|â€™|â€œ|â€˜|â€\x9d|Ã©|Ã¢/g)];
        if (hits.length) bad.push({ file: path.relative(REPO, full), count: hits.length, sample: hits[0][0] });
      }
    }
  };
  walk(dir);
  return bad;
}

/** Byte sizes of built assets, when dist/ exists. */
export function distAssets() {
  const dist = path.join(FRONTEND, 'dist');
  if (!exists(dist)) return null;
  const out = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) walk(full);
      else out.push({ file: path.relative(dist, full), bytes: fs.statSync(full).size });
    }
  };
  walk(dist);
  return out;
}

export function gitCommit() {
  try {
    return execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
      cwd: REPO,
      encoding: 'utf8',
    }).trim();
  } catch {
    return null;
  }
}

export function gitDirty() {
  try {
    const out = execFileSync('git', ['status', '--porcelain'], { cwd: REPO, encoding: 'utf8' });
    return out.trim().length > 0;
  } catch {
    return null;
  }
}