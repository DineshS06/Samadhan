/**
 * Build-time per-route prerender.
 *
 * WHY THIS EXISTS.
 * Vercel rewrites every route to the same dist/index.html (that is what the
 * SPA rewrite does), and src/components/SEO.jsx only sets the per-route title,
 * description and canonical AFTER JavaScript runs. Measured on 2026-10-19 with
 * a Screaming Frog non-JS crawl of the live site (12 URLs): every one of the
 * eight public routes served the SAME <title> and the SAME meta description.
 * Google can only choose one page to rank from that; the other seven look like
 * duplicates of the homepage. Same for the <noscript> body: identical words on
 * every route.
 *
 * WHAT THIS DOES.
 * After `vite build`, this script writes dist/<route>/index.html for every
 * route declared in src/App.jsx. Each file carries that route's own:
 *   - <title>, <meta description>, <meta robots>
 *   - <link rel="canonical"> and Open Graph tags
 *   - WebPage entry in the static JSON-LD block
 *   - <noscript> body content (mirroring the visible page copy)
 * The JavaScript bundle is untouched, so behaviour after hydration is
 * identical. Only what a client that does not execute JavaScript receives
 * changes — which includes every first-fetch crawler pass.
 *
 * These files also win over the SPA rewrite on Vercel and over serve_app in
 * backend/server.py, both of which check the filesystem first. Unknown routes
 * still fall back to the shell (React renders the 404 page).
 *
 * SOURCE OF TRUTH.
 * src/App.jsx itself, parsed with the same JSX shape that
 * scripts/seo-audit.mjs enforces (`path='...' ... <SEO title='...'
 * description='...'`). There is deliberately no second copy of the
 * route-to-title mapping that could drift.
 *
 * EVERY TRANSFORM IS ANCHORED AND CHECKED. Each replacement must match exactly
 * once or the script exits non-zero. A silent no-op replace is the failure
 * mode this project keeps hitting; here it fails the build instead.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const SITE_URL = "https://samadhan-chi.vercel.app";
const EMPTY_MSG = "prerender: ";

/* ── 1. Extract the route table from src/App.jsx ───────────────────────── */

const appJsx = fs.readFileSync(path.join(ROOT, "src", "App.jsx"), "utf8");
const routes = [];
for (const m of appJsx.matchAll(/<Route\s+path='([^']*)'[\s\S]*?<SEO([\s\S]*?)\/>/g)) {
  const p = m[1];
  const attrs = m[2];
  const title = /title='([^']+)'/.exec(attrs)?.[1];
  const description = /description='([^']+)'/.exec(attrs)?.[1];
  if (p === "*") continue; // no static file for the catch-all; the shell covers it
  if (!title || !description) {
    console.error(EMPTY_MSG + "route " + p + " has an <SEO> block this parser could not read.");
    process.exit(1);
  }
  routes.push({
    path: p,
    title,
    description,
    // noIndex appears as a bare boolean prop in the JSX attribute list.
    noIndex: /(?:^|\s)noIndex(?:\s|\/|$)/.test(attrs),
    fullTitle: title.includes("Samadhan") ? title : title + " | Samadhan",
  });
}

const PUBLIC = routes.filter((r) => !r.noIndex);
if (PUBLIC.length < 8) {
  console.error(EMPTY_MSG + "expected at least 8 public routes, parsed " + PUBLIC.length +
    ". The App.jsx <SEO> JSX shape likely changed; update this parser and scripts/seo-audit.mjs together.");
  process.exit(1);
}
for (const must of ["/", "/report-issue", "/how-it-works", "/methodology", "/faq", "/about", "/privacy", "/accessibility"]) {
  if (!PUBLIC.some((r) => r.path === must)) {
    console.error(EMPTY_MSG + "public route " + must + " missing from parse.");
    process.exit(1);
  }
}

/* ── 2. Route-specific <noscript> bodies ────────────────────────────────────
 *
 * Every string below is lifted from the page component's own visible copy
 * (headings, hero leads, step ledes, FAQ data). Nothing here is invented, and
 * nothing here renders for a JavaScript browser — it replaces the old block
 * that was identical on all eight routes, which is what made every URL look
 * like the same page to a crawler. The shared page list at the end keeps
 * internal linking identical everywhere, matching the visible footer nav. */

let FAQS = [];
try {
  ({ FAQS } = await import(pathToFileURL(path.join(ROOT, "src", "data", "faqData.js")).href));
} catch (e) {
  console.error(EMPTY_MSG + "could not import src/data/faqData.js for /faq copy: " + e.message);
  process.exit(1);
}

