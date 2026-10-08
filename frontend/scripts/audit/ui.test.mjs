/**
 * Assert the UI affordances the user asked for actually appear in rendered HTML.
 * Compile-and-pass tells you nothing about whether a "+" is on screen.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement as h } from 'react';
import { MemoryRouter } from 'react-router-dom';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, '.uitmp');
const css = fs.readFileSync(path.join(SRC, 'index.css'), 'utf8');

let passed = 0, failed = 0;
const results = [];
const ok = (l, d) => { passed += 1; results.push({ l, d, s: 'PASS' }); };
const bad = (l, d) => { failed += 1; results.push({ l, d, s: 'FAIL' }); };

// Reuse the tree builder from the render test.
const { buildTree, installBrowserStubs, cleanup } = await import('./render-harness.mjs');
try {
  installBrowserStubs();
  await buildTree(OUT, SRC);
  const imp = (rel) => import(pathToFileURL(path.join(OUT, rel)).href);

  const { LanguageProvider } = await imp('i18n/LanguageContext.mjs');
  const page = async (name) => {
    const mod = await import(pathToFileURL(path.join(OUT, 'pages', name + '.mjs')).href);
    return renderToStaticMarkup(h(MemoryRouter, null, h(LanguageProvider, null, h(mod.default, null))));
  };

  // --- FAQ: the expand affordance ---------------------------------------
  {
    const cssHasMarker = /\.faq-list summary::after\{[^}]*content:"\+"/.test(css);
    const cssHasOpenState = /faq-list details\[open\]\s*>\s*summary::after\{[^}]*content:"\\2212"/.test(css);
    const cssHidesNative = /\.faq-list summary::?-webkit-details-marker\{display:none\}/.test(css);
    cssHasMarker && cssHasOpenState && cssHidesNative
      ? ok('FAQ rows show a +/- affordance',
          '::after renders "+", switches to a minus on [open], native marker hidden')
      : bad('FAQ rows show a +/- affordance',
          `plus=${cssHasMarker} minus=${cssHasOpenState} hideNative=${cssHidesNative}`);

    const html = await page('FAQ');
    const rows = (html.match(/<details/g) || []).length;
    const summaries = (html.match(/<summary/g) || []).length;
    rows > 0 && rows === summaries
      ? ok('FAQ renders collapsible rows', `${rows} <details> with ${summaries} <summary>`)
      : bad('FAQ renders collapsible rows', `details=${rows} summary=${summaries}`);
  }

  // --- HowItWorks: visible 01-06 numbering ------------------------------
  {
    const html = await page('HowItWorks');
    const nums = [...html.matchAll(/pipeline-step__num[^>]*>(\d{2})</g)].map((m) => m[1]);
    const ordered = nums.join(',') === '01,02,03,04,05,06';
    ordered
      ? ok('workflow steps numbered 01-06', nums.join(' → '))
      : bad('workflow steps numbered 01-06', `got: ${nums.join(',') || 'none'}`);

    const noFloat = !/pipeline[^{]*\{[^}]*float:right/.test(css);
    noFloat
      ? ok('step number is not a float', 'no float:right left on any pipeline rule')
      : bad('step number is not a float', 'a float:right pipeline rule survives');

    // All six steps must be listed. Showing only 2, 3, 5 and 6 made steps 1
    // and 4 look accidentally omitted, so the sequence appeared to begin at 2.
    const rows = (html.match(/class="handoff[ "]/g) || []).length;
    const stepChips = [...html.matchAll(/handoff__step[^>]*>(\d{2})</g)].map((m) => m[1]);
    const sequence = stepChips.join(',');
    rows === 6 && sequence === '01,02,03,04,05,06'
      ? ok('every step 01-06 is listed', sequence)
      : bad('every step 01-06 is listed',
          `rows=${rows} sequence=${sequence || 'none'}`);

    const decisionBadges = (html.match(/A person decides/g) || []).length;
    const autoBadges = (html.match(/Automated step/g) || []).length;
    decisionBadges === 4 && autoBadges === 2
      ? ok('each step states whether judgement is needed',
          `${decisionBadges} checkpoints, ${autoBadges} marked as mechanical`)
      : bad('each step states whether judgement is needed',
          `decides=${decisionBadges} mechanical=${autoBadges}`);

    // Steps 1 and 4 were greyed out with a muted badge and a near-white card,
    // which read as rows that had failed to render. All six rows must carry the
    // same class, so no row looks disabled.
    const greyed = /handoff--auto/.test(html) || /handoff--auto/.test(css);
    !greyed
      ? ok('no checkpoint row is greyed out', 'all six rows share one class')
      : bad('no checkpoint row is greyed out',
          'a handoff--auto rule still de-emphasises the mechanical steps');

    // The limitation note after step 6 was a pink bordered box, which read as an
    // alert rather than as prose.
    const redBox = /handoff__outside/.test(html) || /handoff__outside/.test(css);
    !redBox
      ? ok('no alert-styled box after step 6', 'the note is ordinary prose')
      : bad('no alert-styled box after step 6',
          'handoff__outside still renders as a bordered callout');

    // The closing card's two buttons are alternatives, not a sequence, so they
    // stack. A full-width row left the shorter label as a stub beside the longer.
    const stacked = /\.cta-card \.hero__actions\{[^}]*flex-direction:column/.test(css);
    stacked
      ? ok('closing-card buttons stack', '.cta-card .hero__actions is a column')
      : bad('closing-card buttons stack',
          '.cta-card .hero__actions is still a row, so the buttons sit side by side');

    // The grid must not be forced to one column at a width where two columns fit.
    const forced = /@media[^{]*\{[^}]*pipeline-grid--steps\{grid-template-columns:1fr/.test(css);
    !forced
      ? ok('workflow grid stays responsive', 'no forced single-column override')
      : bad('workflow grid stays responsive',
          'a media query still forces one column, discarding the two-column layout');
  }

  // --- HowItWorks: the heading and grid share one section ----------------
  {
    const html = await page('HowItWorks');
    // A stray empty .section between the heading and the <ol> was the 176px gap.
    const gap = /section-heading[\s\S]{0,200}?<\/div>\s*<\/section>\s*<section[^>]*>\s*<div class="container">\s*<ol/.test(html);
    gap
      ? bad('heading and grid share one section', 'an empty section still separates them')
      : ok('heading and grid share one section', 'no empty section between heading and grid');

    const padding = /\.section\{padding-block:(\d+)px\}/.exec(css);
    const px = padding ? Number(padding[1]) : null;
    px && px <= 64
      ? ok('section rhythm is not a void', `.section padding-block is ${px}px`)
      : bad('section rhythm is not a void', `.section padding-block is ${px}px`);
  }

  // --- Methodology: inputs are scannable ---------------------------------
  {
    const html = await page('Methodology');
    const cards = (html.match(/input-card__name/g) || []).length;
    cards === 3
      ? ok('Methodology has three input cards', `${cards} cards`)
      : bad('Methodology has three input cards', `${cards} cards`);

    const weights = [...html.matchAll(/input-card__weight-value[^>]*>(\d+)%</g)].map((m) => m[1]);
    weights.join(',') === '40,40,20'
      ? ok('input weights are visible', weights.join(' / ') + '%')
      : bad('input weights are visible', `got: ${weights.join(',') || 'none'}`);

    const limits = (html.match(/input-card__note/g) || []).length;
    limits === 3
      ? ok('each input states what it cannot tell you', `${limits} limit notes`)
      : bad('each input states what it cannot tell you', `${limits} limit notes`);

    const links = (html.match(/censusindia\.gov\.in|udiseplus\.gov\.in|rchiips\.org|nhm\.gov\.in|mplads\.mospi\.gov\.in/g) || []).length;
    links >= 5
      ? ok('authority citations survive the restructure', `${links} authority links rendered`)
      : bad('authority citations survive the restructure', `${links} links`);
  }

  // --- Report: the page must not be behind the ErrorBoundary -----------
  {
    const html = await page('CitizenPortal');
    /Something went wrong/.test(html)
      ? bad('report-issue renders its form', 'ErrorBoundary is showing')
      : ok('report-issue renders its form', 'form markup present, no ErrorBoundary');

    // The location block is gated on a state/district/constituency being chosen,
    // so the first render legitimately shows only the fields above that gate.
    // The meaningful property is that every rendered control is labelled, not how
    // many there are.
    const labels = (html.match(/<label/g) || []).length;
    const legends = (html.match(/<legend/g) || []).length;
    const controls = (html.match(/<input|<select|<textarea/g) || []).length;
    const bound = (html.match(/<label[^>]*\bfor="/g) || []).length;
    const fieldsets = (html.match(/<fieldset/g) || []).length;
    labels + legends >= controls && controls > 0
      ? ok('every rendered control has a label',
          `${labels} labels + ${legends} legends for ${controls} controls ` +
          `(${bound} bound with for=, ${fieldsets} groups as fieldset)`)
      : bad('every rendered control has a label',
          `${labels} labels + ${legends} legends for ${controls} controls`);
  }

  // --- Related section: rendered on every page that asks for it ------------
  //
  // Three defects lived here. The link resolver took the first matching cluster,
  // so a page in two clusters advertised only one. The list was a grid, which
  // stretched each short label to the full width of the column. And on
  // /report-issue the block was wrapped in a second .container inside a main
  // that was already max-w-3xl, so it rendered narrower than the form above it.
  {
    const { TOPICS, linksFor } = await import(pathToFileURL(path.join(OUT, 'data', 'topics.mjs')).href);

    // A page in two clusters must surface links from both.
    const faq = linksFor('/faq');
    const reporting = TOPICS.find((t) => t.id === 'reporting');
    const scoring = TOPICS.find((t) => t.id === 'scoring');
    const needFromBoth = [...reporting.pages, ...scoring.pages]
      .map((p) => p.path)
      .filter((p) => p !== '/faq');
    const missing = needFromBoth.filter((p) => !faq.some((l) => l.path === p));
    missing.length === 0
      ? ok('a page in two clusters links to both', `/faq → ${faq.map((l) => l.path).join(' ')}`)
      : bad('a page in two clusters links to both',
          `/faq omits ${missing.join(' ')} — only the first cluster is being used`);

    // No page links to itself, and no link points at a path the router lacks.
    const routes = new Set(
      [...fs.readFileSync(path.join(SRC, 'App.jsx'), 'utf8')
        .matchAll(/path=['"](\/[^'"]*)['"]/g)].map((m) => m[1]),
    );
    const allPaths = TOPICS.flatMap((t) => t.pages.map((p) => p.path));
    const selfLinks = allPaths.filter((p) => linksFor(p).some((l) => l.path === p));
    const deadTargets = allPaths.flatMap((p) => linksFor(p).map((l) => l.path)).filter((p) => !routes.has(p));
    selfLinks.length === 0 && deadTargets.length === 0
      ? ok('related links are valid', `every target is a real route, no page links to itself`)
      : bad('related links are valid',
          `self=${selfLinks.join(' ')} dead=${[...new Set(deadTargets)].join(' ')}`);

    // The list wraps rather than stacking each label at full width.
    const inline = /\.related__list\{[^}]*display:flex/.test(css);
    inline
      ? ok('related links wrap inline', '.related__list is a flex row, not a full-width grid')
      : bad('related links wrap inline',
          '.related__list is still a grid, so each link is stretched to the column width');

    // Every page that renders the block must be measured against the wrapper
    // its <main> already provides.
    const pages = fs.readdirSync(path.join(SRC, 'pages')).filter((f) => f.endsWith('.jsx'));
    const nested = pages.filter((f) => {
      const src = fs.readFileSync(path.join(SRC, 'pages', f), 'utf8');
      const main = /<main className="([^"]*)"/.exec(src);
      if (!main || !/max-w-/.test(main[1])) return false; // main is not width-capped
      return /<div className='container[^']*'>\s*(?:\{[^{}]*\}\s*)?<RelatedPages/.test(src);
    });
    nested.length === 0
      ? ok('related block is not double-wrapped', 'no page nests .container inside a capped <main>')
      : bad('related block is not double-wrapped',
          `${nested.join(' ')} wrap the block in .container inside an already-capped <main>`);

    // A cluster must name a hub that actually renders the block. When the
    // reporting cluster named /report-issue and that page stopped rendering the
    // link hub, SEO-137 and SEO-138 went on counting three titled hubs while two
    // were on screen. The map has to stay truthful about what renders.
    const pageSources = fs.readdirSync(path.join(SRC, 'pages'))
      .filter((f) => f.endsWith('.jsx'))
      .map((f) => fs.readFileSync(path.join(SRC, 'pages', f), 'utf8'));
    const ghosts = TOPICS.filter((c) => !pageSources.some(
      (s) => new RegExp(`<RelatedPages\\b[^>]*\\bpath=(['"])${c.hub.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\1`).test(s),
    ));
    ghosts.length === 0
      ? ok('every cluster hub renders the block',
          TOPICS.map((c) => `${c.hub} renders`).join(', '))
      : bad('every cluster hub renders the block',
          `${ghosts.map((c) => c.hub).join(' ')} are declared hubs but no page renders the block for them`);

    // /report-issue deliberately renders no link hub: a reader who has just
    // filed a grievance should not be offered four other documents. It must stay
    // reachable from the cluster, or the page becomes orphaned.
    const portal = fs.readFileSync(path.join(SRC, 'pages', 'CitizenPortal.jsx'), 'utf8');
    const noHub = !/<RelatedPages\b/.test(portal) && !/from '..\/components\/RelatedPages'/.test(portal);
    const stillLinked = linksFor('/report-issue').length > 0
      || TOPICS.some((t) => t.pages.some((p) => p.path === '/report-issue'));
    noHub && stillLinked
      ? ok('report-issue shows no hub but stays linked',
          `block removed; reachable from ${TOPICS.filter((t) => t.pages.some((p) => p.path === '/report-issue')).map((t) => t.hub).join(', ')}`)
      : bad('report-issue shows no hub but stays linked',
          noHub ? 'it renders no hub but no cluster links to it, so it is orphaned'
                : 'it still renders <RelatedPages>');
  }

  // --- Footer: one link per destination, no dead destinations -------------
  //
  // The Trust column carried a second link to /report-issue labelled "Citizen
  // portal" while the Platform column linked the same page as "Report an issue".
  // Two links, two names, one destination.
  {
    const foot = fs.readFileSync(path.join(SRC, 'components', 'Footer.jsx'), 'utf8');
    const appSrc = fs.readFileSync(path.join(SRC, 'App.jsx'), 'utf8');
    const routes = [...new Set([...appSrc.matchAll(/path=['"](\/[^'"]*)['"]/g)].map((m) => m[1]))];
    const targets = [...foot.matchAll(/to=['"](\/[^'"]*)['"]/g)].map((m) => m[1]);

    const dupes = [...new Set(targets.filter((t, i) => targets.indexOf(t) !== i))];
    dupes.length === 0
      ? ok('the footer links to each page once', `${targets.length} links, ${new Set(targets).size} destinations`)
      : bad('the footer links to each page once',
          `${dupes.join(', ')} linked more than once`);

    const dead = [...new Set(targets)].filter((t) => t !== '/' && !routes.includes(t));
    dead.length === 0
      ? ok('every footer link is a real route', `${new Set(targets).size} destinations all resolve`)
      : bad('every footer link is a real route', `${dead.join(', ')} are not routes`);
  }

  // --- Reading columns must all share one geometry -------------------------
  //
  // .container carries `margin:auto`. .reading-column carries `max-width:760px`.
  // Combined on one element (`container reading-column`) the block centres at
  // x=260 on a 1280px viewport; nested inside a bare container it has no margin
  // and sits flush at x=80. Both forms were in use on HowItWorks, which put the
  // workflow heading 180px left of the checkpoints heading directly beneath it.
  //
  // Comments are stripped first: the explanatory comment for this fix quotes the
  // nested form verbatim, and matching it turned the page that was fixed into a
  // page that failed.
  {
    const strip = (s) => s
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/^\s*\/\/.*$/gm, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ');

    const nested = [];
    for (const f of fs.readdirSync(path.join(SRC, 'pages')).filter((x) => x.endsWith('.jsx'))) {
      const flat = strip(fs.readFileSync(path.join(SRC, 'pages', f), 'utf8')).replace(/\s+/g, ' ');
      if (/<div className='container'>\s*<div className='(?:reading-column|section-heading)'/.test(flat)) {
        nested.push(f);
      }
    }
    nested.length === 0
      ? ok('reading columns share one geometry',
          'every page uses `container reading-column` on a single element, so no block is 180px off')
      : bad('reading columns share one geometry',
          `${nested.join(', ')} nest a reading-column in a bare .container; ` +
          'that form loses margin:auto and sits 180px left of the combined form');

    // Every page that renders a reading column should use the combined form, so
    // the measure cannot drift back to a second width.
    const heroInner = fs.readFileSync(path.join(SRC, 'pages', 'HowItWorks.jsx'), 'utf8');
    const bands = [...heroInner.matchAll(/<section className='(section[^']*)'>/g)].map((m) => m[1]);
    const softBands = bands.filter((b) => b.includes('section--soft'));
    softBands.length <= 1
      ? ok('HowItWorks has one soft band, not two', `${softBands.length} section--soft`)
      : bad('HowItWorks has one soft band, not two',
          `${softBands.length} adjacent soft bands merge into one undivided slab`);
  }

  // --- Closing-card buttons must not be squeezed into a column of words -----
  //
  // Home's CTA put <a class="button"> straight into .cta-card as a flex item.
  // With flex-shrink:1 and no width of its own it wrapped its label to
  // "Report a / constituency / issue", three lines in a button 48px tall.
  // Every other page already wrapped its buttons in .hero__actions.
  {
    const strip = (s) => s
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/^\s*\/\/.*$/gm, ' ');

    const bare = [];
    let cards = 0;
    for (const f of fs.readdirSync(path.join(SRC, 'pages')).filter((x) => x.endsWith('.jsx'))) {
      const flat = strip(fs.readFileSync(path.join(SRC, 'pages', f), 'utf8')).replace(/\s+/g, ' ');
      for (const card of flat.matchAll(/<div className='container cta-card'>([\s\S]*?)<\/section>/g)) {
        if (!/className='button/.test(card[1])) continue;
        cards += 1;
        // A card holding buttons must also hold the wrapper that gives them their
        // own column. Testing "does it contain hero__actions" rather than trying
        // to count closing tags: an earlier version counted </div> and matched
        // every page, including the correctly wrapped ones.
        if (!/hero__actions/.test(card[1])) bare.push(f);
      }
    }
    bare.length === 0
      ? ok('closing-card buttons are never bare flex children',
          `${cards} card(s) with buttons, all wrapped in .hero__actions`)
      : bad('closing-card buttons are never bare flex children',
          `${[...new Set(bare)].join(', ')} put a .button straight into .cta-card, where flex-shrink wraps the label`);

    // Belt and braces: even a bare button must not wrap its label. Anchored to a
    // rule that starts with `.button`, so `.cta-card > .button{...nowrap}` cannot
    // stand in for the base rule and quietly satisfy the check.
    const nowrap = /(^|[};])\s*\.button\s*\{[^}]*white-space:nowrap/.test(css);
    nowrap
      ? ok('buttons do not wrap their labels', 'the base .button rule carries white-space:nowrap')
      : bad('buttons do not wrap their labels',
          '.button has no white-space:nowrap, so a constrained flex item wraps one word per line');
  }

  // --- Images resolve to a real URL ---------------------------------------
  //
  // The logo is the LCP element and is the only <img> in the build. An empty
  // src is not cosmetic: a browser treats it as a request for the current page,
  // re-downloading the document. The render harness used to stub every asset
  // import as "", which made this true for all seven pages and drowned the
  // warning it should have raised.
  {
    const src = fs.readFileSync(path.join(SRC, 'components', 'Header.jsx'), 'utf8');
    const html = await page('Home');
    const imgs = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
    const empty = imgs.filter((t) => /\ssrc=["']["']/.test(t) || !/\ssrc=/.test(t));
    empty.length === 0 && imgs.length > 0
      ? ok('the header logo resolves to a URL',
          `${imgs.length} <img>, src=${/src="([^"]*)"/.exec(imgs[0])?.[1]}`)
      : bad('the header logo resolves to a URL',
          `${empty.length}/${imgs.length} images have no src`);

    // It must stay eager and high priority: it is above the fold.
    const eager = /loading="eager"/.test(imgs[0] ?? '') && /fetchpriority="high"/i.test(imgs[0] ?? '');
    eager
      ? ok('the logo stays eager and high priority', 'loading=eager, fetchPriority=high')
      : bad('the logo stays eager and high priority',
          'the LCP image is not eager, or has lost fetchPriority=high');

    const sized = /width="\d+"/.test(imgs[0] ?? '') && /height="\d+"/.test(imgs[0] ?? '');
    sized
      ? ok('the logo is sized, so the header cannot shift', 'width and height are set')
      : bad('the logo is sized, so the header cannot shift', 'width/height missing, causing CLS');
  }

  // --- Track your grievance: reachable, and it does not invent values -------
  //
  // The tracker existed but was gated behind {result && ...}, where `result` is
  // only set by submitting in the current session. The receipt tells the citizen
  // "Save this ID to track your grievance status", and the page gave them no way
  // to come back and use it. It also defaulted every missing field —
  // status 'Submitted', severity 3/5, category 'Unknown', location 'Location not
  // specified' — so a sparse record displayed measurements that were never made.
  {
    const portal = await page('CitizenPortal');
    const src = fs.readFileSync(path.join(SRC, 'pages', 'CitizenPortal.jsx'), 'utf8');

    // Rendered on a first visit, before anything has been submitted.
    const hasTracker = /Track your grievance/.test(portal) && /SAM-0001/.test(portal);
    hasTracker
      ? ok('the tracker is reachable without submitting', 'rendered on first paint')
      : bad('the tracker is reachable without submitting',
          'no tracker in a first render, so only someone who just submitted can see it');

    const gated = /\{\s*result\s*&&\s*\(?\s*<Section[^>]*trackYourGrievance/.test(src);
    !gated
      ? ok('the tracker is not gated on a submission', 'no {result && ...} wrapper')
      : bad('the tracker is not gated on a submission',
          'the tracker is still inside {result && ...}');

    // No fabricated fallback. `|| 'Submitted'` and `|| 3` are the exact shapes
    // that used to display invented values.
    const invented = [
      [/status:\s*[^,]*\|\|\s*'Submitted'/, "status defaults to 'Submitted'"],
      [/severity_score:\s*[^,]*\|\|\s*\d/, 'severity_score defaults to a number'],
      [/severity_score:\s*[^,]*\?\?\s*\d/, 'severity_score defaults to a number'],
      [/\?\?\s*'Unknown'/, "category defaults to 'Unknown'"],
      [/\|\|\s*'Location not specified'/, "location defaults to 'Location not specified'"],
    ].filter(([re]) => re.test(src));
    invented.length === 0
      ? ok('the tracker invents no values', 'every field renders not-provided instead')
      : bad('the tracker invents no values', invented.map(([, w]) => w).join('; '));

    // The result and the error must live inside the tracker's card, or an error can
    // appear with no input box on screen to correct.
    const sectionAt = src.indexOf("{t.trackYourGrievance}");
    const sectionEnd = src.indexOf('</main>', sectionAt);
    const errAt = src.lastIndexOf('trackError &&');
    const resAt = src.lastIndexOf('trackResult && (');
    const open = sectionAt > 0 && sectionEnd > sectionAt;
    const inside = errAt > sectionAt && errAt < sectionEnd;
    const inside2 = resAt > sectionAt && resAt < sectionEnd;
    open && inside && inside2
      ? ok('result and error live inside the tracker',
          'both render within the tracker card')
      : bad('result and error live inside the tracker',
          `tracker at ${sectionAt}..${sectionEnd}, error at ${errAt}, result at ${resAt}`);

    // The tracker must be a card in the same shell as the grievance form. As a
    // bare <Section> outside any card it inherited :last-child's "no border, no
    // padding" and read as unfinished next to "Your details".
    const portalSrc = src;
    const cardShell = /bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8/;
    const formAt = /<form onSubmit=\{handleSubmit\} className="bg-white rounded-2xl border/.exec(portalSrc)?.index ?? -1;
    const trackCardAt = portalSrc.indexOf('{t.trackYourGrievance}');
    const cardBeforeTracker = [...portalSrc.slice(0, trackCardAt).matchAll(new RegExp(cardShell.source, 'g'))];
    // The opening tag of the tracker card itself, so the gap can be checked.
    const openTag = portalSrc.slice(0, trackCardAt).split('<div className="').pop() ?? '';
    const gap = /\bmt-(\d+)/.exec(openTag);
    cardBeforeTracker.length >= 2 && gap
      ? ok('the tracker is a card like the form, with a gap above it',
          `same shell as the form; ${gap[0]} separates it from the card above`)
      : bad('the tracker is a card like the form, with a gap above it',
          cardBeforeTracker.length < 2
            ? `only ${cardBeforeTracker.length} card shell(s) before the tracker heading; it renders as a loose label`
            : 'the tracker card has no top margin, so it touches the card above it');

    // Keyboard: the reference field must submit on Enter, not need a tab to the
    // button, and the outcome must be announced.
    const onEnter = /onKeyDown=\{\(e\) => \{ if \(e\.key === 'Enter'\) handleTrackSubmit\(e\) \}\}/.test(src);
    const live = /aria-live="polite"/.test(src) && /role="status"/.test(src);
    onEnter && live
      ? ok('the tracker is keyboard and screen-reader usable', 'Enter submits, aria-live announces')
      : bad('the tracker is keyboard and screen-reader usable',
          `enter=${onEnter} liveRegion=${live}`);

    // No English left inline in the tracker's own copy.
    const inline = [/: 'Check Status'/, /'Please enter a Reference ID'/, /'Enter Reference ID'/]
      .filter((re) => re.test(src));
    inline.length === 0
      ? ok('the tracker has no inline English', 'all copy comes from t.*')
      : bad('the tracker has no inline English',
          `${inline.length} hardcoded English string(s) left`);
  }
} catch (e) {
  bad('harness', e.message);
} finally {
  cleanup(OUT);
}

for (const r of results) console.log(`${r.s.padEnd(4)} ${r.l}\n     ${r.d}`);
console.log('\n' + '-'.repeat(60));
console.log(`${passed} passed, ${failed} failed`);
console.log('-'.repeat(60));
process.exit(failed ? 1 : 0);