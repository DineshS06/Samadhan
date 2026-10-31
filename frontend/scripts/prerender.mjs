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
if (PUBLIC.length < 8) {  console.error(EMPTY_MSG + "expected at least 8 public routes, parsed " + PUBLIC.length +
    ". The App.jsx <SEO> JSX shape likely changed; update this parser and scripts/seo-audit.mjs together.");
  process.exit(1);
}
for (const must of ["/", "/report-issue", "/how-it-works", "/methodology", "/faq", "/about", "/privacy", "/accessibility"]) {
  if (!PUBLIC.some((r) => r.path === must)) {
    console.error(EMPTY_MSG + "public route " + must + " missing from parse.");
    process.exit(1);
  }
}

/* ── 2. Route-specific crawler-visible bodies ───────────────────────────────
 *
 * Every string below is lifted from the page component's own visible copy
 * (headings, hero leads, step ledes, FAQ data). Nothing here is invented.
 * These bodies are written into #root as real HTML, so a crawler that ignores
 * <noscript> still reads the page. React clears #root on mount (see
 * src/main.jsx), so a JavaScript browser never sees this block — the same
 * words delivered as real markup, which is prerendering rather than cloaking.
 * The shared page list at the end keeps internal linking identical everywhere,
 * matching the visible footer nav. Every public route needs its own entry: a
 * route without one silently inherits the homepage's copy. */

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

/* Routes the map above does not cover fall back to this generic body rather
 * than silently inheriting the homepage's copy, which is what let nine public
 * routes look like duplicates of each other. It deliberately reuses the shared
 * page list: "catches every route" must not mean "describes every route". */
const SHELL_BODY = `
      <h1>Samadhan — constituency development planning</h1>
      <p>
        Samadhan turns multilingual citizen requests into ranked, evidence-backed project
        recommendations for MPs and district officials. Every project is scored on
        published, checkable criteria using a transparent 40-40-20 model. The score
        produces a review order, not an automatic funding decision.
      </p>${SITE_NAV}`;

