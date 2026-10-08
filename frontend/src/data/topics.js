/**
 * Topic map for internal linking.
 *
 * The audit flagged three related failures:
 *   SEO-131  internal linking was hard-coded per page, with no automation
 *   SEO-132  no topical authority map
 *   SEO-137  no content silos — every page sat alone at one level
 *
 * All three are the same underlying problem: the link graph was written by hand
 * inside each page, so it could not be reasoned about as a structure. Defining
 * the clusters here makes the graph a single editable object and lets one
 * component render the hub for every page, which is what "automated internal
 * linking" actually requires.
 *
 * Rules the map obeys:
 *   - every cluster has one hub, and the hub is the page a reader should read
 *     first
 *   - a hub must be a page that actually renders <RelatedPages />. /report-issue
 *     used to be the hub of the reporting cluster, but a link hub underneath a
 *     grievance form was wrong: the form is the end of the task, and a reader who
 *     has just filed something should not be offered four other documents. That
 *     page no longer renders the block, so the hub moved to /faq, which is where
 *     the questions about reporting are actually answered. /report-issue stays in
 *     the cluster as a member, so it is still one click from /faq, /privacy and
 *     /accessibility.
 *   - a page appears in at least one cluster, so no page is orphaned
 *   - paths are real routes; a stale entry is caught by the audit
 */

export const TOPICS = [
  {
    id: 'reporting',
    hub: '/faq',
    title: 'Reporting a constituency issue',
    blurb:
      'What the citizen portal asks for, what happens to a submission, and what a reference ID does and does not mean.',
    pages: [
      { path: '/faq', role: 'hub', label: 'Questions about reporting an issue' },
      { path: '/report-issue', role: 'detail', label: 'Report a constituency issue' },
      { path: '/privacy', role: 'detail', label: 'How your details are handled' },
      { path: '/accessibility', role: 'detail', label: 'Accessibility of the form' },
    ],
  },
  {
    id: 'scoring',
    hub: '/methodology',
    title: 'How the priority score works',
    blurb:
      'The 40-40-20 weighting, the three scored components, the safeguards, and the limits of a fixed-weighting model.',
    pages: [
      { path: '/methodology', role: 'hub', label: 'The scoring methodology' },
      { path: '/how-it-works', role: 'detail', label: 'The six-step workflow' },
      { path: '/faq', role: 'detail', label: 'Questions about ranking' },
    ],
  },
  {
    id: 'oversight',
    hub: '/about',
    title: 'What this platform does and does not do',
    blurb:
      'Scope, audiences, stated limits, and the two failure modes that are structural rather than fixable in code.',
    pages: [
      { path: '/about', role: 'hub', label: 'About Samadhan' },
      { path: '/privacy', role: 'detail', label: 'Privacy and data handling' },
      { path: '/accessibility', role: 'detail', label: 'Accessibility commitments' },
      { path: '/methodology', role: 'detail', label: 'Limits of the scoring model' },
    ],
  },
];

/** Every page referenced above, for an orphan check. */
export const ALL_TOPIC_PATHS = [...new Set(TOPICS.flatMap((t) => t.pages.map((p) => p.path)))];

/**
 * Every cluster a path takes part in, whether as its hub or as one of its pages.
 *
 * A path can belong to more than one cluster. /faq is a spoke under both
 * reporting and scoring; /privacy and /accessibility are spokes under both
 * reporting and oversight; /methodology is the hub of scoring and a detail page
 * under oversight. The previous helpers answered this question with
 * `TOPICS.find(...)`, which returns the *first* match, so /faq only ever
 * advertised the reporting cluster. A reader who landed on /faq asking how the
 * ranking works was never shown a link to /methodology, even though the map
 * said it should be there.
 */
export function clustersFor(path) {
  return TOPICS.filter((t) => t.hub === path || t.pages.some((p) => p.path === path));
}

/**
 * Every page RelatedPages will link to from `path`, in render order: each
 * cluster's hub first, then that cluster's other pages, de-duplicated.
 *
 * Never includes `path` itself, and never invents a path that is not in the map,
 * so a page added to the router without a cluster entry simply renders no hub
 * rather than a fabricated one.
 */
export function linksFor(path, limit = 8) {
  const out = [];
  const seen = new Set([path]);
  const push = (entry) => {
    if (!entry || seen.has(entry.path)) return;
    seen.add(entry.path);
    out.push(entry);
  };
  for (const cluster of clustersFor(path)) {
    if (cluster.hub !== path) push(cluster.pages.find((p) => p.path === cluster.hub));
    for (const p of cluster.pages) push(p);
  }
  return out.slice(0, limit);
}

/** The clusters a path is the hub of. Used for the intro copy above the links. */
export function hubsFor(path) {
  return TOPICS.filter((t) => t.hub === path);
}