const SITE_NAV = `
      <h2>Every page on this site</h2>
      <nav aria-label="Site pages">
        <ul>
          <li><a href="/report-issue">Report a constituency issue</a></li>
          <li><a href="/how-it-works">How it works</a></li>
          <li><a href="/methodology">Priority methodology</a></li>
          <li><a href="/faq">Frequently asked questions</a></li>
          <li><a href="/about">About Samadhan</a></li>
          <li><a href="/privacy">Privacy for citizen grievance data</a></li>
          <li><a href="/accessibility">Accessibility statement</a></li>
        </ul>
      </nav>`;

const faqItems = FAQS.slice(0, 5)
  .map((f) => `      <h3>${f.q}</h3>\n      <p>${f.a}</p>`)
  .join("\n");

const NOSCRIPT = {
  "/": null, // the shell's own block IS the homepage copy; leave it untouched
  "/report-issue": `
      <h1>Report a Constituency Issue</h1>
      <p>
        Use the citizen form to submit a public grievance about your constituency in
        any Indian language. Add a location and any evidence you have — photos,
        documents, or reference numbers.
      </p>
      <p>
        You receive a reference ID to track the report. Your name and phone number are
        stored separately from the public record and are not shown on it.
        <a href="/privacy">Read the privacy policy</a>.
      </p>
      <p>
        Already submitted a report? Enter your reference ID in the tracker to see what
        was recorded — you do not need to submit a new grievance.
      </p>${SITE_NAV}`,
  "/how-it-works": `
      <h1>How Samadhan turns citizen input into a project recommendation</h1>
      <p>
        One workflow connects multilingual intake, AI structuring, public infrastructure
        data, transparent scoring, and human approval. The point of the pipeline is not
        to produce a decision; it is to make the reasoning behind a development priority
        visible and checkable.
      </p>
      <ol>
        <li>Ingest — capture a citizen request in whichever form the citizen actually uses.</li>
        <li>Understand — extract the structured meaning of an unstructured request.</li>
        <li>Enrich — attach public infrastructure evidence to the request.</li>
        <li>Score — produce an explainable priority score.</li>
        <li>Review — show officials the ranked list and the reasoning behind it.</li>
        <li>Act — prepare a draft brief for a human to verify and issue.</li>
      </ol>
      <p>
        Officials can re-rank, reject, annotate, or add a project the model did not
        surface. Samadhan does not issue sanctions, determine eligibility, or commit
        funds — the output is a draft for a responsible officer.
      </p>${SITE_NAV}`,
  "/methodology": `
      <h1>How constituency project priorities are scored</h1>
      <p>
        Samadhan turns multilingual citizen requests into a ranked review order using a
        transparent 40-40-20 scoring model. Every score is traceable to the demand, the
        infrastructure evidence, and the urgency that produced it.
      </p>
      <p>Priority Score = (0.4 × Demand Volume) + (0.4 × Infrastructure Deficit) + (0.2 × Severity)</p>
      <ul>
        <li>Demand volume: how many citizens report the same issue in your constituency</li>
        <li>Infrastructure deficit: how far schools, hospitals, or utilities fall below the published norm for the area</li>
        <li>Severity: self-reported urgency by the citizen (1–5)</li>
      </ul>
      <p>
        The score is a review order, not a funding decision.
        <a href="/how-it-works">See the six-step workflow</a> from report to ranked project.
      </p>${SITE_NAV}`,
  "/faq": `
      <h1>Questions about reporting, ranking, privacy, and AI</h1>
      <p>
        These are direct answers for citizens, MP office staff, district administrators,
        and evaluators. They cover how a report is handled, how the priority score
        works, and the limits of what an automated system should be trusted to do in
        public administration.
      </p>
${faqItems}
      <p><a href="/faq">All frequently asked questions</a></p>${SITE_NAV}`,
  "/about": `
      <h1>Why constituency planning needs evidence, not just volume</h1>
      <p>
        Samadhan exists to solve one specific problem: an MP office hears what
        constituents need, and the administration knows what is missing, but nothing
        joins the two. This page states the problem, what the tool does about it, who it
        is for, and — just as importantly — what it does not claim.
      </p>
      <p>
        Samadhan does not issue sanctions, determine eligibility, or commit funds.
        Officials retain responsibility for verification, eligibility, funding, and
        sanctions.
      </p>${SITE_NAV}`,
  "/privacy": `
      <h1>How citizen grievance information should be handled</h1>
      <p>
        Samadhan collects contact details in order to verify and follow up on a
        citizen's report. This page describes what is collected, why, and who can see
        it. It also states plainly what a production deployment would still need before
        handling real personal data.
      </p>
      <p>
        Six fields are requested. Two identify you, and the rest describe the problem.
        Your name, phone number and contact details are stored separately and are not
        shown on the public record.
      </p>${SITE_NAV}`,
  "/accessibility": `
      <h1>Samadhan accessibility statement</h1>
      <p>
        Accessibility here is a requirement of the service, not a polish item. A
        grievance system that is hard to use excludes exactly the people most likely to
        be reporting a problem: older residents, people with low digital confidence, and
        citizens whose first language is not English.
      </p>
      <p>
        Every page has exactly one H1, content is structured semantically so screen
        readers and search engines read the same outline, and the interface is usable
        by keyboard alone.
      </p>${SITE_NAV}`,
  "/mp": `
      <h1>MP dashboard — private staff area</h1>
      <p>This is a private area for authorised staff. JavaScript is required.</p>`,
  "/mp/login": `
      <h1>MP staff login — private area</h1>
      <p>This is a private area for authorised staff. JavaScript is required.</p>`,
};

