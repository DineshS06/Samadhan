/**
 * Search intent and primary keyword per public page.
 *
 * The audit asked for keywords grouped by topic cluster (SEO-027) and flagged
 * that the topic map in src/data/topics.js grouped pages but declared nothing
 * about what each page targets. Without this, a cluster is just a link
 * relationship; with it, the cluster is a keyword strategy that can be checked.
 *
 * Intent values are the four standard search intents:
 *   informational  the reader wants to understand something
 *   transactional  the reader wants to do something
 *   navigational   the reader wants a specific page
 *   commercial     the reader is comparing before acting
 *
 * Every path must be a real route. `npm run audit:seo` fails SEO-027 if one is
 * not, so a stale entry here is caught rather than silently tolerated.
 */

export const INTENTS = [
  {
    path: '/',
    cluster: 'oversight',
    primary: 'constituency development planning',
    secondary: ['MP office', 'prioritise development projects', 'India'],
    intent: 'informational',
    rationale:
      'A first-time visitor, usually an MP office staffer or a civic-tech evaluator, needs to know what the '
      + 'product is and whether it applies to them before anything else.',
  },
  {
    path: '/report-issue',
    cluster: 'reporting',
    primary: 'report a constituency issue',
    secondary: ['citizen grievance', 'MP office grievance', 'MPLADS complaint'],
    intent: 'transactional',
    rationale:
      'The reader has a problem and wants to submit it. This is the only transactional page on the site, so it '
      + 'carries the wording a citizen would actually type.',
  },
  {
    path: '/how-it-works',
    cluster: 'scoring',
    primary: 'how AI ranks citizen requests',
    secondary: ['grievance prioritisation workflow', 'MP office workflow', 'AI in public administration'],
    intent: 'informational',
    rationale:
      'Readers arrive wanting to see the process before trusting it. The page answers "what happens to my '
      + 'complaint" and "can an algorithm decide this".',
  },
  {
    path: '/methodology',
    cluster: 'scoring',
    primary: 'constituency project scoring methodology',
    secondary: ['MPLADS prioritisation', '40-40-20 weighting', 'explainable scoring', 'UDISE+', 'NFHS-5'],
    intent: 'informational',
    rationale:
      'An evaluator or a skeptical official needs the arithmetic, the sources and the safeguards. These are '
      + 'the terms that appear in the Indian civic data domain.',
  },
  {
    path: '/faq',
    cluster: 'scoring',
    primary: 'constituency grievance FAQ',
    secondary: ['does AI decide MPLADS eligibility', 'is grievance data private', 'track a complaint'],
    intent: 'informational',
    rationale:
      'Question-shaped phrasing is deliberate here. These are the questions a reader types verbatim into a '
      + 'search box or asks a voice assistant.',
  },
  {
    path: '/about',
    cluster: 'oversight',
    primary: 'what is Samadhan',
    secondary: ['civic tech India', 'MP office software', 'open civic data'],
    intent: 'informational',
    rationale:
      'A scope and limits page. Readers are deciding whether to trust the project, so the answer is about '
      + 'boundaries rather than features.',
  },
  {
    path: '/privacy',
    cluster: 'oversight',
    primary: 'citizen grievance data privacy',
    secondary: ['personal data protection India', 'DPDP Act compliance', 'contact details'],
    intent: 'informational',
    rationale:
      'A citizen deciding whether to submit real personal data. The phrasing a reader would use is about '
      + 'their own details, not about a generic privacy policy.',
  },
  {
    path: '/accessibility',
    cluster: 'oversight',
    primary: 'accessible civic form',
    secondary: ['WCAG 2.2', 'screen reader accessible form', 'accessible grievance portal'],
    intent: 'informational',
    rationale:
      'Read by people using assistive technology, or by accessibility reviewers. Terms are the standards '
      + 'they will search for.',
  },
  {
    path: '/how-to-report',
    cluster: 'guides',
    primary: 'how to report a constituency issue',
    secondary: ['CPGRAMS grievance', 'public grievance India', 'escalate a grievance', 'RTI request'],
    intent: 'informational',
    rationale:
      'A citizen with a problem is deciding where to send it. The page has to answer that before it can '
      + 'ask them to use this site, so it leads with the official channels and their differences.',
  },
  {
    path: '/mplads',
    cluster: 'guides',
    primary: 'MPLADS fund',
    secondary: ['MPLADS 5 crore per year', 'MP local area development scheme', 'MPLADS eligible works', 'CAG MPLADS report'],
    intent: 'informational',
    rationale:
      'People search for the amount, what it can be spent on, and whether their MP has used it. The page '
      + 'answers all three with dates and figures rather than a scheme summary.',
  },
  {
    path: '/constituency',
    cluster: 'guides',
    primary: 'Lok Sabha constituency',
    secondary: ['543 Lok Sabha seats', 'reserved constituencies SC ST', 'delimitation commission', 'find my MP'],
    intent: 'informational',
    rationale:
      'The query is usually "which constituency am I in" or "how many seats does my state have". The page '
      + 'answers both and explains why the boundaries have not moved since 2008.',
  },
  {
    path: '/research',
    cluster: 'guides',
    primary: 'Samadhan research statistics',
    secondary: ['AI citation data pages', 'constituency data for AI answers', 'LLM-friendly statistics'],
    intent: 'informational',
    rationale:
      'The research hub lists all statistics pages with citation anchors. AI crawlers and retrieval systems '
      + 'use it as the entry point to the site\'s data-backed content.',
  },
  {
    path: '/research/constituencies',
    cluster: 'oversight',
    primary: 'Lok Sabha constituency statistics',
    secondary: ['543 Lok Sabha seats', 'reserved SC ST seats', 'seats by state', 'single seat states'],
    intent: 'informational',
    rationale:
      'Constituency counts per state are a common lookup for MP offices and civic researchers. The ranked '
      + 'list gives every state and UT its seat count and reserved-seat breakdown.',
  },
  {
    path: '/research/districts',
    cluster: 'oversight',
    primary: 'Indian districts statistics',
    secondary: ['789 districts', 'districts by state', 'single district states', 'district count India'],
    intent: 'informational',
    rationale:
      'District counts per state are used for planning and delimitation discussions. The ranked list covers '
      + 'all 36 states and union territories.',
  },
  {
    path: '/research/district-mapping',
    cluster: 'oversight',
    primary: 'district constituency mapping',
    secondary: ['district to Lok Sabha seat mapping', 'resolved districts', 'district seat coverage'],
    intent: 'informational',
    rationale:
      'District and parliamentary constituency boundaries do not align, so this page explains which districts '
      + 'have resolved seat mappings and which fall back to the full state list.',
  },
  {
    path: '/research/faqs',
    cluster: 'scoring',
    primary: 'citizen FAQ statistics',
    secondary: ['FAQ topics', 'privacy FAQs', 'MPLADS FAQs', 'frequently asked questions'],
    intent: 'informational',
    rationale:
      'The FAQ statistics page categorizes all 11 published questions by topic, making each answer citable '
      + 'and quotable for AI answers.',
  },
  {
    path: '/research/search-intents',
    cluster: 'oversight',
    primary: 'search intent statistics',
    secondary: ['informational vs transactional', 'page intent mapping', 'search intent clusters'],
    intent: 'informational',
    rationale:
      'The search-intents page maps all 17 public pages to their search intent type and cluster, showing '
      + 'which pages target which citizen queries.',
  },
];

export default INTENTS;