import { Link } from 'react-router-dom';
import SEO, { SITE_URL } from '../components/SEO';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Breadcrumb from '../components/Breadcrumb';
import RelatedPages from '../components/RelatedPages';

export default function Mplads() {
  return (
    <div className='page-shell'>
      <SEO
        title='MPLADS Fund — Constituency Development Fund for MPs'
        description='MPLADS (Members of Parliament Local Area Development Scheme) is India\u2019s constituency development fund. How it works, eligible works, and how citizens can suggest projects to their MP.'
        path='/mplads'
        schema={{
          '@type': 'WebPage',
          '@id': SITE_URL + '/mplads#webpage',
          url: SITE_URL + '/mplads',
          name: 'MPLADS Fund — Constituency Development Fund for MPs',
          description: 'MPLADS (Members of Parliament Local Area Development Scheme) is India\u2019s constituency development fund. How it works, eligible works, and how citizens can suggest projects to their MP.',
          inLanguage: 'en-IN',
        }}
      />
      <Header />
      <main>
        <Breadcrumb className='container' />

        <section className='page-hero'>
          <div className='container page-hero__inner'>
            <p className='eyebrow'>Constituency funding</p>
            <h1>MPLADS Fund — Constituency Development Fund for MPs</h1>
            <p>
              The Members of Parliament Local Area Development Scheme (MPLADS) is a central sector
              scheme that gives each Member of Parliament funds to recommend development works in
              their constituency. Citizens can suggest projects — here's how it works.
            </p>
          </div>
        </section>

        <div className='container section reading-column'>
          <h2>What is MPLADS?</h2>
          <p>MPLADS is a government scheme under which each Lok Sabha Member of Parliament can recommend development works worth up to ₹5 crore per year in their constituency. The scheme is administered by the Ministry of Statistics and Programme Implementation (MoSPI). Funds are released directly to district authorities, who execute the works.</p>

          <h2>What kind of works can be recommended?</h2>
          <p>MPLADS funds can be used for durable community assets. Examples include:</p>
          <ul>
            <li>Drinking water facilities (wells, hand pumps, tanks)</li>
            <li>Education (school buildings, classrooms, libraries)</li>
            <li>Health (primary health centres, ambulances)</li>
            <li>Roads and bridges (village roads, culverts)</li>
            <li>Irrigation (canals, check dams)</li>
            <li>Sanitation (toilets, drainage)</li>
            <li>Electrification (rural electrification, street lights)</li>
          </ul>

          <h2>How citizens can suggest projects</h2>
          <ol>
            <li><strong>Identify a need</strong> — a road, water facility, school, or health facility your constituency lacks.</li>
            <li><strong>Contact your MP</strong> — write to your MP's office with the project details and location.</li>
            <li><strong>Use Samadhan</strong> — submit your suggestion through the citizen portal. It will be scored and shown to officials for review.</li>
            <li><strong>Follow up</strong> — track your suggestion using your reference ID.</li>
          </ol>

          <h2>Important limits</h2>
          <ul>
            <li>MPLADS funds create <strong>durable assets</strong> — they cannot be used for recurring expenses like salaries or pensions.</li>
            <li>Works must be in the MP's constituency (Lok Sabha) or, for Rajya Sabha MPs, in the state they represent.</li>
            <li>District authorities execute the works after technical and financial scrutiny.</li>
            <li>Samadhan does not determine MPLADS eligibility — officials apply current rules and approvals.</li>
          </ul>

          <p className='center-action'>
            <Link className='button button--primary' to='/report-issue'>Suggest a constituency project</Link>
          </p>

          <RelatedPages path='/mplads' />
        </div>
      </main>
      <Footer />
    </div>
  );
}
