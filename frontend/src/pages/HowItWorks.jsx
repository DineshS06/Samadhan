import Header from '../components/Header';
import Footer from '../components/Footer';
import Breadcrumb from '../components/Breadcrumb';
import SectionHeading from '../components/SectionHeading';
import { Link } from 'react-router-dom';
import RelatedPages from '../components/RelatedPages';

const STEPS = [
  {
    n: '01',
    title: 'Ingest',
    lede: 'Capture a citizen request in whichever form the citizen actually uses.',
    body: [
      'Intake accepts text typed in any supported language, voice transcripts, images, scanned letters, and notes taken during meetings. A request does not have to arrive through a web form to be counted.',
      'Each input is stored with its source and timestamp so that later deduplication can tell a new report from a repeat of an old one.',
    ],
    // human: false — capture is mechanical. Stored with a provenance trail, nothing to judge.
    human: null,
  },
  {
    n: '02',
    title: 'Understand',
    lede: 'Extract the structured meaning of an unstructured request.',
    body: [
      'AI structuring identifies the language used, the category, the location, the urgency, the affected group, and a neutral summary of the request. Free text such as "the hand pump has been dry for two months and the school route floods" is turned into a category, a location, a duration, and a population affected.',
    ],
    // The first place a person must act. Language, location and intent are
    // probabilistic, and an unconfirmed field is held rather than guessed.
    human: 'Confirming low-confidence fields',
    humanNote:
      'Where the model is not confident, the field is flagged and held rather than guessed. A person confirms it before it is allowed to influence a score.',
  },
  {
    n: '03',
    title: 'Enrich',
    lede: 'Attach public infrastructure evidence to the request.',
    body: [
      'A location and category are matched against relevant public indicators. A drinking water complaint is compared with drinking water coverage for that settlement; a school infrastructure complaint is compared with UDISE+ facility data for that school.',
      'The dataset, its release, and its publication date are recorded with the recommendation, so the evidence behind a priority can be examined later.',
    ],
    human: 'Choosing the evidence',
    humanNote:
      'Whether a public dataset is an appropriate basis for a category is a judgement call. The system can match indicators to a request; it cannot decide that this indicator is the right basis here.',
  },
  {
    n: '04',
    title: 'Score',
    lede: 'Produce an explainable priority score.',
    body: [
      'Demand volume, infrastructure deficit, and severity are normalised and combined into a single priority score using a fixed 40-40-20 weighting. The weighting is published and constant, so two constituencies can be compared without the model being retuned for one of them.',
      'The full calculation is recorded per component. A score is never presented without the inputs that produced it.',
    ],
    // Deliberately listed rather than omitted. Scoring is arithmetic against
    // published weights; listing all six is what stops the table below from
    // appearing to start at step 2 with two steps missing.
    human: null,
  },
  {
    n: '05',
    title: 'Review',
    lede: 'Show officials the ranked list and the reasoning behind it.',
    body: [
      'The dashboard displays demand hotspots and ranked project recommendations. Each row carries its score, its category, its location, and the evidence trail, so an official can disagree with a specific recommendation for a stated reason.',
    ],
    human: 'Disagreeing with the ranking',
    humanNote:
      'Officials can re-rank, reject, annotate, or add a project the model did not surface. Every override is recorded and takes precedence over the computed order.',
  },
  {
    n: '06',
    title: 'Act',
    lede: 'Prepare a draft brief for a human to verify and issue.',
    body: [
      'A draft administrative note is generated for a project, covering the subject, the recommendation, the evidence basis, and the verification steps the office must complete before sanction.',
      'Samadhan does not issue sanctions, determine eligibility, or commit funds. The output is a draft for a responsible officer.',
    ],
    human: 'Verifying before issue',
    humanNote:
      'A draft brief is a draft. An officer confirms the evidence, applies the scheme rules, and signs off. The signature is a human act, not a system output.',
  },
];

