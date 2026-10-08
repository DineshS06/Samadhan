import Header from '../components/Header';
import Footer from '../components/Footer';
import Breadcrumb from '../components/Breadcrumb';
import SectionHeading from '../components/SectionHeading';
import { Link } from 'react-router-dom';
import InputCard, { Detail } from '../components/InputCard';
import RelatedPages from '../components/RelatedPages';

// Public datasets the deficit component may draw on. Listed as data rather than
// prose so the citations stay visible next to the component that uses them, and
// so SEO-052 has something real to verify.
//
// Link status was checked rather than assumed:
//   udiseplus.gov.in, mospi.gov.in, mplads.mospi.gov.in  -> verified 200
//   rchiips.org        -> certificate EXPIRED, replaced with the MoSPI page
//   censusindia.gov.in -> serves an incomplete certificate chain; browsers
//                         generally recover via cached intermediates, but it
//                         could not be verified here. MoSPI is linked alongside.
//   nhm.gov.in         -> connection timed out repeatedly; not linked, named only
const DEFICIT_SOURCES = [
  {
    label: 'Census of India 2011',
    href: 'https://censusindia.gov.in/',
    note: 'settlement pattern, household amenities, and access to drinking water and sanitation',
  },
  {
    label: 'Ministry of Statistics and Programme Implementation',
    href: 'https://www.mospi.gov.in/',
    note: 'publisher of the Census and the NFHS-5 national report; the stable route to both when a publisher site is unreachable',
  },
  {
    label: 'National Family Health Survey (NFHS-5)',
    href: 'https://www.mospi.gov.in/publication/national-family-health-survey-2019-20-nfhs-5',
    note: 'maternal health, child nutrition, sanitation access, and household health indicators. Published by IIPS with the Ministry of Health and Family Welfare; the IIPS site at rchiips.org currently serves an expired certificate, so the MoSPI copy is linked instead.',
  },
  {
    label: 'UDISE+',
    href: 'https://udiseplus.gov.in/',
    note: 'school infrastructure, enrolment, and facility gaps in the education sector',
  },
  {
    label: 'PMGSY',
    note: 'all-weather road and connectivity coverage under the Pradhan Mantri Gram Sadak Yojana',
  },
  {
    label: 'National Health Mission',
    note: 'facility availability for primary health infrastructure. Named as a source; not linked because nhm.gov.in did not respond to repeated connection attempts.',
  },
  {
    label: 'MPLADS eSAKSHI portal',
    href: 'https://mplads.mospi.gov.in/',
    note: 'scheme rules and allocation data from the Ministry of Panchayati Raj and the Ministry of Statistics and Programme Implementation',
  },
];

