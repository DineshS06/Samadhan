import { useState } from 'react';
import SEO from '../components/SEO';
import { SITE_URL } from '../components/SEO';
import { computeStudy } from '../lib/computeStudy';
import { DISTRICT_CONSTITUENCIES } from '../data/districtSeatMap';
import { INDIA_DISTRICTS } from '../data/indiaDistricts';

// Build rows: one row per resolved district with seat count as value
const rows = [];
Object.entries(DISTRICT_CONSTITUENCIES).forEach(([state, districtMap]) => {
  Object.entries(districtMap).forEach(([district, seats]) => {
    rows.push({
      label: district,
      state,
      value: seats.length,
      category: state,
      seats,
    });
  });
});

const totalDistrictsInIndia = Object.values(INDIA_DISTRICTS).reduce(
  (acc, districts) => acc + districts.length,
  0
);

const study = computeStudy(rows, {
  labelField: 'label',
  valueField: 'value',
  categoryField: 'category',
  denominator: totalDistrictsInIndia,
});

const resolvedDistricts = rows.length;
const totalStates = Object.keys(DISTRICT_CONSTITUENCIES).length;
const coveragePercent = ((resolvedDistricts / totalDistrictsInIndia) * 100).toFixed(1);
const unresolvedDistricts = totalDistrictsInIndia - resolvedDistricts;
const topState = study.ranked[0];