const ROUTE_BODY = {
  // The shell's own #root block is the homepage copy, so "/" needs no entry
  // here. It is mapped to null rather than omitted so the "every public route
  // has a body" check below can tell "deliberate" from "forgotten".
  "/": null,
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
  "/how-to-report": `
      <h1>How to Report a Constituency Issue to Your MP</h1>
      <p>
        Most civic complaints in India are filed in the wrong place, which is why they go
        nowhere. This guide explains which channel handles which kind of problem, what a
        grievance needs to contain to be actionable, and how to follow it up.
      </p>
      <p>
        The right channel depends on what you are asking for. There are three broad cases,
        and they are handled by different systems.
      </p>${SITE_NAV}`,
  "/mplads": `
      <h1>MPLADS Fund — ₹5 Crore a Year for Each MP</h1>
      <p>
        The Members of Parliament Local Area Development Scheme lets every MP recommend
        development works in their constituency. It has existed since 1993, and the amount
        has changed three times. This page sets out what the scheme actually pays for, what
        it forbids, and how much each state's seats are worth.
      </p>
      <p>
        MPLADS was formulated by the Government of India on 23 December 1993. It was
        administered by the Ministry of Rural Development until October 1994, when the
        Ministry of Statistics and Programme Implementation (MoSPI) took it over. MoSPI
        still runs the scheme.
      </p>${SITE_NAV}`,
  "/constituency": `
      <h1>Lok Sabha Constituency — 543 Seats and Your MP</h1>
      <p>
        A constituency is the electoral district that elects one Member of Parliament.
        India has 543 of them, and the boundaries have been frozen since 2008. This page
        explains how the seats are distributed, why the map has not changed, and how to
        work out which constituency you are in.
      </p>
      <p>
        A constituency is a geographical area whose residents elect one representative.
        India uses the same word at two levels, which causes most of the confusion.
      </p>${SITE_NAV}`,
  "/research": `
      <h1>Samadhan Research — Statistics Pages for AI Answers</h1>
      <p>
        Original statistics pages built only from data Samadhan already owns. Every number
        comes from a single tested calculation in computeStudy — the same module powers the
        page, its markdown version, llms.txt, and the FAQ.
      </p>
      <p>
        Each research page includes a suggested citation with the page URL and month. Use
        the Link to this finding anchors to cite a specific statistic directly.
      </p>
      <h2>Research reports</h2>
      <ul>
        <li><a href="/research/constituencies">Lok Sabha Constituency Statistics</a> — 543 Lok Sabha constituencies across 36 states and UTs, ranked by seat count with reserved-seat breakdown.</li>
        <li><a href="/research/districts">Indian Districts Statistics</a> — 789 districts across 36 states and UTs, ranked by district count.</li>
        <li><a href="/research/district-mapping">District-to-Constituency Mapping</a> — 299 resolved districts across 15 states mapped to Lok Sabha seats (~38% coverage of 789 districts).</li>
        <li><a href="/research/faqs">Citizen FAQ Statistics</a> — 11 frequently asked questions about citizen grievances, privacy, MPLADS, and AI limitations.</li>
        <li><a href="/research/search-intents">Search Intent Statistics</a> — 17 public pages with mapped search intent, 16 informational and 1 transactional.</li>
      </ul>
${SITE_NAV}`,
  "/research/constituencies": `
      <h1>Lok Sabha Constituency Statistics 2026: 543 Seats Across 36 States and UTs</h1>
      <p>
        543 total Lok Sabha constituencies across 36 states and union territories. Uttar
        Pradesh leads with 80 seats, about 14.7% of all seats. 131 of the 543 seats are
        reserved for Scheduled Castes and Scheduled Tribes.
      </p>
      <p>
        Each finding states the count, the denominator, and the percentage. Use Link to
        this finding to cite a specific number.
      </p>
      <h2>Key findings</h2>
      <ul>
        <li><strong>Total seats:</strong> 543 Lok Sabha constituencies across 36 states and union territories.</li>
        <li><strong>State with the most seats:</strong> Uttar Pradesh leads with 80 seats (~14.7% of all seats).</li>
        <li><strong>Reserved (SC/ST) seats:</strong> 131 of the 543 seats are reserved for Scheduled Castes and Scheduled Tribes.</li>
        <li><strong>Single-seat states and UTs:</strong> Several states and union territories have only one Lok Sabha seat each.</li>
      </ul>
      <h2>Frequently asked questions</h2>
      <ul>
        <li><strong>How many Lok Sabha constituencies are there in India?</strong> 543 across 36 states and UTs.</li>
        <li><strong>Which state has the most Lok Sabha seats?</strong> Uttar Pradesh with 80 seats (~14.7%).</li>
        <li><strong>How many seats are reserved for SC/ST?</strong> 131. A reserved-seat breakdown is shown per state.</li>
        <li><strong>Is this official government data?</strong> No. This is a civic-tech project built from the published 2024 Lok Sabha seat catalog. Not a government website.</li>
      </ul>
${SITE_NAV}`,
  "/research/districts": `
      <h1>Indian Districts Statistics 2026: 789 Districts Across 36 States and UTs</h1>
      <p>
        789 total districts across 36 states and union territories. Uttar Pradesh leads
        with 75 districts, about 9.5% of all districts. Several states and union
        territories have only one district each.
      </p>
      <p>
        Each finding states the count, the denominator, and the percentage. Use Link to
        this finding to cite a specific number.
      </p>
      <h2>Key findings</h2>
      <ul>
        <li><strong>Total districts:</strong> 789 districts across 36 states and union territories.</li>
        <li><strong>State with the most districts:</strong> Uttar Pradesh leads with 75 districts (~9.5% of all districts).</li>
        <li><strong>Single-district states and UTs:</strong> Several states and union territories have only one district each.</li>
      </ul>
      <h2>Frequently asked questions</h2>
      <ul>
        <li><strong>How many districts are there in India?</strong> 789 districts across 36 states and UTs.</li>
        <li><strong>Which state has the most districts?</strong> Uttar Pradesh with 75 districts (~9.5%).</li>
        <li><strong>Is this official government data?</strong> No. District lists are derived from Wikipedia and auto-generated by Samadhan's build scripts. Not a government website.</li>
      </ul>
${SITE_NAV}`,
  "/research/district-mapping": `
      <h1>District-to-Constituency Mapping Statistics 2026: 299 Resolved Districts Across 15 States</h1>
      <p>
        299 districts have resolved Lok Sabha seat mappings across 15 states — about 38%
        of the 789 districts in India. The remaining districts fall back to the full state
        seat list, because district and parliamentary constituency boundaries do not align
        in India.
      </p>
      <p>
        Each finding states the count, the denominator, and the percentage. Use Link to
        this finding to cite a specific number.
      </p>
      <h2>Key findings</h2>
      <ul>
        <li><strong>Resolved district-to-seat mappings:</strong> 299 districts have resolved Lok Sabha seat mappings across 15 states.</li>
        <li><strong>Coverage percentage:</strong> 299 of 789 districts (~38%) have a resolved seat mapping.</li>
        <li><strong>Unresolved districts:</strong> 490 districts (~62%) fall back to the full state seat list, because district and parliamentary constituency boundaries do not align in India.</li>
        <li><strong>States with curated mappings:</strong> 15 states have curated district-to-seat mappings.</li>
      </ul>
      <h2>Frequently asked questions</h2>
      <ul>
        <li><strong>Why don't all districts have a resolved seat mapping?</strong> Because district and parliamentary constituency boundaries do not line up in India. One district can span several seats and vice versa.</li>
        <li><strong>How many districts have resolved mappings?</strong> 299 of 789 districts (~38%).</li>
        <li><strong>Is this official government data?</strong> No. This is a civic-tech project. The mapping table is curated and resolved against the official 543-seat list, but it is not a government website or official channel.</li>
      </ul>
${SITE_NAV}`,
  "/research/faqs": `
      <h1>Citizen FAQ Statistics 2026: 11 Frequently Asked Questions</h1>
      <p>
        11 published frequently asked questions. Topics include account requirements,
        report usefulness, phone privacy, MPLADS eligibility, AI misinterpretation,
        government status, data sources, low-reporting areas, official overrides,
        languages, and emergency services.
      </p>
      <p>
        Each question is an anchored entity block with its answer, linkable and quotable
        for citation, and each states its topic category.
      </p>
      <h2>Key findings</h2>
      <ul>
        <li><strong>Total FAQs:</strong> 11 published frequently asked questions.</li>
        <li><strong>FAQ topics covered:</strong> Account requirements, report usefulness, phone privacy, MPLADS eligibility, AI misinterpretation, government status, data sources, low-reporting areas, official overrides, languages, and emergency services.</li>
        <li><strong>Privacy FAQs:</strong> Address whether contact details are made public (answered: no).</li>
        <li><strong>MPLADS FAQs:</strong> Address whether Samadhan decides MPLADS eligibility (answered: no).</li>
      </ul>${SITE_NAV}`,
  "/research/search-intents": `
      <h1>Search Intent Statistics 2026: 17 Public Pages Mapped</h1>
      <p>
        17 public pages have mapped search intent. 16 pages are informational (94.1%), and
        1 page is transactional (5.9%). The only transactional page is /report-issue,
        targeting "report a constituency issue" — the wording a citizen would actually
        type.
      </p>
      <p>
        Public pages are listed by search intent type and cluster. Each entry includes its
        primary keyword and rationale.
      </p>
      <h2>Key findings</h2>
      <ul>
        <li><strong>Total pages with mapped intent:</strong> 17 public pages have mapped search intent.</li>
        <li><strong>Intent type distribution:</strong> 16 pages are informational (~94.1%), 1 page is transactional (~5.9%).</li>
        <li><strong>The only transactional page:</strong> /report-issue is the only transactional page, targeting "report a constituency issue" — the wording a citizen would actually type.</li>
        <li><strong>Intent clusters:</strong> Multiple clusters including oversight, reporting, scoring, and guides.</li>
      </ul>
      <h2>Frequently asked questions</h2>
      <ul>
        <li><strong>How many pages have mapped search intent?</strong> 17 public pages.</li>
        <li><strong>What is the most common search intent type?</strong> Informational (16 of 17 pages, ~94.1%).</li>
        <li><strong>What is the only transactional page?</strong> /report-issue, targeting "report a constituency issue."</li>
      </ul>
${SITE_NAV}`,
  "/mp": `
      <h1>MP dashboard — private staff area</h1>
      <p>This is a private area for authorised staff. JavaScript is required.</p>`,
  "/mp/login": `
      <h1>MP staff login — private area</h1>
      <p>This is a private area for authorised staff. JavaScript is required.</p>`,
};