export default function Methodology() {
  return (
    <div className='page-shell'>
      <Header />
      <main>
        <Breadcrumb className='container' />

        <section className='page-hero'>
          <div className='container page-hero__inner'>
            <p className='eyebrow'>Priority methodology</p>
            <h1>How constituency project priorities are scored</h1>
            <p className='page-hero__lead'>
              Samadhan turns multilingual citizen requests into a ranked review order using a
              transparent 40-40-20 scoring model. Every score is traceable to the demand, the
              infrastructure evidence, and the urgency that produced it, so an MP office can
              check the reasoning instead of trusting a black box.
            </p>
          </div>
        </section>

        <section className='section'>
          <div className='container reading-column'>
            <SectionHeading
              eyebrow='The formula'
              title='What the priority score measures'
              copy='One weighted sum of three components, published in advance and identical for every constituency. The score is a review order, not a funding decision.'
            />

            {/* "The priority score is calculated as:" was a whole paragraph
                whose content was a colon, sitting above the formula. */}
            <p className='formula' aria-label='Priority score formula'>
              Priority Score = (0.4 &times; Demand Volume) + (0.4 &times; Infrastructure Deficit) + (0.2 &times; Severity)
            </p>
            <p>
              Each input is normalised to a common scale before weighting, so a heavily reported
              but well-served category cannot automatically outrank a lightly reported category
              with severe infrastructure deficit. The weights are fixed in advance rather than
              tuned per constituency, so two constituencies are scored on the same terms. They have
              not been fitted against completed projects; that limit is listed below.
            </p>
          </div>
        </section>

        <section className='section section--soft'>
          <div className='container reading-column'>
            <SectionHeading
              eyebrow='Inputs'
              title='The three scored components'
              copy='Each card states what the component measures, how it is read, and — most importantly — what it cannot tell you.'
            />

            <div className='input-stack'>
              <InputCard
                name='Demand volume'
                weight={40}
                headline='How many distinct people have reported a problem here.'
              >
                <Detail label='How it is read'>
                  <p>
                    Demand counts verified, unique citizen inputs for a location and category.
                    Uniqueness matters more than volume: repeated reports of the same underlying
                    problem are deduplicated so that one vocal cluster cannot manufacture a high
                    priority. Time decay is applied, because a problem reported repeatedly over
                    two years and one reported urgently this month are not the same problem.
                  </p>
                </Detail>
                <Detail label='Why the cap is 40%'>
                  <p>
                    Demand alone is never sufficient. A well-served ward with an active local
                    committee can generate more reports than an unserved one with no complaint
                    culture, so demand is always read alongside the deficit component.
                  </p>
                </Detail>
                <p className='input-card__note'>
                  This component measures reporting, not need. That is the single most important
                  limitation on this page, and it is why the weight cannot rise.
                </p>
              </InputCard>

              <InputCard
                name='Infrastructure deficit'
                weight={40}
                headline='How far a place falls short of the standard it is measured against.'
                sources={DEFICIT_SOURCES}
              >
                <Detail label='How it is read'>
                  <p>
                    Deficit measures the gap between what a location needs and what it currently
                    has. Crucially, the gap must come from a named, relevant public dataset rather
                    than from an assumption embedded in the code.
                  </p>
                  <p>
                    Each indicator is versioned and dated, so an official can see which release of
                    which dataset supported a score and when that data was published. Older
                    releases are flagged rather than silently used.
                  </p>
                </Detail>
                <Detail label='Scheme rules'>
                  <p>
                    Scheme rules and allocation data come from the MPLADS eSAKSHI portal of the
                    Ministry of Panchayati Raj and the Ministry of Statistics and Programme
                    Implementation. Samadhan does not interpret scheme rules; it is a prioritisation
                    aid that sits upstream of an official applying those rules.
                  </p>
                </Detail>
                <p className='input-card__note'>
                  Where no relevant dataset covers the location, this component contributes
                  nothing. A missing indicator is shown as missing, never as a zero that quietly
                  drags a score down.
                </p>
              </InputCard>

              <InputCard
                name='Severity'
                weight={20}
                headline='How much harm follows if the service stays unavailable.'
              >
                <Detail label='What it weighs'>
                  <p>
                    Severity captures urgency rather than popularity. It weights factors such as
                    direct risk to life, loss of access to an essential service such as drinking
                    water or a school route, exposure of vulnerable populations including
                    children, older residents, and persons with disabilities, and the degree of
                    hardship caused when the underlying service is unavailable.
                  </p>
                </Detail>
                <Detail label='Why the weight is smallest'>
                  <p>
                    Severity carries the smallest weight by design. It should break ties between
                    otherwise comparable projects, not decide one on its own. Two projects with
                    similar demand and similar deficit should be separated by how much harm follows,
                    and by nothing else.
                  </p>
                </Detail>
                {/* The previous note said severity is "the input most likely to
                    be overstated" and then argued it is not, three lines apart.
                    One position: the risk is real, and it is handled by weight
                    rather than by claiming the input is trustworthy. */}
                <p className='input-card__note'>
                  Severity is the component most exposed to overstatement. A resident describing a
                  serious problem is not trying to inflate anything — they are simply the only
                  witness the system has. The low weight is the safeguard against that, not an
                  assertion that the figure is accurate.
                </p>
              </InputCard>
            </div>
          </div>
        </section>

        <section className='section'>
          <div className='container reading-column'>
            <SectionHeading
              eyebrow='Guardrails'
              title='Safeguards applied before a score is shown'
              copy='Six controls run before a priority is presented. Each answers two questions: what would go wrong without it, and what the official sees when it fires.'
            />

            {/* These were <h2>, which made each control look like a top-level
                section equal in rank to the section heading above it, and
                contradicted the Accessibility page's claim of a consistent
                H2/H3 hierarchy. They are subordinate items, so they are h3. */}
            <div className='guard-list'>
              <section className='guard'>
                <h3 className='guard__name'>Duplicate control</h3>
                <p className='guard__prevents'>
                  <span>Without it</span> one vocal cluster could manufacture a high priority by
                  filing the same complaint repeatedly.
                </p>
                <p className='guard__effect'>
                  Inputs describing the same underlying issue at the same location are merged
                  across channels and across time, so a single problem is counted once.
                </p>
              </section>

              <section className='guard'>
                <h3 className='guard__name'>Location confidence thresholds</h3>
                <p className='guard__prevents'>
                  <span>Without it</span> a misread location could attach a real complaint to the
                  wrong constituency or village.
                </p>
                <p className='guard__effect'>
                  AI extraction of a location is probabilistic. Where the model cannot resolve a
                  location confidently, the input does not raise a priority at all: it is held and
                  flagged for human confirmation.
                </p>
              </section>

              <section className='guard'>
                <h3 className='guard__name'>Data provenance</h3>
                <p className='guard__prevents'>
                  <span>Without it</span> a score could not be reconstructed, so a contested
                  recommendation would be unanswerable.
                </p>
                <p className='guard__effect'>
                  Every recommendation records which dataset, which release, and which
                  publication date supported the deficit component. Each indicator is versioned and
                  dated, so the reasoning can be rebuilt later from the same release.
                </p>
              </section>

              <section className='guard'>
                <h3 className='guard__name'>Human override at every stage</h3>
                <p className='guard__prevents'>
                  <span>Without it</span> a ranking error would stand even when an official who
                  knows the constituency can see it.
                </p>
                <p className='guard__effect'>
                  Officials can reject a recommendation, adjust a score, or add a project the model
                  did not surface. Overrides are recorded and take precedence over the computed
                  order.
                </p>
              </section>

              <section className='guard'>
                <h3 className='guard__name'>Bias review</h3>
                <p className='guard__prevents'>
                  <span>Without it</span> a demand-only ranking would systematically
                  under-prioritise the places least able to file a complaint.
                </p>
                <p className='guard__effect'>
                  Reporting access is unevenly distributed: villages, low-literacy groups, and
                  elderly residents are less likely to file through web or app channels. Demand is
                  therefore capped at 40% and carries equal weight to measured deficit, so
                  complaint volume alone cannot decide an outcome.
                </p>
              </section>

              <section className='guard'>
                <h3 className='guard__name'>Freshness checks</h3>
                <p className='guard__prevents'>
                  <span>Without it</span> a recommendation could be defended by data that has
                  since been superseded.
                </p>
                <p className='guard__effect'>
                  Infrastructure evidence ages. Stale indicator releases are surfaced in the
                  dashboard rather than silently used, and older releases are flagged at the point
                  of scoring.
                </p>
              </section>
            </div>
          </div>
        </section>

        <section className='section section--soft'>
          <div className='container reading-column'>
            <SectionHeading
              eyebrow='Limits'
              title='What this model does not do'
              copy='These are boundaries of the scoring model, not of the product. Nothing below is a temporary gap in the implementation.'
            />
            {/* Bold labels, matching the pattern About already uses well. These
                were five bare sentences with no labels, in the one section on
                the page a sceptical reader is most likely to want to scan. */}
            <ul className='limit-list'>
              <li>
                <strong>It does not decide eligibility.</strong> Officials apply current MPLADS
                scheme rules, engineering checks, and approvals.
              </li>
              <li>
                <strong>It does not estimate cost or feasibility.</strong> No project cost,
                structural soundness, or land availability is modelled. Those are engineering
                judgements.
              </li>
              <li>
                <strong>It does not measure public sentiment.</strong> It measures recorded,
                deduplicated requests. A constituency that never files is not represented, however
                underserved it is.
              </li>
              <li>
                <strong>It cannot read everything correctly.</strong> AI parsing can misread
                language, location, or intent. Low-confidence results are held for human review
                rather than scored.
              </li>
              <li>
                <strong>It is not an emergency service.</strong> Emergencies belong with the
                relevant district response system.
              </li>
              <li>
                <strong>Its inputs are only as fresh as the datasets behind them.</strong> Public
                infrastructure data is frequently several years old and varies in reliability
                between states and sectors, so a score computed from a stale or uneven dataset
                inherits that weakness. Provenance and release dates are recorded next to every
                score rather than summarised away.
              </li>
              <li>
                <strong>Its weights have not been validated against outcomes.</strong> The 40-40-20
                split is published and fixed so comparisons stay honest. No backtest against
                completed projects has been run, so the weights are a stated design position rather
                than an empirically fitted optimum.
              </li>
            </ul>
            <p>
              For the end-to-end process that produces these scores, see{' '}
              <Link to='/how-it-works'>how Samadhan turns citizen input into a project recommendation</Link>.
              Common questions are answered on the <Link to='/faq'>FAQs page</Link>.
            </p>
          </div>
        </section>

        <section className='section section--closing'>
          <div className='container cta-card'>
            <div>
              <h2>See the scoring applied to real inputs</h2>
              <p>Submit a constituency issue and follow it through the six-step workflow.</p>
            </div>
            <div className='hero__actions'>
              <Link to='/report-issue' className='button button--primary'>Report a constituency issue</Link>
              <Link to='/how-it-works' className='button button--ghost'>How it works</Link>
            </div>
          </div>
        </section>
      
        <div className='container reading-column'>
          <RelatedPages path='/methodology' />
        </div>
      </main>
      <Footer />
    </div>
  );
}