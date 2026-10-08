import Header from '../components/Header';
import Footer from '../components/Footer';
import Breadcrumb from '../components/Breadcrumb';
import SectionHeading from '../components/SectionHeading';
import { Link } from 'react-router-dom';
import RelatedPages from '../components/RelatedPages';

export default function Privacy() {
  return (
    <div className='page-shell'>
      <Header />
      <main>
        <Breadcrumb className='container' />

        <section className='page-hero'>
          <div className='container page-hero__inner'>
            <p className='eyebrow'>Privacy</p>
            <h1>How citizen grievance information should be handled</h1>
            <p className='page-hero__lead'>
              Samadhan collects contact details in order to verify and follow up on a citizen's
              report. This page describes what is collected, why, and who can see it. It also
              states plainly what a production deployment would still need before handling real
              personal data.
            </p>
          </div>
        </section>

        <section className='section'>
          <div className='container reading-column'>
            <SectionHeading
              eyebrow='Collection'
              title='What information is requested'
              copy='Six fields. Two identify you, and the rest describe the problem. Nothing else is asked for.'
            />
            <ul className='limit-list'>
              <li>
                <strong>Name</strong> &mdash; used to address the citizen about their report.
              </li>
              <li>
                <strong>Mobile number</strong> &mdash; used for verification and follow-up by the
                office handling the report.
              </li>
              <li>
                <strong>Constituency and location</strong> &mdash; needed to route the report to the
                right office and to match infrastructure evidence.
              </li>
              <li>
                <strong>Issue details</strong> &mdash; the description, category, urgency, and how
                many people are affected.
              </li>
              <li>
                <strong>Location coordinates</strong> &mdash; optional, only when the citizen
                chooses to provide them.
              </li>
              <li>
                <strong>Attachments</strong> &mdash; optional photos or documents the citizen
                chooses to upload.
              </li>
            </ul>
            <p>
              Contact details are stored separately from the grievance record itself. The grievance
              record is what feeds scoring and public dashboards; the contact record is what an
              office uses to get back to the citizen.
            </p>
          </div>
        </section>

        <section className='section section--soft'>
          <div className='container reading-column'>
            <SectionHeading
              eyebrow='Use and access'
              title='Why the data is collected and who can see it'
              copy='Five stated purposes and a single access rule. If a purpose is not listed here, it is not a purpose the data is used for.'
            />
            <p>
              Personal data is used for a limited set of purposes: issuing a reference ID,
              classifying and scoring the report, verifying it with the citizen, passing it to the
              responsible office, and following up on completion.
            </p>
            <p>
              A citizen's name, mobile number, and attachments are never published. Where public
              dashboards show constituent activity, they show aggregated counts by location and
              category. The backend enforces this by stripping identifying fields from any response
              that leaves the verification path, rather than relying on the interface to simply omit
              them.
            </p>
            <p>
              Access to contact details is limited to authorised staff of the office handling the
              report, for verification and follow-up. Data is not sold, and is not used for
              advertising or third-party marketing.
            </p>
          </div>
        </section>

        <section className='section'>
          <div className='container reading-column'>
            <SectionHeading
              eyebrow='Scope'
              title='What this build does and does not do'
              copy='What is actually enforced in code today. The obligations still outstanding are listed in the next section.'
            />
            <p>
              This build is not in production. The behaviour described above is enforced in the
              backend, but the deployment is a static frontend with no hosted API, so submissions
              made on the public site fall back to a local mock response and are not transmitted
              anywhere.
            </p>
            <p>Consequently, no real personal data should be submitted to this build.</p>
          </div>
        </section>

        {/* This list previously sat inside the section above, under a heading
            about what this build does and does not do. It is the most
            actionable content on the page and deserves its own subject. */}
        <section className='section section--soft'>
          <div className='container reading-column'>
            <SectionHeading
              eyebrow='Before a real deployment'
              title='What a production deployment must still provide'
              copy='Seven governance obligations that are not software features and are not satisfied by having working software. None of them are implemented here.'
            />
            <ul className='limit-list'>
              <li>A named data controller, and a published privacy policy identifying it.</li>
              <li>
                A documented retention schedule per record type, with deletion actually enforced
                rather than merely described.
              </li>
              <li>Encryption in transit and at rest.</li>
              <li>Role-based access control with auditable access logs.</li>
              <li>An incident response and breach notification procedure.</li>
              <li>Data processing terms with any AI model vendor handling citizen text.</li>
              <li>
                A process for data-subject requests: access, rectification, erasure, portability, and
                objection.
              </li>
            </ul>
          </div>
        </section>

        {/* A section titled "Questions this page does not answer" was removed
            from here: its entire body was five outbound links with no privacy
            content, and the footer already links all five pages. */}

        <section className='section section--closing'>
          <div className='container cta-card'>
            <div>
              <h2>Try the form without entering real details</h2>
              {/* This CTA contradicted the warning above it: the page told the
                  reader not to submit personal data and then invited them to go
                  submit an issue, implying real routing. */}
              <p>
                Nothing on this deployment is transmitted. The form is here to show how a report is
                structured and scored, so please use placeholder details.
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
          <RelatedPages path='/privacy' />
        </div>
      </main>
      <Footer />
    </div>
  );
}