export default function ResearchDistrictMapping() {
  const [openEntity, setOpenEntity] = useState(null);

  return (
    <>
      <SEO
        title='District-to-Constituency Mapping Statistics 2026: 299 Resolved Districts Across 15 States'
        description='299 resolved districts across 15 states mapped to Lok Sabha seats (~38% coverage of 789 districts). Ranked list and per-state mapping coverage.'
        path='/research/district-mapping'
        schema={{
          '@type': 'WebPage',
          '@id': SITE_URL + '/research/district-mapping#webpage',
          url: SITE_URL + '/research/district-mapping',
          name: 'District-to-Constituency Mapping Statistics 2026',
          description:
            '299 resolved districts across 15 states mapped to Lok Sabha seats (~38% coverage of 789 districts). Ranked list and per-state mapping coverage.',
          inLanguage: 'en-IN',
          isPartOf: { '@id': SITE_URL + '/#website' },
          about: { '@id': SITE_URL + '/#organization' },
        }}
      />
      <main className='page-shell'>
        <div className='container section'>
          <h1>
            District-to-Constituency Mapping Statistics 2026: 299 Resolved
            Districts Across 15 States
          </h1>

          <div className='at-a-glance'>
            <div className='stat'>
              <span className='stat-value'>{resolvedDistricts}</span>
              <span className='stat-label'>Resolved districts across 15 states</span>
            </div>
            <div className='stat'>
              <span className='stat-value'>{coveragePercent}%</span>
              <span className='stat-label'>Coverage of 789 total districts</span>
            </div>
            <div className='stat'>
              <span className='stat-value'>{unresolvedDistricts}</span>
              <span className='stat-label'>Districts without resolved mappings</span>
            </div>
            <div className='stat'>
              <span className='stat-value'>{totalStates}</span>
              <span className='stat-label'>States with curated mappings</span>
            </div>
          </div>

          <h2>Key Findings</h2>
          <section id='finding-resolved-districts'>
            <h3>Resolved district→seat mappings</h3>
            <p>
              {resolvedDistricts} districts have resolved Lok Sabha seat
              mappings across {totalStates} states.
            </p>
            <a href='#finding-resolved-districts' className='link-to-finding'>
              Link to this finding
            </a>
          </section>

          <section id='finding-coverage-percent'>
            <h3>Coverage percentage</h3>
            <p>
              {resolvedDistricts} of {totalDistrictsInIndia} districts
              ({coveragePercent}%) have a resolved seat mapping.
            </p>
            <a href='#finding-coverage-percent' className='link-to-finding'>
              Link to this finding
            </a>
          </section>

          <section id='finding-unresolved'>
            <h3>Unresolved districts</h3>
            <p>
              {unresolvedDistricts} districts ({(100 - parseFloat(coveragePercent)).toFixed(1)}%)
              fall back to the full state seat list, because district and
              parliamentary constituency boundaries do not align in India.
            </p>
            <a href='#finding-unresolved' className='link-to-finding'>
              Link to this finding
            </a>
          </section>

          <h2>15 States Ranked by Resolved District→Seat Mappings (2026)</h2>
          <p>
            {totalStates} states are ranked by resolved district count in 2026.
            {topState.label} leads with {topState.value} resolved districts.
          </p>
          <ol className='ranked-list'>
            {study.ranked.map((item) => (
              <li key={item.id}>
                {item.position}. {item.label} — {item.value} resolved district{s(item.value)}
              </li>
            ))}
          </ol>

          <h2>State Mapping Coverage</h2>
          <p>Per-state at-a-glance mapping coverage. Click a state to expand.</p>
          {study.ranked.map((item) => {
            const stateMap = DISTRICT_CONSTITUENCIES[item.category];
            const resolvedCount = Object.keys(stateMap).length;
            const totalStateDistricts = INDIA_DISTRICTS[item.category]?.length || 0;
            const stateCoverage = totalStateDistricts > 0
              ? ((resolvedCount / totalStateDistricts) * 100).toFixed(1)
              : 0;
            return (
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
                      <strong>Resolved districts:</strong> {resolvedCount} of
                      {totalStateDistricts} ({stateCoverage}%)
                    </p>
                    <p>
                      <strong>Example seats:</strong>
                      {Object.values(stateMap)
                        .flat()
                        .slice(0, 5)
                        .join(', ')}
                    </p>
                    <a href={`#entity-${slugify(item.label)}`} className='link-to-finding'>
                      Link to this entity
                    </a>
                  </div>
                )}
              </section>
            );
          })}

          <h2>Frequently Asked Questions</h2>
          <div className='faq-list'>
            <section id='faq-mapping-1'>
              <h3 onClick={() => setOpenEntity('faq-1')} style={{ cursor: 'pointer' }}>
                Why don't all districts have a resolved seat mapping?
              </h3>
              {openEntity === 'faq-1' && (
                <p>
                  Because district and parliamentary constituency boundaries do
                  not line up in India. One district can span several seats and
                  vice versa, so a single-seat answer would be wrong. Districts
                  without a curated mapping fall back to showing every seat in
                  the state.
                </p>
              )}
              <a href='#faq-mapping-1' className='link-to-answer'>
                Link to this answer
              </a>
            </section>
            <section id='faq-mapping-2'>
              <h3 onClick={() => setOpenEntity('faq-2')} style={{ cursor: 'pointer' }}>
                How many districts have resolved mappings?
              </h3>
              {openEntity === 'faq-2' && (
                <p>
                  {resolvedDistricts} of {totalDistrictsInIndia} districts
                  ({coveragePercent}%) have resolved Lok Sabha seat mappings
                  across {totalStates} states.
                </p>
              )}
              <a href='#faq-mapping-2' className='link-to-answer'>
                Link to this answer
              </a>
            </section>
            <section id='faq-mapping-3'>
              <h3 onClick={() => setOpenEntity('faq-3')} style={{ cursor: 'pointer' }}>
                Is this official government data?
              </h3>
              <p>
                No. This is a civic-tech project. The mapping table is curated
                and resolved against the official 543-seat list, but it is not a
                government website or official channel.
              </p>
              <a href='#faq-mapping-3' className='link-to-answer'>
                Link to this answer
              </a>
            </section>
          </div>

          <h2>Suggested Citation</h2>
          <p>
            Samadhan. District-to-Constituency Mapping Statistics 2026: 299
            Resolved Districts Across 15 States. {SITE_URL}/research/district-mapping.
            October 2026.
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
