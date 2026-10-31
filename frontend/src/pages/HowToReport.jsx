import { Link } from 'react-router-dom';
import SEO, { SITE_URL } from '../components/SEO';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Breadcrumb from '../components/Breadcrumb';
import RelatedPages from '../components/RelatedPages';

export default function HowToReport() {
  return (
    <div className='page-shell'>
      <SEO
        title='How to Report a Constituency Issue to Your MP'
        description='Which channel to use for a civic complaint in India: CPGRAMS, CPGRAMS-PMO, the Directorate of Public Grievances, MPLADS or your MP. What to write, how tracking works, and how to escalate.'
        path='/how-to-report'
        schema={{
          '@type': 'WebPage',
          '@id': SITE_URL + '/how-to-report#webpage',
          url: SITE_URL + '/how-to-report',
          name: 'How to Report a Constituency Issue to Your MP',
          description: 'Which channel to use for a civic complaint in India: CPGRAMS, CPGRAMS-PMO, the Directorate of Public Grievances, MPLADS or your MP. What to write, how tracking works, and how to escalate.',
          inLanguage: 'en-IN',
        }}
      />
      <Header />
      <main>
        <Breadcrumb className='container' />

        <section className='page-hero'>
          <div className='container page-hero__inner'>
            <p className='eyebrow'>Citizen guide</p>
            <h1>How to Report a Constituency Issue to Your MP</h1>
            <p>
              Most civic complaints in India are filed in the wrong place, which is why they go
              nowhere. This guide explains which channel handles which kind of problem, what a
              grievance needs to contain to be actionable, and how to follow it up.
            </p>
          </div>
        </section>

        <div className='container section reading-column'>
          <h2>1. First, decide what kind of problem you have</h2>
          <p>
            The right channel depends on what you are asking for. There are three broad cases, and
            they are handled by different systems.
          </p>
          <div className='table-scroll'>
            <table className='data-table'>
              <caption>Match the problem to the channel.</caption>
              <thead>
                <tr>
                  <th scope='col'>If you want…</th>
                  <th scope='col'>Use</th>
                  <th scope='col'>Because</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>A government service fixed — a pension not credited, a ration card not issued, a road not repaired by the responsible department</td>
                  <td>CPGRAMS or your state's grievance portal</td>
                  <td>It is a grievance against a government department, which these systems are built to route and track</td>
                </tr>
                <tr>
                  <td>A new durable asset built — a classroom, a hand pump, a drainage line</td>
                  <td>Your MP's office, under MPLADS</td>
                  <td>MPLADS funds capital works that an MP recommends and the district authority sanctions</td>
                </tr>
                <tr>
                  <td>Several related problems ranked by urgency, with evidence in one place</td>
                  <td>Samadhan, then the channel above</td>
                  <td>Scoring and ranking help an office decide what to take up first; the formal remedy still runs through the official channel</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            A grievance system will not build you a school, and MPLADS will not recover a stalled
            pension. Sending one to the other is the most common reason a complaint disappears.
          </p>

          <h2>2. What CPGRAMS is</h2>
          <p>
            The Centralised Public Grievance Redress and Monitoring System was created in{' '}
            <strong>June 2007</strong> by the Department of Administrative Reforms and Public
            Grievances (DARPG), and was designed in-house by the National Informatics Centre. It
            allows anyone to file a complaint against an instrumentality of the Union of India or of
            a state or union territory, and it runs at{' '}
            <a href='https://pgportal.gov.in/' rel='noopener noreferrer' target='_blank'>pgportal.gov.in</a>.
          </p>
          <p>
            The Prime Minister is the supreme head of public grievances, and DARPG administers the
            system day to day. A telephonic feedback feature lets a citizen rate how the grievance
            was handled. In June 2024 the government approved ₹128 crore for CPGRAMS version 8.0,
            which indicates the system is still being rebuilt rather than frozen.
          </p>

          <h2>3. The other official portals, and when to use them</h2>
          <div className='table-scroll'>
            <table className='data-table'>
              <caption>Union government grievance portals and what each covers.</caption>
              <thead>
                <tr>
                  <th scope='col'>Portal</th>
                  <th scope='col'>Covers</th>
                  <th scope='col'>How to track</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>CPGRAMS (pgportal.gov.in)</td>
                  <td>Central ministries and departments, and state or UT government departments</td>
                  <td>Grievance registration ID plus the mobile number or email used at filing</td>
                </tr>
                <tr>
                  <td>CPGRAMS-PMO (pmopg.gov.in)</td>
                  <td>Grievances addressed to the Prime Minister's Office</td>
                  <td>Track on CPGRAMS under "View Status" with the same ID and contact</td>
                </tr>
                <tr>
                  <td>President's Secretariat Helpline Portal</td>
                  <td>Grievances addressed to the President's Secretariat</td>
                  <td>Track on CPGRAMS under "View Status"</td>
                </tr>
                <tr>
                  <td>Directorate of Public Grievances (dpg.gov.in)</td>
                  <td>Grievances routed through the Cabinet Secretariat</td>
                  <td>Only on the DPG portal itself</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            State governments also run their own grievance portals. If your problem is with a state
            department — municipal services, state transport, state health — the state portal is
            often faster than CPGRAMS because it routes directly to the department that must act.
          </p>

          <h2>4. What a grievance needs in order to be actionable</h2>
          <p>
            Grievance officers deal with volume. A complaint that cannot be located or verified gets
            closed with a request for more information, which restarts the clock. Include:
          </p>
          <ul>
            <li><strong>Who you are</strong> — name and a working mobile number or email, so the office can respond.</li>
            <li><strong>Where exactly</strong> — village or ward, gram panchayat or municipal ward, district, state and PIN code.</li>
            <li><strong>Which department</strong> — public works, water supply, health, education, electricity. If you do not know, describe the service that failed.</li>
            <li><strong>What happened and when</strong> — a date or a duration ("since the June supply cut"), not "for a long time".</li>
            <li><strong>Who is affected</strong> — a rough number of households or people, and whether schools, hospitals or vulnerable groups are involved.</li>
            <li><strong>What you want done</strong> — repair, replacement, issue of a document, or a new asset. Be specific about the remedy.</li>
            <li><strong>Evidence</strong> — photographs, a receipt, an application number, or the date of an earlier complaint and its reference number.</li>
          </ul>
          <p>
            Do not paste your Aadhaar number, bank details or medical records into a grievance.
            Grievance systems need enough detail to locate the problem, not your full identity
            documents.
          </p>

          <h2>5. Escalation, if nothing happens</h2>
          <ol>
            <li>
              <strong>Wait for the stated response window</strong> and keep the registration ID.
              Chasing before the window closes usually produces a holding reply.
            </li>
            <li>
              <strong>File an appeal or representation</strong> with the appellate authority named
              by the department, quoting the original registration ID.
            </li>
            <li>
              <strong>Use the CPGRAMS feedback feature</strong> to record that the grievance was
              closed without resolution. Feedback is visible to DARPG, which monitors departments.
            </li>
            <li>
              <strong>File a Right to Information request</strong> asking for the action taken
              report, the file notings, and the reason for closure. RTI responses are a matter of
              record and are hard to ignore.
            </li>
            <li>
              <strong>Approach your MP's office</strong> with the reference numbers. An MP can raise
              the matter in Parliament or take it up with the ministry, which is a different lever
              from a departmental grievance.
            </li>
          </ol>

          <h2>6. Filing through Samadhan</h2>
          <p>
            Samadhan is a scoring and ranking layer, not a replacement for the channels above. It
            records your report, estimates how serious and how widely felt the problem is, and
            presents a ranked list to the constituency office.
          </p>
          <ol>
            <li><strong>Select your state, district and constituency</strong> — this routes the report to the correct office.</li>
            <li><strong>Pick a category</strong> — roads, water, health, education, electricity, or other.</li>
            <li><strong>Add location detail</strong> — village, ward and PIN code, or use the location button to fill coordinates.</li>
            <li><strong>Describe the problem</strong> — what, where, since when, how many people affected.</li>
            <li><strong>Submit</strong> — you receive a reference ID to track the report.</li>
          </ol>
          <p>
            Text that is too short, repeated or random is rejected before submission, because a
            report nobody can act on wastes the citizen's time and the office's.
          </p>

          <h2>7. What happens after you submit</h2>
          <p>
            Samadhan scores the report on verified demand, infrastructure gap and severity, and
            shows the ranked list to officials. Officials retain responsibility for verification,
            eligibility, funding and sanction. Samadhan does not issue sanctions, commit funds, or
            decide MPLADS eligibility.
          </p>

          <p className='center-action'>
            <Link className='button button--primary' to='/report-issue'>Report a constituency issue</Link>
          </p>

          <h2>Sources</h2>
          <ul>
            <li>
              <a href='https://en.wikipedia.org/wiki/Centralized_Public_Grievance_Redress_and_Monitoring_System' rel='noopener noreferrer' target='_blank'>
                Centralised Public Grievance Redress and Monitoring System
              </a>{' '}
              — creation date, administering department, NIC design, portal list, tracking method, CPGRAMS 8.0 approval.
            </li>
            <li>
              <a href='https://pgportal.gov.in/' rel='noopener noreferrer' target='_blank'>pgportal.gov.in</a>{' '}
              — the grievance portal itself.
            </li>
            <li>
              <a href='https://www.darpg.gov.in/' rel='noopener noreferrer' target='_blank'>DARPG</a>{' '}
              — grievance policy and guidelines.
            </li>
            <li>
              <Link to='/mplads'>MPLADS fund</Link> — for development works rather than service grievances.
            </li>
          </ul>

          <RelatedPages path='/how-to-report' />
        </div>
      </main>
      <Footer />
    </div>
  );
}
