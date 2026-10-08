import { Link } from 'react-router-dom'
import { hubsFor, linksFor } from '../data/topics'

/**
 * Internal link hub, generated from the topic map.
 *
 * Replaces hand-placed cross-links in each page. Those were written inline and
 * had drifted: the audit found /report-issue carrying zero contextual
 * cross-links while other pages carried a link dump that repeated the footer.
 * Rendering from one map means the graph can be reasoned about as a structure,
 * and no page can silently end up orphaned.
 *
 * A page can sit in more than one cluster — /faq is a spoke under both
 * reporting and scoring — so this unions every cluster the page takes part in
 * rather than picking the first match. Before that fix, /faq advertised only the
 * reporting cluster and a reader asking about ranking was never pointed at
 * /methodology.
 *
 * Renders nothing when a path is in no cluster, so a new page does not get an
 * invented hub.
 */
export default function RelatedPages({ path, heading = 'Related' }) {
  const links = linksFor(path)
  if (links.length === 0) return null

  // A page that is the hub of one or more clusters introduces them; a page that
  // is only a spoke gets straight to the links.
  const hubs = hubsFor(path)

  return (
    <nav className='related' aria-label={`${heading}: continue reading`}>
      <h2 className='related__heading'>{heading}</h2>

      {hubs.map((c) => (
        <div className='related__cluster' key={c.id}>
          {hubs.length > 1 && <h3 className='related__cluster-title'>{c.title}</h3>}
          <p className='related__blurb'>{c.blurb}</p>
        </div>
      ))}

      {/* One flat list across every cluster. A reader should not have to read a
          heading to work out that a link is relevant to them. */}
      <ul className='related__list'>
        {links.map((p) => (
          <li key={p.path} className='related__item'>
            <Link
              to={p.path}
              className={'related__link' + (p.role === 'hub' ? ' related__link--hub' : '')}
            >
              {p.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}