import { useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { SITE_URL } from '../components/SEO';
import { computeStudy } from '../lib/computeStudy';
import { STATE_CONSTITUENCIES, CONSTITUENCY_COUNT, STATE_COUNT } from '../data/constituencyData';

// Build rows: one row per state/UT with seat count as the numeric value
const rows = Object.entries(STATE_CONSTITUENCIES).map(([state, seats]) => ({
  label: state,
  value: seats.length,
  category: seats.some((s) => /\(SC\)|\(ST\)/.test(s)) ? 'Has reserved seats' : 'General only',
  seats,
}));

const study = computeStudy(rows, {
  labelField: 'label',
  valueField: 'value',
  categoryField: 'category',
  denominator: CONSTITUENCY_COUNT,
});

// Derive headline numbers from the same study (one calculation, everywhere)
const totalSeats = CONSTITUENCY_COUNT;
const totalStates = STATE_COUNT;
const topState = study.ranked[0];
const reservedCount = Object.values(STATE_CONSTITUENCIES).flat().filter((s) => /\(SC\)|\(ST\)/.test(s)).length;
const singleSeatStates = rows.filter((r) => r.value === 1).length;
const medianIndex = Math.floor(study.ranked.length / 2);
const medianSeats = study.ranked[medianIndex].value;

export default function ResearchConstituencies() {
  const [openFinding, setOpenFinding] = useState(null);
  const [openEntity, setOpenEntity] = useState(null);

  return (
    <>
      <SEO
        title='Lok Sabha Constituency Statistics 2026: 543 Seats Across 36 States and UTs'
        description='543 Lok Sabha constituencies across 36 states and union territories. Uttar Pradesh leads with 80 seats (~14.7%). Ranked list, reserved-seat breakdown, and per-state entity facts.'
        path='/research/constituencies'
        schema={{
          '@type': 'WebPage',
          '@id': SITE_URL + '/research/constituencies#webpage',
          url: SITE_URL + '/research/constituencies',
          name: 'Lok Sabha Constituency Statistics 2026',
          description:
            '543 Lok Sabha constituencies across 36 states and union territories. Uttar Pradesh leads with 80 seats (~14.7%). Ranked list, reserved-seat breakdown, and per-state entity facts.',
          inLanguage: 'en-IN',
          isPartOf: { '@id': SITE_URL + '/#website' },
          about: { '@id': SITE_URL + '/#organization' },
        }}
        // FAQPage JSON-LD (matches visible FAQ text exactly)
      />
      <main className='page-shell'>
        <div className='container section'>
          <h1>Lok Sabha Constituency Statistics 2026: 543 Seats Across 36 States and UTs</h1>

          {/* At-a-glance headline numbers */}
          <div className='at-a-glance'>
            <div className='stat'>
              <span className='stat-value'>{totalSeats}</span>
              <span className='stat-label'>Lok Sabha constituencies</span>
            </div>
            <div className='stat'>
              <span className='stat-value'>{totalStates}</span>
              <span className='stat-label'>States and union territories</span>
            </div>
            <div className='stat'>
              <span className='stat-value'>{topState.value}</span>
              <span className='stat-label'>Seats in {topState.label} (most of any state)</span>
            </div>
            <div className='stat'>
              <span className='stat-value'>{reservedCount}</span>
              <span className='stat-label'>Reserved (SC/ST) seats</span>
            </div>
          </div>

          {/* Key findings with stable anchors */}
          <h2>Key Findings</h2>
          <p>
            Each finding states the count, the denominator, and the percentage.
            Use <strong>Link to this finding</strong> to cite a specific number.
          </p>

          <section id='finding-total'>
            <h3>Total seats</h3>
            <p>
              {totalSeats} total Lok Sabha constituencies across {totalStates}
              states and union territories.
            </p>
            <a href='#finding-total' className='link-to-finding'>Link to this finding</a>
          </section>

          <section id='finding-top-state'>
            <h3>State with the most seats</h3>
            <p>
              {topState.label} leads with {topState.value} of {totalSeats} seats
              ({(topState.value / totalSeats * 100).toFixed(1)}%).
            </p>
            <a href='#finding-top-state' className='link-to-finding'>Link to this finding</a>
          </section>

          <section id='finding-reserved'>
            <h3>Reserved (SC/ST) seats</h3>
            <p>
              {reservedCount} seats are reserved for Scheduled Castes and
              Scheduled Tribes ({(reservedCount / totalSeats * 100).toFixed(1)}%
              of {totalSeats}).
            </p>
            <a href='#finding-reserved' className='link-to-finding'>Link to this finding</a>
          </section>

          <section id='finding-single-seat'>
            <h3>Single-seat states and UTs</h3>
            <p>
              {singleSeatStates} states and union territories have only one Lok
              Sabha seat each.
            </p>
            <a href='#finding-single-seat' className='link-to-finding'>Link to this finding</a>
          </section>

          {/* Ranked list */}
          <h2>36 States and UTs Ranked by Lok Sabha Seats (2026)</h2>
          <p>
            {totalStates} states and union territories are ranked by Lok Sabha
            seat count in 2026. {topState.label} leads with {topState.value}
            seats, followed by {study.ranked[1].label} and
            {study.ranked[2].label}. The median holds {medianSeats} seats.
          </p>
          <ol className='ranked-list'>
            {study.ranked.map((item) => (
              <li key={item.id}>
                {item.position}. {item.label} — {item.value} seat{s(item.value)}
              </li>
            ))}
          </ol>

          {/* Entity blocks: per-state at-a-glance */}
          <h2>State and Union Territory Facts</h2>
          <p>Per-state at-a-glance facts. Click a state to expand its detail.</p>
          {study.ranked.map((item) => {
            const stateRows = STATE_CONSTITUENCIES[item.label];
            const hasReserved = stateRows.some((s) => /\(SC\)|\(ST\)/.test(s));
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
                      <strong>Seats:</strong> {item.value} of {totalSeats}
                      ({(item.value / totalSeats * 100).toFixed(1)}%)
                    </p>
                    <p>
                      <strong>Reserved (SC/ST):</strong>
                      {hasReserved ? 'Yes' : 'No'}
                    </p>
                    <p>
                      <strong>Constituencies:</strong> {stateRows.join(', ')}
                    </p>
                    <a href={`#entity-${slugify(item.label)}`} className='link-to-finding'>
                      Link to this entity
                    </a>
                  </div>
                )}
              </section>
            );
          })}

          {/* FAQ */}
          <h2>Frequently Asked Questions</h2>
          <div className='faq-list'>
            <section id='faq-constituencies-1'>
              <h3 onClick={() => setOpenFinding('faq-1')} style={{ cursor: 'pointer' }}>
                How many Lok Sabha constituencies are there in India?
              </h3>
              {openFinding === 'faq-1' && (
                <p>
                  There are {totalSeats} Lok Sabha constituencies across
                  {totalStates} states and union territories.
                </p>
              )}
              <a href='#faq-constituencies-1' className='link-to-answer'>
                Link to this answer
              </a>
            </section>
            <section id='faq-constituencies-2'>
              <h3 onClick={() => setOpenFinding('faq-2')} style={{ cursor: 'pointer' }}>
                Which state has the most Lok Sabha seats?
              </h3>
              {openFinding === 'faq-2' && (
                <p>
                  {topState.label} has the most seats: {topState.value} of
                  {totalSeats} ({(topState.value / totalSeats * 100).toFixed(1)}%).
                </p>
              )}
              <a href='#faq-constituencies-2' className='link-to-answer'>
                Link to this answer
              </a>
            </section>
            <section id='faq-constituencies-3'>
              <h3 onClick={() => setOpenFinding('faq-3')} style={{ cursor: 'pointer' }}>
                How many seats are reserved for SC/ST?
              </h3>
              {openFinding === 'faq-3' && (
                <p>
                  {reservedCount} seats are reserved for Scheduled Castes and
                  Scheduled Tribes ({(reservedCount / totalSeats * 100).toFixed(1)}%
                  of {totalSeats}).
                </p>
              )}
              <a href='#faq-constituencies-3' className='link-to-answer'>
                Link to this answer
              </a>
            </section>
            <section id='faq-constituencies-4'>
              <h3 onClick={() => setOpenFinding('faq-4')} style={{ cursor: 'pointer' }}>
                Is this official government data?
              </h3>
              <p>
                No. This is a civic-tech project built from the published 2024
                Lok Sabha seat catalog (myneta.info/ADR). It is not a government
                website and not an official channel of any government body.
              </p>
              <a href='#faq-constituencies-4' className='link-to-answer'>
                Link to this answer
              </a>
            </section>
          </div>

          {/* Suggested citation */}
          <h2>Suggested Citation</h2>
          <p>
            Samadhan. Lok Sabha Constituency Statistics 2026: 543 Seats Across
            36 States and UTs. {SITE_URL}/research/constituencies. October 2026.
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
