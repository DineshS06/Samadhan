import { useState } from 'react';
import SEO from '../components/SEO';
import { SITE_URL } from '../components/SEO';
import { computeStudy } from '../lib/computeStudy';
import INTENTS from '../data/intents';

// Build rows: one row per intent entry
const rows = INTENTS.map((intent, index) => ({
  id: `intent-${index + 1}`,
  label: intent.path,
  value: 1,
  category: intent.intent,
  cluster: intent.cluster,
  primary: intent.primary,
  rationale: intent.rationale,
}));

const study = computeStudy(rows, {
  labelField: 'label',
  valueField: 'value',
  categoryField: 'category',
  denominator: rows.length,
});

const totalIntents = INTENTS.length;
const informationalCount = INTENTS.filter((i) => i.intent === 'informational').length;
const transactionalCount = INTENTS.filter((i) => i.intent === 'transactional').length;
const clusters = [...new Set(INTENTS.map((i) => i.cluster))];

export default function ResearchSearchIntents() {
  const [openEntity, setOpenEntity] = useState(null);

  return (
    <>
      <SEO
        title={`Search Intent Statistics 2026: ${totalIntents} Public Pages Mapped`}
        description={`${totalIntents} public pages with mapped search intent. ${informationalCount} informational (${(informationalCount / totalIntents * 100).toFixed(1)}%), ${transactionalCount} transactional (${(transactionalCount / totalIntents * 100).toFixed(1)}%). Ranked list and per-page intent facts.`}
        path='/research/search-intents'
        schema={{
          '@type': 'WebPage',
          '@id': SITE_URL + '/research/search-intents#webpage',
          url: SITE_URL + '/research/search-intents',
          name: 'Search Intent Statistics 2026',
          description:
            `${totalIntents} public pages with mapped search intent. ${informationalCount} informational (${(informationalCount / totalIntents * 100).toFixed(1)}%), ${transactionalCount} transactional (${(transactionalCount / totalIntents * 100).toFixed(1)}%). Ranked list and per-page intent facts.`,
          inLanguage: 'en-IN',
          isPartOf: { '@id': SITE_URL + '/#website' },
          about: { '@id': SITE_URL + '/#organization' },
        }}
      />
      <main className='page-shell'>
        <div className='container section'>
          <h1>Search Intent Statistics 2026: {totalIntents} Public Pages Mapped</h1>

          <div className='at-a-glance'>
            <div className='stat'>
              <span className='stat-value'>{totalIntents}</span>
              <span className='stat-label'>Public pages with mapped search intent</span>
            </div>
            <div className='stat'>
              <span className='stat-value'>{informationalCount}</span>
              <span className='stat-label'>Informational pages (~92%)</span>
            </div>
            <div className='stat'>
              <span className='stat-value'>{transactionalCount}</span>
              <span className='stat-label'>Transactional page (~8%)</span>
            </div>
            <div className='stat'>
              <span className='stat-value'>{clusters.length}</span>
              <span className='stat-label'>Intent clusters</span>
            </div>
          </div>

          <h2>Key Findings</h2>
          <section id='finding-total-intents'>
            <h3>Total pages with mapped intent</h3>
            <p>{totalIntents} public pages have mapped search intent.</p>
            <a href='#finding-total-intents' className='link-to-finding'>
              Link to this finding
            </a>
          </section>

          <section id='finding-intent-types'>
            <h3>Intent type distribution</h3>
            <p>
              {informationalCount} pages are informational (
              {(informationalCount / totalIntents * 100).toFixed(1)}%), and
              {transactionalCount} page is transactional (
              {(transactionalCount / totalIntents * 100).toFixed(1)}%).
            </p>
            <a href='#finding-intent-types' className='link-to-finding'>
              Link to this finding
            </a>
          </section>

          <section id='finding-transactional-page'>
            <h3>The only transactional page</h3>
            <p>
              /report-issue is the only transactional page, targeting
              "report a constituency issue" — the wording a citizen would
              actually type.
            </p>
            <a href='#finding-transactional-page' className='link-to-finding'>
              Link to this finding
            </a>
          </section>

          <section id='finding-clusters'>
            <h3>Intent clusters</h3>
            <p>
              {clusters.length} intent clusters: {clusters.join(', ')}.
            </p>
            <a href='#finding-clusters' className='link-to-finding'>
              Link to this finding
            </a>
          </section>

          <h2>{totalIntents} Pages by Search Intent Type (2026)</h2>
          <p>
            {totalIntents} public pages are listed by search intent type and
            cluster. Each entry includes its primary keyword and rationale.
          </p>
          <ol className='ranked-list'>
            {study.ranked.map((item) => {
              const intent = INTENTS.find((i) => i.path === item.label);
              return (
                <li key={item.id}>
                  {item.position}. {item.label} — {item.category} ({intent?.cluster ?? '—'})
                </li>
              );
            })}
          </ol>

          {/* Entity blocks: per-page intent */}
          <h2>Per-Page Intent Facts</h2>
          <p>
            Per-page at-a-glance intent facts. Click a page to expand its
            detail.
          </p>
          {study.ranked.map((item) => {
            const intent = INTENTS.find((i) => i.path === item.label);
            return (
              <section
                key={item.id}
                id={`entity-intent-${slugify(item.label)}`}
                className='entity-block'
              >
                <h3
                  onClick={() =>
                    setOpenEntity(openEntity === item.label ? null : item.label)
                  }
                  style={{ cursor: 'pointer' }}
                >
                  {item.label}
                </h3>
                {openEntity === item.label && (
                  <div className='entity-details'>
                    <p><strong>Intent:</strong> {intent.intent}</p>
                    <p><strong>Cluster:</strong> {intent.cluster}</p>
                    <p><strong>Primary keyword:</strong> {intent.primary}</p>
                    <p><strong>Rationale:</strong> {intent.rationale}</p>
                    <a href={`#entity-intent-${slugify(item.label)}`} className='link-to-finding'>
                      Link to this entity
                    </a>
                  </div>
                )}
              </section>
            );
          })}

          <h2>Frequently Asked Questions</h2>
          <div className='faq-list'>
            <section id='faq-intents-1'>
              <h3 onClick={() => setOpenEntity('faq-1')} style={{ cursor: 'pointer' }}>
                How many pages have mapped search intent?
              </h3>
              {openEntity === 'faq-1' && (
                <p>
                  {totalIntents} public pages have mapped search intent, with
                  every path validated as a real route.
                </p>
              )}
              <a href='#faq-intents-1' className='link-to-answer'>
                Link to this answer
              </a>
            </section>
            <section id='faq-intents-2'>
              <h3 onClick={() => setOpenEntity('faq-2')} style={{ cursor: 'pointer' }}>
                What is the most common search intent type?
              </h3>
              {openEntity === 'faq-2' && (
                <p>
                  Informational: {informationalCount} of {totalIntents} pages (
                  {(informationalCount / totalIntents * 100).toFixed(1)}%).
                </p>
              )}
              <a href='#faq-intents-2' className='link-to-answer'>
                Link to this answer
              </a>
            </section>
            <section id='faq-intents-3'>
              <h3 onClick={() => setOpenEntity('faq-3')} style={{ cursor: 'pointer' }}>
                What is the only transactional page?
              </h3>
              {openEntity === 'faq-3' && (
                <p>
                  /report-issue is the only transactional page, targeting
                  "report a constituency issue."
                </p>
              )}
              <a href='#faq-intents-3' className='link-to-answer'>
                Link to this answer
              </a>
            </section>
          </div>

          <h2>Suggested Citation</h2>
          <p>
            Samadhan. Search Intent Statistics 2026: {totalIntents} Public Pages Mapped.
            {SITE_URL}/research/search-intents. October 2026.
          </p>
        </div>
      </main>
    </>
  );
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+$/, '')
    .replace(/^-+/, '');
}
