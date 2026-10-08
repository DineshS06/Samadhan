import Header from '../components/Header';
import Footer from '../components/Footer';
import Breadcrumb from '../components/Breadcrumb';
import SectionHeading from '../components/SectionHeading';
import { Link } from 'react-router-dom';
import RelatedPages from '../components/RelatedPages';

// The section's argument is structural: requests arrive in one shape and public
// evidence arrives in another, and nothing in an MP office joins them. Stating
// that as two parallel prose paragraphs made the reader assemble the comparison
// themselves. Held as data so the mismatch is visible side by side.
const ARRIVES = [
  'Letters and scanned documents',
  'Phone calls and WhatsApp messages',
  'Notes taken during meetings and gram sabha',
  'Staff relaying a verbal complaint',
  'Social posts and forwarded media',
];

const EXISTS = [
  'Drinking water coverage — Census of India',
  'Maternal and child health — NFHS-5',
  'School infrastructure and enrolment — UDISE+',
  'Road and connectivity coverage — PMGSY',
  'Primary health facility availability — NHM',
];

const AUDIENCES = [
  {
    tier: 'Primary',
    who: 'MP and constituency offices',
    why: 'Need a defensible way to sequence competing local requests, and a record of why one was chosen over another.',
    get: 'A ranked review order with the evidence attached to every row, plus a draft brief for each project taken forward.',
  },
  {
    tier: 'Secondary',
    who: 'District and state planning officers',
    why: 'Hold the datasets that make the deficit component meaningful, and own the decisions that follow a recommendation.',
    get: 'The scoring model and its safeguards, so a recommendation can be audited rather than accepted on trust.',
  },
  {
    tier: 'Third',
    who: 'Civic technology organisations and research groups',
    why: 'Need the model to be inspectable in order to criticise it.',
    get: 'A published weighting, documented safeguards, and stated limits — including the ones that are inconvenient.',
  },
];

const NOT_CLAIMED = [
  {
    label: 'It is not an emergency service.',
    detail: 'Emergencies belong with the relevant district response system, not with a prioritisation queue.',
  },
  {
    label: 'It is not an automatic sanction system.',
    detail: 'No output commits funds or approves a project.',
  },
  {
    label: 'It does not determine MPLADS eligibility.',
    detail: 'Officials apply current scheme rules, engineering checks, and approvals.',
  },
  {
    label: 'It is not an official government channel.',
    detail: 'Samadhan is a civic-tech project unless formally adopted and authorised by a government body.',
  },
  {
    label: 'It does not replace public consultation.',
    detail: 'A ranked list is an input to a decision, not a substitute for one.',
  },
  {
    label: 'Illustrative data is not real data.',
    detail: 'Figures shown on this site are illustrative values and must not be cited as observed results.',
  },
];

export default function About() {
  return (
    <div className='page-shell'>
      <Header />
      <main>
        <Breadcrumb className='container' />

        <section className='page-hero'>
          <div className='container page-hero__inner'>
            <p className='eyebrow'>About</p>
            <h1>Why constituency planning needs evidence, not just volume</h1>
            <p className='page-hero__lead'>
              Samadhan exists to solve one specific problem: an MP office hears what constituents
              need, and the administration knows what is missing, but nothing joins the two. This
              page states the problem, what the tool does about it, who it is for, and — just as
              importantly — what it does not claim.
            </p>
          </div>
        </section>

        <section className='section'>
          <div className='container reading-column'>
            <SectionHeading
              eyebrow='The problem'
              title='MP offices cannot compare requests with deficits'
              copy='Requests arrive in one shape and public evidence arrives in another, with nothing in the office that joins them. The mismatch is structural, not a matter of effort.'
            />

            {/* Two inventories, side by side. As prose the reader had to hold
                both lists in their head to see the point, which is the only
                point the section makes. */}
            <div className='compare'>
              <div className='compare__col'>
                <h3 className='compare__title'>What reaches the office</h3>
                <ul>
                  {ARRIVES.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
              <div className='compare__col compare__col--alt'>
                <h3 className='compare__title'>What the administration publishes</h3>
                <ul>
                  {EXISTS.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
            </div>

            <p>
              Both arrive as unstructured text: several languages, uneven detail, no common format.
              The published data is precise but organised by dataset rather than by place, so it is
              rarely available in a shape that can be weighed against what citizens are actually
              reporting.
            </p>
            <p>
              The consequence is that genuine need has to be argued in narrative form, and a
              well-organised location with an active local committee can capture attention regardless
              of how large the underlying deficit is. Demand is the easiest thing to measure and
              the easiest thing to over-represent.
            </p>
          </div>
        </section>

        <section className='section section--soft'>
          <div className='container reading-column'>
            <SectionHeading
              eyebrow='What it does'
              title='What Samadhan is built to do'
              copy='Six things, in the order they happen. Each exists because a person in an MP office would otherwise do it by hand.'
            />
            <ol className='limit-list limit-list--numbered'>
              <li>Accept citizen requests in the language they are written in, including voice transcripts and scanned letters.</li>
              <li>
                Structure each request into category, location, urgency, affected group, and a
                neutral summary.
              </li>
              <li>Match the request against named public infrastructure indicators for that location.</li>
              <li>
                Score and rank requests using the published 40-40-20 weighting rather than an
                opaque model.
              </li>
              <li>Show officials the evidence behind every recommendation, so it can be checked.</li>
              <li>Draft an administrative note for a human to verify, amend, and issue.</li>
            </ol>
            <p>
              The end-to-end process is described on the{' '}
              <Link to='/how-it-works'>how it works page</Link>, and the scoring model on the{' '}
              <Link to='/methodology'>methodology page</Link>.
            </p>
          </div>
        </section>

        <section className='section'>
          <div className='container reading-column'>
            <SectionHeading
              eyebrow='Audience'
              title='Who this is for'
              copy='Three audiences, in order of how directly the tool affects their work.'
            />
            <div className='tier-list'>
              {AUDIENCES.map((a) => (
                <section className='tier' key={a.tier}>
                  <span className='tier__badge'>{a.tier}</span>
                  <div>
                    <h3 className='tier__who'>{a.who}</h3>
                    <p className='tier__why'>{a.why}</p>
                    <p className='tier__get'>
                      <strong>What they get: </strong>
                      {a.get}
                    </p>
                  </div>
                </section>
              ))}
            </div>
          </div>
        </section>

        <section className='section section--soft'>
          <div className='container reading-column'>
            <SectionHeading
              eyebrow='Limits'
              title='What Samadhan does not claim'
              copy='A prioritisation aid has no authority, and a new system has no track record. Both are stated here rather than discovered later.'
            />
            <ul className='limit-list'>
              {NOT_CLAIMED.map((n) => (
                <li key={n.label}>
                  <strong>{n.label}</strong> {n.detail}
                </li>
              ))}
            </ul>
          </div>
        </section>

        

        <section className='section section--closing'>
          <div className='container cta-card'>
            <div>
              <h2>Try the citizen side</h2>
              <p>
                Open the form and watch a free-text request become a structured, scored item. Nothing
                on this deployment is transmitted.
              </p>
            </div>
            <div className='hero__actions'>
              <Link to='/report-issue' className='button button--primary'>
                Report a constituency issue
              </Link>
              <Link to='/faq' className='button button--ghost'>
                Read the FAQs
              </Link>
            </div>
          </div>
        </section>
      
        <div className='container reading-column'>
          <RelatedPages path='/about' />
        </div>
      </main>
      <Footer />
    </div>
  );
}