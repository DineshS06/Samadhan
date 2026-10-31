/**
 * Markdown renderer registry for AI-readable site support.
 *
 * Maps each public route to a renderer function that returns a markdown
 * document. All content mirrors visible on-page copy; nothing is scraped
 * from rendered HTML. Private/noindex routes (/mp, /mp/login, 404) are
 * excluded — they have no markdown renderer.
 *
 * This registry mirrors the Python renderers in backend/md_renderers.py.
 * Both sides must stay in sync when a new public route is added.
 */

import { pageHeader, relatedSection } from './format';

const SITE_URL = 'https://samadhan-chi.vercel.app';
const LAST_UPDATED = '2026-10-30';

/** A renderer returns a markdown string or null if the route is not addressable. */
export type MarkdownRenderer = () => string | null;

export interface MarkdownRoute {
  pattern: string;
  renderer: MarkdownRenderer;
  title: string;
  description: string;
}

/** All public routes with their markdown renderers. */
export const MARKDOWN_ROUTES: MarkdownRoute[] = [
  {
    pattern: '/',
    renderer: () => [
      pageHeader(
        'Report Constituency Issues to Your MP',
        'Turn multilingual citizen grievances into ranked constituency projects using a published, evidence-backed scoring model you can check.',
        '/',
        LAST_UPDATED,
      ),
      'Samadhan is an AI-assisted constituency development planning platform. Citizens report local issues in any Indian language, and each report is scored using a transparent 40-40-20 model: 40% demand volume, 40% infrastructure deficit, and 20% severity. The score produces a review order for your Member of Parliament\'s office — not an automatic funding decision.\n\nYour name and phone number stay private. Every report receives a reference ID you can use to track its status.\n\n## What you can do here\n\n- Report a public grievance in any Indian language\n- Attach location and evidence (photos, documents)\n- Receive a reference ID to track your report\n- Review ranked project recommendations for your constituency\n\n',
      relatedSection([
        ['Report a Public Grievance to Your MP', '/report-issue'],
        ['How AI Ranks Citizen Requests Into Projects', '/how-it-works'],
        ['Constituency Project Scoring Methodology', '/methodology'],
        ['Citizen Grievance and Constituency Planning FAQs', '/faq'],
      ]),
    ].join(''),
    title: 'Report Constituency Issues to Your MP',
    description:
      'Turn multilingual citizen grievances into ranked constituency projects using a published, evidence-backed scoring model you can check.',
  },
  {
    pattern: '/report-issue',
    renderer: () => [
      pageHeader(
        'Report a Public Grievance to Your MP',
        'Report a public grievance through our grievance redressal form in any Indian language, with location and evidence. You receive a reference ID; your name and phone number stay private.',
        '/report-issue',
        LAST_UPDATED,
      ),
      'Use this form to report a constituency issue to your Member of Parliament. You can submit in any Indian language. Attach a location and any evidence you have (photos, documents, reference numbers).\n\n## What you need to provide\n\n- Full name (used for verification, kept private)\n- Mobile number (for follow-up, kept private)\n- State and district\n- Parliamentary constituency\n- Language of your submission\n- Grievance category\n- Description of the issue\n- Village/town or GPS location\n\n## What happens next\n\nYour submission is scored using the published 40-40-20 model. You receive a reference ID (SAM-####) to track your report. Your name and phone number are stored separately from the public record and are never shown on the public grievance log.\n\n',
      relatedSection([
        ['How to Report a Constituency Issue to Your MP', '/how-to-report'],
        ['Citizen Grievance and Constituency Planning FAQs', '/faq'],
        ['Privacy for Citizen Grievance Data', '/privacy'],
      ]),
    ].join(''),
    title: 'Report a Public Grievance to Your MP',
    description:
      'Report a public grievance through our grievance redressal form in any Indian language, with location and evidence. You receive a reference ID; your name and phone number stay private.',
  },
  {
    pattern: '/how-it-works',
    renderer: () => [
      pageHeader(
        'How AI Ranks Citizen Requests Into Projects',
        'A G2C e-governance workflow: multilingual intake, AI structuring, public-data enrichment, explainable 40-40-20 scoring, human review, and sanction drafts.',
        '/how-it-works',
        LAST_UPDATED,
      ),
      'Samadhan turns citizen input into ranked project recommendations through a six-step workflow:\n\n1. **Ingest** — Capture text, voice transcripts, images, letters, meetings, and social posts.\n2. **Understand** — Extract language, category, location, urgency, affected group, and summary.\n3. **Enrich** — Match the location and category to selected public or curated indicators.\n4. **Score** — Combine demand, deficit, and severity into an explainable score (40-40-20 model).\n5. **Review** — Display hotspots and ranked recommendations in the MP portal.\n6. **Act** — Verify evidence and prepare a draft administrative brief.\n\nEvery step is explainable and auditable. Officials retain responsibility for verification, eligibility, funding, and sanctions.\n\n',
      relatedSection([
        ['Constituency Project Scoring Methodology', '/methodology'],
        ['Report a Public Grievance to Your MP', '/report-issue'],
        ['Citizen Grievance and Constituency Planning FAQs', '/faq'],
      ]),
    ].join(''),
    title: 'How AI Ranks Citizen Requests Into Projects',
    description:
      'A G2C e-governance workflow: multilingual intake, AI structuring, public-data enrichment, explainable 40-40-20 scoring, human review, and sanction drafts.',
  },
  {
    pattern: '/methodology',
    renderer: () => [
      pageHeader(
        'Constituency Project Scoring Methodology',
        'How Samadhan scores verified demand (40%), infrastructure deficit (40%), and severity (20%) into an explainable, auditable project review order.',
        '/methodology',
        LAST_UPDATED,
      ),
      '## Scoring Formula\n\nScore = 0.4 × Demand Volume + 0.4 × Infrastructure Deficit + 0.2 × Severity\n\n### Demand Volume (40%)\n\nVerified unique localised inputs, deduplicated across channels, with time-decay weighting. More citizens reporting the same issue in your constituency increases demand weight.\n\n### Infrastructure Deficit (40%)\n\nGap evidence drawn from named, relevant public datasets (Census 2011, NFHS-5, UDISE+, PMGSY, National Health Mission) rather than unstated assumptions.\n\n### Severity (20%)\n\nUrgency based on safety, loss of access, exposure, and vulnerable populations. Self-reported urgency by the citizen (1–5).\n\n## Safeguards\n\n- Duplicate control across channels and time\n- Location confidence thresholds\n- Data provenance tracking\n- Human override at every stage\n- Bias review protocols\n- Freshness checks on evidence\n\nThe score produces a **review order, not a funding decision**. Officials apply current rules, engineering checks, and approvals.\n\n',
      relatedSection([
        ['How AI Ranks Citizen Requests Into Projects', '/how-it-works'],
        ['Citizen Grievance and Constituency Planning FAQs', '/faq'],
        ['MPLADS Fund — Constituency Development Fund for MPs', '/mplads'],
      ]),
    ].join(''),
    title: 'Constituency Project Scoring Methodology',
    description:
      'How Samadhan scores verified demand (40%), infrastructure deficit (40%), and severity (20%) into an explainable, auditable project review order.',
  },
  {
    pattern: '/faq',
    renderer: () => [
      pageHeader(
        'Citizen Grievance and Constituency Planning FAQs',
        'Clear answers on reporting a constituency issue, how priority scores work, privacy of contact details, data sources, and limits of AI-assisted planning.',
        '/faq',
        LAST_UPDATED,
      ),
      '## Frequently Asked Questions\n\n### What is Samadhan?\n\nAn AI-assisted constituency planning tool that turns citizen requests into evidence-backed project recommendations.\n\n### How does prioritization work?\n\nSamadhan compares verified demand, relevant infrastructure-gap evidence, and urgency, then shows the reasoning for human review.\n\n### Does it make decisions automatically?\n\nNo. Officials retain responsibility for verification, eligibility, funding, and sanctions.\n\n### Is it an emergency service?\n\nNo. Contact the appropriate emergency service for urgent help.\n\n### Why has my scheme payment not been credited?\n\nPublished reporting identifies recurring causes: incomplete e-KYC, Aadhaar not linked to bank account, name mismatch between Aadhaar and bank record, land bought after 1 February 2019, or multiple claimants in the same family.\n\n### How is an issue prioritised over another?\n\nBy the published 40-40-20 score, not by who asked loudest. Demand and infrastructure deficit each carry 40 percent, severity carries 20.\n\n### Who can see what I report?\n\nThe substance of a report is public so it can be counted. Your name, phone number, and contact details are stored separately and are not shown on the public record.\n\n',
      relatedSection([
        ['Report a Public Grievance to Your MP', '/report-issue'],
        ['About Samadhan', '/about'],
        ['Privacy for Citizen Grievance Data', '/privacy'],
      ]),
    ].join(''),
    title: 'Citizen Grievance and Constituency Planning FAQs',
    description:
      'Clear answers on reporting a constituency issue, how priority scores work, privacy of contact details, data sources, and limits of AI-assisted planning.',
  },
  {
    pattern: '/about',
    renderer: () => [
      pageHeader(
        'About Samadhan: Civic-Tech for Constituency Planning',
        'Why Samadhan connects citizen demand with infrastructure evidence through e-governance: the purpose, audience, scope, and explicit limits of the platform.',
        '/about',
        LAST_UPDATED,
      ),
      '## What Samadhan Is\n\nSamadhan is an AI-assisted constituency development planning tool. It turns multilingual citizen requests into ranked, evidence-backed project recommendations that a Member of Parliament\'s office or a district administration reviews and acts on.\n\n## Who It Is For\n\n- Members of Parliament and constituency offices\n- District and state planning officials\n- Civic technology organisations and NGOs\n- Citizens submitting a constituency issue\n\n## What It Is Not\n\n- Not a government website\n- Not an emergency service\n- Not an automatic funding decision system\n\n## Limitations\n\nIllustrative counts and sample datasets are placeholders only. They are not observed results or official government data. AI parsing can misread language, location, or intent; low-confidence results require human review.\n\n',
      relatedSection([
        ['Privacy for Citizen Grievance Data', '/privacy'],
        ['Accessibility of the Citizen Grievance Portal', '/accessibility'],
        ['Citizen Grievance and Constituency Planning FAQs', '/faq'],
      ]),
    ].join(''),
    title: 'About Samadhan: Civic-Tech for Constituency Planning',
    description:
      'Why Samadhan connects citizen demand with infrastructure evidence through e-governance: the purpose, audience, scope, and explicit limits of the platform.',
  },
  {
    pattern: '/privacy',
    renderer: () => [
      pageHeader(
        'Privacy for Citizen Grievance Data',
        'What data Samadhan collects when you report a constituency issue, how it is used, who can access it, and how your contact details are protected.',
        '/privacy',
        LAST_UPDATED,
      ),
      '## What Data Is Collected\n\nWhen you report a constituency issue, we collect:\n\n- Full name (for verification)\n- Mobile number (for follow-up)\n- State, district, and constituency\n- Language preference\n- Grievance category\n- Issue description\n- Village/town or GPS location\n- Optional attachments (photos, documents)\n\n## How It Is Used\n\nThe substance of your report is public so it can be counted and scored. Your name, phone number, and contact details are stored separately in a private contacts file and are never shown on the public grievance log.\n\n## Who Can Access It\n\n- The public record shows only the redacted report (category, location, summary, score, reference ID)\n- Your private contact details are accessible only to authorized MP office staff\n- Citizen PII is stripped from API responses\n\n## Your Rights\n\nYou receive a reference ID to track your report. You can check status using the public tracking endpoint.\n\n',
      relatedSection([
        ['Report a Public Grievance to Your MP', '/report-issue'],
        ['About Samadhan', '/about'],
        ['Citizen Grievance and Constituency Planning FAQs', '/faq'],
      ]),
    ].join(''),
    title: 'Privacy for Citizen Grievance Data',
    description:
      'What data Samadhan collects when you report a constituency issue, how it is used, who can access it, and how your contact details are protected.',
  },
  {
    pattern: '/accessibility',
    renderer: () => [
      pageHeader(
        'Accessibility of the Citizen Grievance Portal',
        'Samadhan accessibility commitments for reporting a constituency issue: semantic design, keyboard access, multilingual input, and known limitations.',
        '/accessibility',
        LAST_UPDATED,
      ),
      '## Accessibility Commitments\n\nSamadhan is designed to be accessible to all citizens:\n\n- **Semantic HTML** — Proper heading hierarchy (H1-H6), landmarks, and ARIA labels\n- **Keyboard access** — All interactive elements are keyboard-navigable\n- **Multilingual input** — The citizen portal accepts Hindi, Telugu, and English input\n- **Responsive design** — Works on phones, tablets, and desktops\n- **High contrast** — Meets accessibility contrast requirements\n\n## Known Limitations\n\n- The website itself is published in English only (no Hindi or Telugu pages)\n- AI parsing can misread language, location, or intent\n- JavaScript is required to submit or track a grievance\n\n## Feedback\n\nIf you encounter accessibility barriers, report them through the citizen portal or contact your MP office.\n\n',
      relatedSection([
        ['About Samadhan', '/about'],
        ['Privacy for Citizen Grievance Data', '/privacy'],
        ['How to Report a Constituency Issue to Your MP', '/how-to-report'],
      ]),
    ].join(''),
    title: 'Accessibility of the Citizen Grievance Portal',
    description:
      'Samadhan accessibility commitments for reporting a constituency issue: semantic design, keyboard access, multilingual input, and known limitations.',
  },
  {
    pattern: '/how-to-report',
    renderer: () => [
      pageHeader(
        'How to Report a Constituency Issue to Your MP',
        'Step-by-step guide to filing a public grievance with your Member of Parliament. Grievance redressal through DARPG CPGRAMS, MPLADS constituency funds, and Samadhan scoring.',
        '/how-to-report',
        LAST_UPDATED,
      ),
      '## Step-by-Step Guide\n\n### Step 1: Gather Information\n\nCollect details about the issue: what happened, where, when, who is affected, and any evidence (photos, documents, reference numbers).\n\n### Step 2: Choose Your Language\n\nYou can report in any Indian language. The parser handles Hindi, Telugu, and English input.\n\n### Step 3: Submit the Form\n\nGo to the Report a Constituency Issue page and fill in:\n- Your name and mobile number (kept private)\n- State, district, and parliamentary constituency\n- Grievance category and description\n- Location (village/town or GPS)\n- Optional evidence attachments\n\n### Step 4: Receive Your Reference ID\n\nYou receive a reference ID (SAM-####) to track your report. Use it on the public tracking endpoint to check status.\n\n### Step 5: Review and Follow Up\n\nYour report is scored using the 40-40-20 model. MP office staff review ranked recommendations and prepare administrative briefs.\n\n',
      relatedSection([
        ['Report a Public Grievance to Your MP', '/report-issue'],
        ['MPLADS Fund — Constituency Development Fund for MPs', '/mplads'],
        ['Citizen Grievance and Constituency Planning FAQs', '/faq'],
      ]),
    ].join(''),
    title: 'How to Report a Constituency Issue to Your MP',
    description:
      'Step-by-step guide to filing a public grievance with your Member of Parliament. Grievance redressal through DARPG CPGRAMS, MPLADS constituency funds, and Samadhan scoring.',
  },
  {
    pattern: '/mplads',
    renderer: () => [
      pageHeader(
        'MPLADS Fund — Constituency Development Fund for MPs',
        'MPLADS (Members of Parliament Local Area Development Scheme) is India\'s constituency development fund. How it works, eligible works, and how citizens can suggest projects to their MP.',
        '/mplads',
        LAST_UPDATED,
      ),
      '## What Is MPLADS?\n\nMPLADS (Members of Parliament Local Area Development Scheme) is India\'s constituency development fund. Each MP receives an annual allocation to recommend development works in their constituency.\n\n## Eligible Works\n\nWorks must meet local development needs and fall within MPLADS guidelines. Examples include:\n\n- Drinking water facilities\n- Education infrastructure\n- Health facilities\n- Irrigation and sanitation\n- Roads and pathways\n- Electricity and non-conventional energy\n\n## How Citizens Can Suggest Projects\n\nCitizens can suggest projects through their MP\'s office using the Samadhan grievance reporting form. Suggested projects are scored and ranked using the 40-40-20 model, giving officials an evidence-based review order.\n\n## Important Notes\n\nSamadhan does not determine MPLADS eligibility. Officials apply current rules, engineering checks, and approvals.\n\n',
      relatedSection([
        ['How to Report a Constituency Issue to Your MP', '/how-to-report'],
        ['Constituency in India — Lok Sabha Seats and Your MP', '/constituency'],
        ['Citizen Grievance and Constituency Planning FAQs', '/faq'],
      ]),
    ].join(''),
    title: 'MPLADS Fund — Constituency Development Fund for MPs',
    description:
      'MPLADS (Members of Parliament Local Area Development Scheme) is India’s constituency development fund. How it works, eligible works, and how citizens can suggest projects to their MP.',
  },
  {
    pattern: '/constituency',
    renderer: () => [
      pageHeader(
        'Constituency in India — Lok Sabha Seats and Your MP',
        'What a constituency means in India, how Lok Sabha seats work, and how to find your Member of Parliament. Electoral district, MPLADS, and citizen grievance redressal.',
        '/constituency',
        LAST_UPDATED,
      ),
      '## What Is a Constituency?\n\nA constituency is an electoral district that elects one Member of Parliament to the Lok Sabha (India\'s lower house of Parliament). There are 543 Lok Sabha constituencies across India.\n\n## Your MP\n\nEach constituency is represented by an elected Member of Parliament. MP office staff use Samadhan\'s dashboard to view ranked grievance recommendations for their constituency.\n\n## MPLADS and Your Constituency\n\nEach MP receives an annual MPLADS allocation to recommend development works in their constituency. Citizens can suggest projects through the grievance reporting form.\n\n## Finding Your Constituency\n\nUse the Samadhan constituency lookup to find your Lok Sabha seat and MP based on your state and constituency name.\n\n',
      relatedSection([
        ['MPLADS Fund — Constituency Development Fund for MPs', '/mplads'],
        ['Report a Public Grievance to Your MP', '/report-issue'],
        ['Citizen Grievance and Constituency Planning FAQs', '/faq'],
      ]),
    ].join(''),
    title: 'Constituency in India — Lok Sabha Seats and Your MP',
    description:
      'What a constituency means in India, how Lok Sabha seats work, and how to find your Member of Parliament. Electoral district, MPLADS, and citizen grievance redressal.',
  },
  {
    pattern: '/research',
    renderer: () => [
      pageHeader(
        'Samadhan Research — Statistics Pages for AI Answers',
        'Original statistics pages for Lok Sabha constituencies, Indian districts, district-to-constituency mapping, citizen FAQs, and search intents. Every number computed from committed data.',
        '/research',
        LAST_UPDATED,
      ),
      '## Research Reports\n\nEach page publishes original statistics computed from data Samadhan already owns. Every number comes from a single tested calculation module — no number is typed in by hand twice.\n\n| Report | What it covers |\n|--------|---------------|\n| [Lok Sabha Constituency Statistics](/research/constituencies) | 543 Lok Sabha constituencies across 36 states and UTs, ranked by seat count with reserved-seat breakdown. |\n| [Indian Districts Statistics](/research/districts) | 789 districts across 36 states and UTs, ranked by district count. |\n| [District-to-Constituency Mapping](/research/district-mapping) | 299 resolved districts across 15 states mapped to Lok Sabha seats (~38% coverage of 789 districts). |\n| [Citizen FAQ Statistics](/research/faqs) | 11 frequently asked questions about citizen grievances, privacy, MPLADS, and AI limitations. |\n| [Search Intent Statistics](/research/search-intents) | 13 public pages with mapped search intent — 12 informational, 1 transactional. |\n\n## How to Cite\n\nEach research page includes a suggested citation with the page URL and month. Use the "Link to this finding" anchors on each page to cite a specific statistic directly.\n\n## AI-Fetch Friendly\n\nMarkdown versions: every page has a `.md` variant and an `/api/md/<path>` endpoint.\n\n',
      relatedSection([
        ['Lok Sabha Constituency Statistics', '/research/constituencies'],
        ['Indian Districts Statistics', '/research/districts'],
        ['District-to-Constituency Mapping', '/research/district-mapping'],
      ]),
    ].join(''),
    title: 'Samadhan Research — Statistics Pages for AI Answers',
    description:
      'Original statistics pages for Lok Sabha constituencies, Indian districts, district-to-constituency mapping, citizen FAQs, and search intents. Every number computed from committed data.',
  },
  {
    pattern: '/research/constituencies',
    renderer: () => [
      pageHeader(
        'Lok Sabha Constituency Statistics 2026: 543 Seats Across 36 States and UTs',
        '543 Lok Sabha constituencies across 36 states and union territories. Uttar Pradesh leads with 80 seats (~14.7%). Ranked list, reserved-seat breakdown, and per-state entity facts.',
        '/research/constituencies',
        LAST_UPDATED,
      ),
      '## Key Findings\n\n- **Total seats:** 543 Lok Sabha constituencies across 36 states and union territories.\n- **State with the most seats:** Uttar Pradesh leads with 80 seats (~14.7% of all seats).\n- **Reserved (SC/ST) seats:** A subset of seats are reserved for Scheduled Castes and Scheduled Tribes.\n- **Single-seat states and UTs:** Several states and union territories have only one Lok Sabha seat each.\n\n## 36 States and UTs Ranked by Lok Sabha Seats (2026)\n\nStates and union territories are ranked by Lok Sabha seat count in 2026. Uttar Pradesh leads with 80 seats, followed by Maharashtra and West Bengal.\n\n## State and Union Territory Facts\n\nPer-state at-a-glance facts including seat count, reserved-seat status, and the list of constituencies in each state.\n\n## Frequently Asked Questions\n\n- How many Lok Sabha constituencies are there in India? — 543 across 36 states and UTs.\n- Which state has the most Lok Sabha seats? — Uttar Pradesh with 80 seats (~14.7%).\n- How many seats are reserved for SC/ST? — A reserved-seat breakdown is shown per state.\n- Is this official government data? — No. This is a civic-tech project built from the published 2024 Lok Sabha seat catalog. Not a government website.\n\n## Suggested Citation\n\nSamadhan. Lok Sabha Constituency Statistics 2026: 543 Seats Across 36 States and UTs. https://samadhan-chi.vercel.app/research/constituencies. October 2026.\n\n',
      relatedSection([
        ['Indian Districts Statistics', '/research/districts'],
        ['District-to-Constituency Mapping', '/research/district-mapping'],
        ['Citizen Grievance and Constituency Planning FAQs', '/faq'],
      ]),
    ].join(''),
    title: 'Lok Sabha Constituency Statistics 2026: 543 Seats Across 36 States and UTs',
    description:
      '543 Lok Sabha constituencies across 36 states and union territories. Uttar Pradesh leads with 80 seats (~14.7%). Ranked list, reserved-seat breakdown, and per-state entity facts.',
  },
  {
    pattern: '/research/districts',
    renderer: () => [
      pageHeader(
        'Indian Districts Statistics 2026: 789 Districts Across 36 States and UTs',
        '789 districts across 36 states and union territories. Uttar Pradesh leads with 75 districts (~9.5%). Ranked list and per-state district facts.',
        '/research/districts',
        LAST_UPDATED,
      ),
      '## Key Findings\n\n- **Total districts:** 789 districts across 36 states and union territories.\n- **State with the most districts:** Uttar Pradesh leads with 75 districts (~9.5% of all districts).\n- **Single-district states and UTs:** Several states and union territories have only one district each.\n\n## 36 States and UTs Ranked by District Count (2026)\n\nStates and union territories are ranked by district count in 2026. Uttar Pradesh leads with 75 districts, followed by Madhya Pradesh and Bihar.\n\n## State and Union Territory Facts\n\nPer-state at-a-glance district facts including district count and the list of district names in each state.\n\n## Frequently Asked Questions\n\n- How many districts are there in India? — 789 districts across 36 states and UTs.\n- Which state has the most districts? — Uttar Pradesh with 75 districts (~9.5%).\n- Is this official government data? — No. District lists are derived from Wikipedia and auto-generated by Samadhan\'s build scripts. Not a government website.\n\n## Suggested Citation\n\nSamadhan. Indian Districts Statistics 2026: 789 Districts Across 36 States and UTs. https://samadhan-chi.vercel.app/research/districts. October 2026.\n\n',
      relatedSection([
        ['Lok Sabha Constituency Statistics', '/research/constituencies'],
        ['District-to-Constituency Mapping', '/research/district-mapping'],
        ['Report a Public Grievance to Your MP', '/report-issue'],
      ]),
    ].join(''),
    title: 'Indian Districts Statistics 2026: 789 Districts Across 36 States and UTs',
    description:
      '789 districts across 36 states and union territories. Uttar Pradesh leads with 75 districts (~9.5%). Ranked list and per-state district facts.',
  },
  {
    pattern: '/research/district-mapping',
    renderer: () => [
      pageHeader(
        'District-to-Constituency Mapping Statistics 2026: 299 Resolved Districts Across 15 States',
        '299 resolved districts across 15 states mapped to Lok Sabha seats (~38% coverage of 789 districts). Ranked list and per-state mapping coverage.',
        '/research/district-mapping',
        LAST_UPDATED,
      ),
      '## Key Findings\n\n- **Resolved district→seat mappings:** 299 districts have resolved Lok Sabha seat mappings across 15 states.\n- **Coverage percentage:** 299 of 789 districts (~38%) have a resolved seat mapping.\n- **Unresolved districts:** 490 districts (~62%) fall back to the full state seat list, because district and parliamentary constituency boundaries do not align in India.\n- **States with curated mappings:** 15 states have curated district-to-seat mappings.\n\n## 15 States Ranked by Resolved District→Seat Mappings (2026)\n\nStates are ranked by resolved district count in 2026. The mapping table shows which districts have been matched to specific Lok Sabha seats.\n\n## State Mapping Coverage\n\nPer-state at-a-glance mapping coverage showing resolved districts, total districts in the state, coverage percentage, and example seats.\n\n## Frequently Asked Questions\n\n- Why don\'t all districts have a resolved seat mapping? — Because district and parliamentary constituency boundaries do not line up in India. One district can span several seats and vice versa.\n- How many districts have resolved mappings? — 299 of 789 districts (~38%).\n- Is this official government data? — No. This is a civic-tech project. The mapping table is curated and resolved against the official 543-seat list, but it is not a government website or official channel.\n\n## Suggested Citation\n\nSamadhan. District-to-Constituency Mapping Statistics 2026: 299 Resolved Districts Across 15 States. https://samadhan-chi.vercel.app/research/district-mapping. October 2026.\n\n',
      relatedSection([
        ['Lok Sabha Constituency Statistics', '/research/constituencies'],
        ['Indian Districts Statistics', '/research/districts'],
        ['Citizen Grievance and Constituency Planning FAQs', '/faq'],
      ]),
    ].join(''),
    title: 'District-to-Constituency Mapping Statistics 2026: 299 Resolved Districts Across 15 States',
    description:
      '299 resolved districts across 15 states mapped to Lok Sabha seats (~38% coverage of 789 districts). Ranked list and per-state mapping coverage.',
  },
  {
    pattern: '/research/faqs',
    renderer: () => [
      pageHeader(
        'Citizen FAQ Statistics 2026: 11 Frequently Asked Questions',
        '11 published FAQs about citizen grievances, privacy, MPLADS eligibility, AI limitations, and more. Each answer linkable and quotable.',
        '/research/faqs',
        LAST_UPDATED,
      ),
      '## Key Findings\n\n- **Total FAQs:** 11 published frequently asked questions.\n- **FAQ topics covered:** Account requirements, report usefulness, phone privacy, MPLADS eligibility, AI misinterpretation, government status, data sources, low-reporting areas, official overrides, languages, and emergency services.\n- **Privacy FAQs:** Address whether contact details are made public (answered: no).\n- **MPLADS FAQs:** Address whether Samadhan decides MPLADS eligibility (answered: no).\n\n## All 11 FAQs\n\nEach question is an anchored entity block with its answer. Topics include privacy & data, MPLADS & eligibility, account & reporting, AI & limitations, status & scope, languages, reporting, official process, data & methodology, scoring, and other.\n\n## Frequently Asked Questions (Quotable)\n\nEach question includes its answer and topic category, linkable and quotable for citation.\n\n## Suggested Citation\n\nSamadhan. Citizen FAQ Statistics 2026: 11 Frequently Asked Questions. https://samadhan-chi.vercel.app/research/faqs. October 2026.\n\n',
      relatedSection([
        ['Report a Public Grievance to Your MP', '/report-issue'],
        ['Privacy for Citizen Grievance Data', '/privacy'],
        ['Citizen Grievance and Constituency Planning FAQs', '/faq'],
      ]),
    ].join(''),
    title: 'Citizen FAQ Statistics 2026: 11 Frequently Asked Questions',
    description:
      '11 published FAQs about citizen grievances, privacy, MPLADS eligibility, AI limitations, and more. Each answer linkable and quotable.',
  },
  {
    pattern: '/research/search-intents',
    renderer: () => [
      pageHeader(
        'Search Intent Statistics 2026: 13 Public Pages Mapped',
        '13 public pages with mapped search intent. 12 informational (~92%), 1 transactional (~8%). Ranked list and per-page intent facts.',
        '/research/search-intents',
        LAST_UPDATED,
      ),
      '## Key Findings\n\n- **Total pages with mapped intent:** 13 public pages have mapped search intent.\n- **Intent type distribution:** 12 pages are informational (~92%), 1 page is transactional (~8%).\n- **The only transactional page:** /report-issue is the only transactional page, targeting "report a constituency issue" — the wording a citizen would actually type.\n- **Intent clusters:** Multiple clusters including oversight, reporting, scoring, and guides.\n\n## 13 Pages by Search Intent Type (2026)\n\nPublic pages are listed by search intent type and cluster. Each entry includes its primary keyword and rationale.\n\n## Per-Page Intent Facts\n\nPer-page at-a-glance intent facts including intent type, cluster, primary keyword, and rationale.\n\n## Frequently Asked Questions\n\n- How many pages have mapped search intent? — 13 public pages.\n- What is the most common search intent type? — Informational (12 of 13 pages, ~92%).\n- What is the only transactional page? — /report-issue, targeting "report a constituency issue."\n\n## Suggested Citation\n\nSamadhan. Search Intent Statistics 2026: 13 Public Pages Mapped. https://samadhan-chi.vercel.app/research/search-intents. October 2026.\n\n',
      relatedSection([
        ['Report a Public Grievance to Your MP', '/report-issue'],
        ['Lok Sabha Constituency Statistics', '/research/constituencies'],
        ['Citizen Grievance and Constituency Planning FAQs', '/faq'],
      ]),
    ].join(''),
    title: 'Search Intent Statistics 2026: 13 Public Pages Mapped',
    description:
      '13 public pages with mapped search intent. 12 informational (~92%), 1 transactional (~8%). Ranked list and per-page intent facts.',
  },
];

/** Routes explicitly skipped (private/noindex — no markdown renderer). */
export const SKIPPED_ROUTES: Record<string, string> = {
  '/mp': 'Private executive dashboard — noindex',
  '/mp/login': 'MP staff login — noindex',
  '/404': 'Not found page — noindex',
};

/** Look up a renderer by route path. Returns null if no renderer exists. */
export function findRenderer(path: string): MarkdownRenderer | null {
  const norm = path === '' ? '/' : path.replace(/\/$/, '');
  const route = MARKDOWN_ROUTES.find((r) => r.pattern === norm);
  return route ? route.renderer : null;
}

/** Return every addressable markdown route (feeds /api/md/_catalog and llms.txt). */
export function listMarkdownRoutes(): MarkdownRoute[] {
  return MARKDOWN_ROUTES;
}

export default MARKDOWN_ROUTES;