/* ── 3. Transform helpers with hard anchors ─────────────────────────────── */

const escAttr = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

function mustReplace(haystack, re, replacement, label) {
  // Count with a global clone of the pattern. A non-global match() returns
  // [full, ...groups], so its length is 1 + capture groups, NOT the number of
  // occurrences — that mistake made this helper report "matched 3 times" for a
  // pattern with 2 groups and a single real occurrence.
  const g = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
  const count = (haystack.match(g) || []).length;
  if (count !== 1) {
    console.error(EMPTY_MSG + 'anchor "' + label + '" matched ' + count +
      ' times, expected exactly 1. The shell changed shape; update the anchor and re-run.');
    process.exit(1);
  }
  return haystack.replace(re, replacement);
}

function prerenderShell(shell, r) {
  const url = SITE_URL + (r.path === "/" ? "/" : r.path);
  let h = shell;

  h = mustReplace(h, /<title>[^<]*<\/title>/, "<title>" + escAttr(r.fullTitle) + "</title>", "title");
  h = mustReplace(h,
    /(<meta name="description" content=")[^"]*(")/,
    "$1" + escAttr(r.description) + "$2", "meta description");
  h = mustReplace(h,
    /(<meta name="robots" content=")[^"]*(")/,
    "$1" + (r.noIndex
      ? "noindex, nofollow, noarchive"
      : "index, follow, max-image-preview:large, max-snippet:-1") + "$2", "meta robots");
  h = mustReplace(h,
    /(<link rel="canonical" href=")[^"]*(")/,
    "$1" + url + "$2", "canonical");
  h = mustReplace(h,
    /(<meta property="og:title" content=")[^"]*(")/,
    "$1" + escAttr(r.fullTitle) + "$2", "og:title");
  h = mustReplace(h,
    /(<meta property="og:description" content=")[^"]*(")/,
    "$1" + escAttr(r.description) + "$2", "og:description");
  h = mustReplace(h,
    /(<meta property="og:url" content=")[^"]*(")/,
    "$1" + url + "$2", "og:url");

  // JSON-LD: rewrite (or drop) the WebPage node so the static entity data
  // describes THIS document, not the homepage.
  const ldRe = /(<script type="application\/ld\+json">\s*)([\s\S]*?)(\s*<\/script>)/;
  const ldMatch = h.match(ldRe);
  if (!ldMatch || h.match(new RegExp(ldRe.source, "g")).length !== 1) {
    console.error(EMPTY_MSG + "JSON-LD block anchor did not match exactly once.");
    process.exit(1);
  }
  let graph;
  try {
    graph = JSON.parse(ldMatch[2]);
  } catch (e) {
    console.error(EMPTY_MSG + "static JSON-LD is not valid JSON: " + e.message);
    process.exit(1);
  }
  graph["@graph"] = graph["@graph"]
    .filter((n) => !(n["@type"] === "WebPage" && r.noIndex))
    .map((n) => {
      if (n["@type"] !== "WebPage") return n;
      return {
        ...n,
        "@id": SITE_URL + r.path + "#webpage",
        url,
        name: r.fullTitle,
        description: r.description,
      };
    });
  h = h.replace(ldRe, "$1\n" + JSON.stringify(graph, null, 2) + "$3");

  // <noscript> body: only routes with a dedicated block get swapped.
  const ns = NOSCRIPT[r.path];
  if (ns != null) {
    const nsRe = /(<noscript>\s*)([\s\S]*?)(\s*<\/noscript>)/;
    const nsMatches = h.match(new RegExp(nsRe.source, "g")) || [];
    if (nsMatches.length !== 3) {
      console.error(EMPTY_MSG + "expected exactly 3 <noscript> blocks in the shell, found " + nsMatches.length +
        ". Update this anchor. (The first is the content block; the other two are GTM and the JS-required note.)");
      process.exit(1);
    }
    h = h.replace(nsRe, "$1" + ns + "$3");
  }
  return h;
}

/* ── 4. Write files and verify them ─────────────────────────────────────── */

if (!fs.existsSync(DIST)) {
  console.error(EMPTY_MSG + "dist/ does not exist. Run vite build first (npm run build does both).");
  process.exit(1);
}
const shell = fs.readFileSync(path.join(DIST, "index.html"), "utf8");

const wanted = [...routes, { path: "/", __forceRoot: true }].filter(
  (r, i, arr) => arr.findIndex((x) => x.path === r.path) === i
);
// roots: ensure '/' is handled even if parse order differs
const byPath = new Map(routes.map((r) => [r.path, r]));
const written = [];
for (const r of byPath.values()) {
  const html = prerenderShell(shell, r);
  const outDir = r.path === "/" ? DIST : path.join(DIST, r.path.replace(/^\//, ""));
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, "index.html");
  fs.writeFileSync(outFile, html, "utf8");
  written.push({ ...r, file: outFile, html });
}

// Self-verification. Re-read from disk so a wrong write cannot pass.
const checks = [];
for (const w of written) {
  const h = fs.readFileSync(w.file, "utf8");
  const got = (re) => (h.match(re) || [])[1];
  checks.push([w.path + " title", got(/<title>([^<]*)<\/title>/) === escAttr(w.fullTitle)]);
  checks.push([w.path + " canonical", got(/<link rel="canonical" href="([^"]*)"/) === SITE_URL + (w.path === "/" ? "/" : w.path)]);
  checks.push([w.path + " description", got(/<meta name="description" content="([^"]*)"/) === escAttr(w.description)]);
  checks.push([w.path + " robots", w.noIndex
    ? got(/<meta name="robots" content="([^"]*)"/).startsWith("noindex")
    : got(/<meta name="robots" content="([^"]*)"/).startsWith("index")]);
  const others = written.filter((o) => o.path !== w.path).map((o) => o.fullTitle);
  checks.push([w.path + " no foreign title", !others.some((t) => h.includes("<title>" + escAttr(t)))]);
}
const titles = written.map((w) => w.fullTitle);
const descs = written.map((w) => w.description);
checks.push(["titles unique", new Set(titles).size === titles.length]);
checks.push(["descriptions unique", new Set(descs).size === descs.length]);

const failed = checks.filter(([, ok]) => !ok);
if (failed.length) {
  console.error(EMPTY_MSG + "self-check failed:");
  for (const [name] of failed) console.error("  - " + name);
  process.exit(1);
}

/* ── 5. Static .md files for Vercel (frontend-only deploy) ───────── */
const GEN_MD = path.join(ROOT, "scripts", "generate_markdown.py");
try {
  execFileSync("python", [GEN_MD, DIST], {
    encoding: "utf8",
    stdio: "inherit",
  });
} catch (e) {
  console.error(EMPTY_MSG + "generate_markdown.py failed: " + e.message);
  process.exit(1);
}

// Dev test: every public route must have a .md file in dist.
const missingMd = [];
for (const r of PUBLIC) {
  const mdFile = r.path === "/" || r.path === ""
    ? path.join(DIST, "index.md")
    : path.join(DIST, r.path.replace(/^\//, "") + ".md");
  if (!fs.existsSync(mdFile)) {
    missingMd.push(r.path);
  }
}
if (missingMd.length) {
  console.error(EMPTY_MSG + "public routes missing .md file: " + missingMd.join(", "));
  process.exit(1);
}
console.log("prerender: wrote " + written.length + " route files, all " + checks.length + " checks pass");
for (const w of written) console.log("  " + w.path.padEnd(16) + " -> " + path.relative(ROOT, w.file));