export default function HowItWorks() {
  const checkpoints = STEPS.filter((s) => s.human);
  const automated = STEPS.filter((s) => !s.human);

  return (
    <div className='page-shell'>
      <Header />
      <main>
        <Breadcrumb className='container' />

        <section className='page-hero'>
          <div className='container page-hero__inner'>
            <p className='eyebrow'>System architecture</p>
            <h1>How Samadhan turns citizen input into a project recommendation</h1>
            <p className='page-hero__lead'>
              One workflow connects multilingual intake, AI structuring, public infrastructure
              data, transparent scoring, and human approval. The point of the pipeline is not to
              produce a decision. It is to make the reasoning behind a development priority visible
              to the official who is accountable for it.
            </p>
          </div>
        </section>

        {/* Two sibling containers, not one nested pair.

            The alignment bug: `.container` carries `margin:auto`, so
            `<div className='container reading-column'>` centres a 760px block at
            x=260 on a 1280px viewport, while `<div className='container'><div
            className='reading-column'>` has no margin and sits flush at x=80.
            Both forms are in use across the site and they are 180px apart, so a
            heading built one way and the section beneath it built the other way
            read as one block hanging off the left edge.

            The checkpoints section below uses the combined form. This heading now
            does too, so the two are byte-identical in geometry. The card grid
            keeps its own full-width container because six cards need the room. */}
        <section className='section section--soft'>
          <div className='container reading-column'>
            <SectionHeading
              eyebrow='The workflow'
              title='Six steps from a citizen message to a draft brief'
              copy='Each step produces an auditable output that the next step consumes. A failure at any step is visible rather than silently corrected.'
            />
          </div>
          <div className='container'>
            <ol className='pipeline-grid pipeline-grid--steps'>
              {STEPS.map((s) => (
                <li className='pipeline-step' key={s.n}>
                  <span className='pipeline-step__num'>{s.n}</span>
                  <h3>{s.title}</h3>
                  <p className='pipeline-step__lede'>{s.lede}</p>
                  {s.body.map((para) => (
                    <p key={para.slice(0, 32)}>{para}</p>
                  ))}
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Plain white, as it was before the band was moved here. The band belongs
            to the workflow section; two adjacent section--soft blocks read as one
            undivided slab and the boundary between them disappeared. */}
        <section className='section'>
          <div className='container reading-column'>
            <SectionHeading
              eyebrow='Human checkpoints'
              title='Where a person decides, not the model'
              copy={`The system can rank and total. It cannot judge. ${checkpoints.length} of the ${
                STEPS.length
              } steps end in a decision only an official can make; the rest are mechanical and are
              listed below so the sequence is complete.`}
            />

            {/* Every one of the six steps is listed. The previous version showed
                only 2, 3, 5 and 6, which read as though steps 1 and 4 had been
                forgotten.

                Steps 1 and 4 are not greyed out. They were rendered with a muted
                badge, a grey left rule and a near-white card, which read as two
                rows that had failed to load rather than as two steps that need
                no judgement. All six rows now carry the same weight; the badge
                is the only thing that differs, and it differs by being a second
                colour rather than by being absent. */}
            <ol className='handoff-list'>
              {STEPS.map((s) => (
                <li key={s.n} className='handoff'>
                  <span className='handoff__step'>{s.n}</span>
                  <div className='handoff__body'>
                    <h3>
                      <span className={'handoff__badge' + (s.human ? '' : ' handoff__badge--auto')}>
                        {s.human ? 'A person decides' : 'Automated step'}
                      </span>
                      {s.human || `${s.title} needs no judgement`}
                    </h3>
                    <p>
                      {s.human
                        ? s.humanNote
                        : `${s.title} is mechanical: the input is recorded as given, or the arithmetic follows published weights. There is no judgement for an official to make here, so no checkpoint is added.`}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            {/* This was a pink bordered box, which read as an alert the reader had
                to act on. It is a limitation note, and it now sits as ordinary
                prose with the rest of the section. */}
            <p>
              <strong>After step 6, nothing is automated either.</strong> Eligibility, technical
              feasibility, cost estimation, sanction, and fund release are not modelled, not
              scored, and not automated. Samadhan stops before all of them.
            </p>

            <p>
              The safeguards that make these checkpoints work &mdash; duplicate control, location
              confidence thresholds, provenance, and freshness checks &mdash; are documented on the{' '}
              <Link to='/methodology'>methodology page</Link>.
            </p>
          </div>
        </section>

        <section className='section section--closing'>
          <div className='container cta-card'>
            <div>
              <h2>Run the workflow on a real request</h2>
              <p>
                Submit a constituency issue in your own language and follow it through the six steps.
              </p>
            </div>
            <div className='hero__actions'>
              <Link to='/report-issue' className='button button--primary'>
                Report a constituency issue
              </Link>
              <Link to='/methodology' className='button button--ghost'>
                See the scoring model
              </Link>
            </div>
          </div>
        </section>
      
        <div className='container reading-column'>
          <RelatedPages path='/how-it-works' />
        </div>
      </main>
      <Footer />
    </div>
  );
}