const missingBody = PUBLIC.filter((r) => !(r.path in ROUTE_BODY)).map((r) => r.path);
if (missingBody.length) {
  console.error(EMPTY_MSG + "public routes with no crawler-visible body: " + missingBody.join(", ") +
    ". Add an entry to ROUTE_BODY mined from the page's own visible copy (or null for '/' and the shell block).");
  process.exit(1);
}

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

/* The shell's #root block: its inner HTML is the homepage's crawler-visible
 * copy, and every non-"/" route replaces it wholesale.
 *
 * The lookahead is what makes this safe. It requires the closing </div> to be
 * followed by a <script>, which only the real #root close is (the shell's
 * inline CDATA note then the module entry). A naive /<div id="root">[\s\S]*?<\/div>/
 * would stop at the first close tag inside the block if the copy ever gains a
 * nested <div>, stranding the remainder of the old copy in the document.
 * Anchoring on the trailing script instead keeps the match whole. */
const ROOT_RE = /<div id="root">[\s\S]*?<\/div>(?=\s*<script)/;

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

  // Crawler-visible body. Written into #root as real HTML rather than inside
  // <noscript>: measured 2026-10-31, a Ubersuggest crawl of the live site read
  // 0 words and 0 H1 on all 17 routes, because every route's copy sat inside
  // <noscript> and that crawler ignores it. src/main.jsx uses createRoot(),
  // which clears #root on mount, so a JavaScript browser still gets the app.
  //
  // The shell ships the homepage's copy inside #root. "/" keeps that block
  // untouched; every other route swaps it. noIndex routes are emptied, not
  // filled — indexable prose on /mp would be worse than none, and they already
  // carry X-Robots-Tag: noindex at the edge.
  const body = r.noIndex ? "" : (ROUTE_BODY[r.path] ?? SHELL_BODY);
  if (r.path !== "/") {
    h = mustReplace(h, ROOT_RE,
      '<div id="root">' + (body ? "\n" + body + "\n  " : "") + "</div>", "root body");
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
