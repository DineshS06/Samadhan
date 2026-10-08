import Header from '../components/Header';
import Footer from '../components/Footer';
import Breadcrumb from '../components/Breadcrumb';
import SectionHeading from '../components/SectionHeading';
import { Link } from 'react-router-dom';

// Questions live in ../data/faqData.js so App.jsx can build the FAQPage
// JSON-LD from the same array without statically importing this page (which
// would defeat the lazy() route split). Schema and visible copy therefore
// cannot drift apart.
import { FAQS } from '../data/faqData';
import RelatedPages from '../components/RelatedPages';

export default function FAQ() {
  return (
    <div className='page-shell'>
      <Header />
      <main>
        <Breadcrumb className='container' />

        <section className='page-hero'>
          <div className='container page-hero__inner'>
            <p className='eyebrow'>Answer centre</p>
            <h1>Questions about reporting, ranking, privacy, and AI</h1>
            <p className='page-hero__lead'>
              These are direct answers for citizens, MP office staff, district administrators,
              and evaluators. They cover how a report is handled, how the priority score works,
              and the limits of what an automated system should be trusted to do in public
              administration. Every question below is one a reader actually asks.
            </p>
          </div>
        </section>

        <section className='section'>
          <div className='container reading-column'>
            <SectionHeading
              eyebrow='Reporting'
              title='Citizen questions'
                          copy='What happens to a report you file, and what you get back in return.'
            />

            <div className='faq-list'>
              {FAQS.slice(0, 3).map((f) => (
                <details key={f.q}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className='section section--soft'>
          <div className='container reading-column'>
            <SectionHeading
              eyebrow='Ranking'
              title='How the priority score works'
              copy='For the full model and its safeguards, see the methodology page.'
            />

            <div className='faq-list'>
              {FAQS.slice(3, 9).map((f) => (
                <details key={f.q}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>

            <p style={{ marginTop: '28px' }}>
              The complete scoring model, the datasets it can draw on, and the safeguards applied
              before a score is shown are documented on the{' '}
              <Link to='/methodology'>methodology page</Link>. The stage-by-stage process is on{' '}
              <Link to='/how-it-works'>how it works</Link>.
            </p>
          </div>
        </section>

        <section className='section'>
          <div className='container reading-column'>
            <SectionHeading
              eyebrow='Scope'
              title='Limits and status'
                          copy='Where this platform stops, and what state it is currently in.'
            />

            <div className='faq-list'>
              {FAQS.slice(9).map((f) => (
                <details key={f.q}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>

            <p style={{ marginTop: '28px' }}>
              Further detail is available on the <Link to='/about'>about page</Link>, including
              where this approach is weakest. Citizen contact details are described on the{' '}
              <Link to='/privacy'>privacy page</Link>.
            </p>
          </div>
        </section>

        <section className='section section--closing'>
          <div className='container cta-card'>
            <div>
              <h2>Have a question that is not answered here?</h2>
              <p>Submit a constituency issue and see the process end to end.</p>
            </div>
            <div className='hero__actions'>
              <Link to='/report-issue' className='button button--primary'>Report a constituency issue</Link>
              <Link to='/about' className='button button--ghost'>About Samadhan</Link>
            </div>
          </div>
        </section>
      
        <div className='container reading-column'>
          <RelatedPages path='/faq' />
        </div>
      </main>
      <Footer />
    </div>
  );
}
