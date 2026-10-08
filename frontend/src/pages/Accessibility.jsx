import Header from '../components/Header';
import Footer from '../components/Footer';
import Breadcrumb from '../components/Breadcrumb';
import SectionHeading from '../components/SectionHeading';
import { Link } from 'react-router-dom';
import RelatedPages from '../components/RelatedPages';

export default function Accessibility() {
  return (
    <div className='page-shell'>
      <Header />
      <main>
        <Breadcrumb className='container' />

        <section className='page-hero'>
          <div className='container page-hero__inner'>
            <p className='eyebrow'>Accessibility</p>
            <h1>Samadhan accessibility statement</h1>
            <p className='page-hero__lead'>
              Accessibility here is a requirement of the service, not a polish item. A grievance
              system that is hard to use excludes exactly the people most likely to be reporting a
              problem: older residents, people with low digital confidence, and citizens whose
              first language is not English. This page states what the interface does, what has
              not been verified, and what is still missing.
            </p>
          </div>
        </section>

        <section className='section'>
          <div className='container reading-column'>
            <SectionHeading
              eyebrow='Commitments'
              title='What the interface is built to do'
                          copy='Ten commitments, each naming the specific mechanism that provides it so you can check it yourself rather than take it on trust.'
            />
            {/* Each commitment states something a reader can check in the markup, and
                the specific mechanism that provides it. Two of these previously
                described enforcement that does not exist: a deleted LazyImage
                "component level" alt requirement, and unsized "fingertip"
                targets. Claims that cannot be verified should not be on an
                accessibility page. */}
            <ul className='limit-list'>
              <li>
                <strong>Semantic structure.</strong> Every page has exactly one H1, and
                subordinate sections use H2 and H3 in order. A page-opening check in the
                repository build fails if this is not true.
              </li>
              <li>
                <strong>Keyboard operation.</strong> All controls are reachable and operable by
                keyboard, including the navigation menu and the grievance form. No interaction
                requires a pointer.
              </li>
              <li>
                <strong>Visible focus.</strong> A global <code>:focus-visible</code> rule draws a
                3px outline with a light halo outside it, so keyboard position is visible on
                light and dark surfaces alike. Measured against the adjacent background: the
                outline is 7.31:1 on white, 6.88:1 on the page canvas and 6.53:1 on the soft
                blue, and the halo is 8.49:1 on the navy header and hero. Both clear the 3:1
                that WCAG 2.2 asks of a focus indicator. No control sets{' '}
                <code>outline: none</code>, so none of them suppresses it.
              </li>
              <li>
                <strong>Form labels.</strong> Every control on the grievance form is associated
                with a visible label. Single controls use <code>label for</code>; the language and
                severity button groups are wrapped in a <code>fieldset</code> with a{' '}
                <code>legend</code>, because a label pointing at a div is inert.
              </li>
              <li>
                <strong>Form errors.</strong> A validation failure is announced through an element
                with <code>role="alert"</code>, and the message text is specific rather than
                generic.
              </li>
              <li>
                <strong>Touch targets.</strong> Interactive controls are at least 38 &times; 36
                CSS pixels, which clears the WCAG 2.2 minimum target size of 24 &times; 24.
                Most are larger.
              </li>
              <li>
                <strong>Image alternatives.</strong> Every image in the application carries an
                alt attribute. This build contains one image, the header logo, and it is
                described rather than left empty. There is no shared image component enforcing
                this; it is a convention checked by a repository test, not a guarantee.
              </li>
              <li>
                <strong>Responsive layout.</strong> Grids use <code>min()</code>-bounded track
                minimums, so columns collapse instead of forcing horizontal scrolling below about
                316px of container width.
              </li>
              <li>
                <strong>Reduced motion.</strong> A{' '}
                <code>prefers-reduced-motion</code> media query disables smooth scrolling and all
                animation and transition, including the FAQ disclosure.
              </li>
              <li>
                <strong>Language input.</strong> The citizen portal accepts input in Hindi,
                Telugu, and English rather than English only, and its interface is fully
                translatable.
              </li>
            </ul>
          </div>
        </section>

        <section className='section section--soft'>
          <div className='container reading-column'>
            <SectionHeading
              eyebrow='Limits'
              title='Known limitations of this build'
              copy='This statement is written to be accurate about what has and has not been verified, not to imply a conformance level that has not been tested.'
            />
            <ul>
              <li>
                No formal WCAG conformance audit has been carried out against this build. No
                accessibility conformance level is claimed.
              </li>
              <li>
                Testing with screen readers, keyboard-only navigation, and voice control has not
                been completed.
              </li>
              <li>
                Some contrast pairs have been measured and corrected, and the ones listed below are
                checked by a repository test that fails if they regress.
              </li>
              <li>
                The website is published in English only. The citizen input pipeline handles
                Hindi, Telugu, and English, but no Hindi or Telugu version of these pages exists.
              </li>
              <li>
                Mobile rendering and tap targets have not been verified on physical devices in
                this environment.
              </li>
              <li>
                No supported accessibility contact channel exists yet. A production operator must
                publish a monitored address with a stated response time.
              </li>
            </ul>
          </div>
        </section>

        <section className='section'>
          <div className='container reading-column'>
            <SectionHeading
              eyebrow='Reporting'
              title='Reporting a barrier'
              copy='There is no channel to report to yet, so this section states what a deployment must provide rather than pretending a facility exists.'
            />
            {/* The old heading promised a reporting facility and the section
                delivered an admission that none exists. The previous text also
                repeated the preceding Limits bullet almost word for word. */}
            <div className='limit-list'>
              <p>
                A production deployment must publish a monitored accessibility contact address with
                a stated response time, and must treat a reported barrier as a defect with a named
                owner rather than as feedback to be acknowledged. Neither exists in this build.
              </p>
              <p>
                Until one does, the commitments above are the only evidence available. They can be
                checked directly: every one names the mechanism behind it, and the repository ships
                a check that fails if the heading structure, label associations, or grid track
                minimums regress.
              </p>
            </div>
            <p>
              Related pages cover <Link to='/privacy'>how grievance data is handled</Link> and the{' '}
              <Link to='/faq'>common questions</Link> about reporting and scoring.
            </p>
          </div>
        </section>

        <section className='section section--closing'>
          <div className='container cta-card'>
            <div>
              <h2>Check the citizen portal</h2>
              <p>The reporting form is where accessibility matters most.</p>
            </div>
            <div className='hero__actions'>
              <Link to='/report-issue' className='button button--primary'>Report a constituency issue</Link>
              <Link to='/about' className='button button--ghost'>About Samadhan</Link>
            </div>
          </div>
        </section>
      
        <div className='container reading-column'>
          <RelatedPages path='/accessibility' />
        </div>
      </main>
      <Footer />
    </div>
  );
}