import { useState } from 'react';
import SEO from '../components/SEO';
import { SITE_URL } from '../components/SEO';
import { computeStudy } from '../lib/computeStudy';
import { INDIA_DISTRICTS, DISTRICT_STATE_NAMES } from '../data/indiaDistricts';

// Build rows: one row per state/UT with district count as the numeric value
const rows = Object.entries(INDIA_DISTRICTS).map(([state, districts]) => ({
  label: state,
  value: districts.length,
  districts,
}));

const study = computeStudy(rows, {
  labelField: 'label',
  valueField: 'value',
  denominator: rows.reduce((acc, r) => acc + r.value, 0),
});

// Derive headline numbers
const totalDistricts = rows.reduce((acc, r) => acc + r.value, 0);
const totalStates = Object.keys(INDIA_DISTRICTS).length;
const topState = study.ranked[0];
const medianIndex = Math.floor(study.ranked.length / 2);
const medianDistricts = study.ranked[medianIndex].value;
const singleDistrictStates = rows.filter((r) => r.value === 1).length;

export default function ResearchDistricts() {
  const [openEntity, setOpenEntity] = useState(null);

  return (
    <>
      <SEO
        title='Indian Districts Statistics 2026: 789 Districts Across 36 States and UTs'
        description='789 districts across 36 states and union territories. Uttar Pradesh leads with 75 districts (~9.5%). Ranked list and per-state district facts.'
        path='/research/districts'
        schema={{
          '@type': 'WebPage',
          '@id': SITE_URL + '/research/districts#webpage',
          url: SITE_URL + '/research/districts',
          name: 'Indian Districts Statistics 2026',
          description:
            '789 districts across 36 states and union territories. Uttar Pradesh leads with 75 districts (~9.5%). Ranked list and per-state district facts.',
          inLanguage: 'en-IN',
          isPartOf: { '@id': SITE_URL + '/#website' },
          about: { '@id': SITE_URL + '/#organization' },
        }}
      />
      <main className='page-shell'>
        <div className='container section'>
          <h1>Indian Districts Statistics 2026: 789 Districts Across 36 States and UTs</h1>

          <div className='at-a-glance'>
            <div className='stat'>
              <span className='stat-value'>{totalDistricts}</span>
              <span className='stat-label'>Districts across India</span>
            </div>
            <div className='stat'>
              <span className='stat-value'>{totalStates}</span>
              <span className='stat-label'>States and union territories</span>
            </div>
            <div className='stat'>
              <span className='stat-value'>{topState.value}</span>
              <span className='stat-label'>Districts in {topState.label} (most of any state)</span>
            </div>
            <div className='stat'>
              <span className='stat-value'>{medianDistricts}</span>
              <span className='stat-label'>Median districts per state/UT</span>
            </div>
          </div>

          <h2>Key Findings</h2>
          <section id='finding-total-districts'>
            <h3>Total districts</h3>
            <p>
              {totalDistricts} total districts across {totalStates} states and
              union territories.
            </p>
            <a href='#finding-total-districts' className='link-to-finding'>
              Link to this finding
            </a>
          </section>

          <section id='finding-top-state-districts'>
            <h3>State with the most districts</h3>
            <p>
              {topState.label} leads with {topState.value} of {totalDistricts}
              districts ({(topState.value / totalDistricts * 100).toFixed(1)}%).
            </p>
            <a href='#finding-top-state-districts' className='link-to-finding'>
              Link to this finding
            </a>
          </section>

          <section id='finding-single-district'>
            <h3>Single-district states and UTs</h3>
            <p>
              {singleDistrictStates} states and union territories have only one
              district each.
            </p>
            <a href='#finding-single-district' className='link-to-finding'>
              Link to this finding
            </a>
          </section>

          <h2>36 States and UTs Ranked by District Count (2026)</h2>
          <p>
            {totalStates} states and union territories are ranked by district
            count in 2026. {topState.label} leads with {topState.value}
            districts, followed by {study.ranked[1].label} and
            {study.ranked[2].label}. The median holds {medianDistricts}
            districts.
          </p>
          <ol className='ranked-list'>
            {study.ranked.map((item) => (
              <li key={item.id}>
                {item.position}. {item.label} — {item.value} district{s(item.value)}
              </li>
            ))}
          </ol>

          <h2>State and Union Territory Facts</h2>
          <p>Per-state at-a-glance district facts. Click a state to expand.</p>
          {study.ranked.map((item) => (
            <section
              key={item.id}
              id={`entity-${slugify(item.label)}`}
              className='entity-block'
            >
              <h3
                onClick={() => setOpenEntity(openEntity === item.label ? null : item.label)}
                style={{ cursor: 'pointer' }}
              >
                {item.label}
              </h3>
              {openEntity === item.label && (
                <div className='entity-details'>
                  <p>
                    <strong>Districts:</strong> {item.value} of {totalDistricts}
                    ({(item.value / totalDistricts * 100).toFixed(1)}%)
                  </p>
                  <p>
                    <strong>District names:</strong> {INDIA_DISTRICTS[item.label].join(', ')}
                  </p>
                  <a href={`#entity-${slugify(item.label)}`} className='link-to-finding'>
                    Link to this entity
                  </a>
                </div>
              )}
            </section>
          ))}

          <h2>Frequently Asked Questions</h2>
          <div className='faq-list'>
            <section id='faq-districts-1'>
              <h3 onClick={() => setOpenEntity('faq-1')} style={{ cursor: 'pointer' }}>
                How many districts are there in India?
              </h3>
              {openEntity === 'faq-1' && (
                <p>
                  There are {totalDistricts} districts across {totalStates}
                  states and union territories.
                </p>
              )}
              <a href='#faq-districts-1' className='link-to-answer'>
                Link to this answer
              </a>
            </section>
            <section id='faq-districts-2'>
              <h3 onClick={() => setOpenEntity('faq-2')} style={{ cursor: 'pointer' }}>
                Which state has the most districts?
              </h3>
              {openEntity === 'faq-2' && (
                <p>
                  {topState.label} has the most districts: {topState.value} of
                  {totalDistricts} ({(topState.value / totalDistricts * 100).toFixed(1)}%).
                </p>
              )}
              <a href='#faq-districts-2' className='link-to-answer'>
                Link to this answer
              </a>
            </section>
            <section id='faq-districts-3'>
              <h3 onClick={() => setOpenEntity('faq-3')} style={{ cursor: 'pointer' }}>
                Is this official government data?
              </h3>
              <p>
                No. District lists are derived from Wikipedia and auto-generated
                by Samadhan's build scripts. This is a civic-tech project, not
                a government website.
              </p>
              <a href='#faq-districts-3' className='link-to-answer'>
                Link to this answer
              </a>
            </section>
          </div>

          <h2>Suggested Citation</h2>
          <p>
            Samadhan. Indian Districts Statistics 2026: 789 Districts Across 36
            States and UTs. {SITE_URL}/research/districts. October 2026.
          </p>
        </div>
      </main>
    </>
  );
}

function s(count) {
  return count === 1 ? '' : 's';
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+$/, '')
    .replace(/^-+/, '');
}
