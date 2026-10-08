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
];

export default INTENTS;