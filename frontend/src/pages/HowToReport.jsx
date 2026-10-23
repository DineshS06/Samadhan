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
        description='Step-by-step guide to filing a public grievance with your Member of Parliament. Grievance redressal through DARPG CPGRAMS, MPLADS constituency funds, and Samadhan scoring.'
        path='/how-to-report'
        schema={{
          '@type': 'WebPage',
          '@id': SITE_URL + '/how-to-report#webpage',
          url: SITE_URL + '/how-to-report',
          name: 'How to Report a Constituency Issue to Your MP',
          description: 'Step-by-step guide to filing a public grievance with your Member of Parliament. Grievance redressal through DARPG CPGRAMS, MPLADS constituency funds, and Samadhan scoring.',
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
              A practical guide for citizens who want to report a problem in their constituency
              — roads, water, health, schools, or any local infrastructure issue — and get it
              tracked through to resolution.
            </p>
          </div>
        </section>

        <div className='container section reading-column'>
          <h2>1. What you can report</h2>
          <p>You can report any local issue that falls under your Member of Parliament's constituency work:</p>
          <ul>
            <li><strong>Roads &amp; connectivity</strong> — potholes, broken bridges, street lights</li>
            <li><strong>Water &amp; sanitation</strong> — drinking water, drainage, toilets, sewage</li>
            <li><strong>Health &amp; medical</strong> — hospitals, PHCs, ambulances, medicines</li>
            <li><strong>Education</strong> — schools, colleges, scholarships</li>
            <li><strong>Electricity</strong> — power cuts, transformers</li>
            <li><strong>Other</strong> — any other constituency development issue</li>
          </ul>

          <h2>2. Where to report — official channels</h2>
          <p>India's public grievance system has several official channels. Samadhan works alongside them, not instead of them.</p>
          <div className='table-scroll'>
            <table className='data-table'>
              <thead>
                <tr><th>Channel</th><th>What it is</th><th>Best for</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>CPGRAMS</strong></td>
                  <td>Centralised Public Grievance Redress and Monitoring System (DARPG)</td>
                  <td>Central government ministries and departments</td>
                </tr>
                <tr>
                  <td><strong>MPLADS</strong></td>
                  <td>Members of Parliament Local Area Development Scheme</td>
                  <td>Constituency-level development works recommended by your MP</td>
                </tr>
                <tr>
                  <td><strong>Samadhan</strong></td>
                  <td>AI-assisted citizen grievance portal</td>
                  <td>Scoring, ranking, and tracking requests across channels</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>3. Step-by-step: file a grievance on Samadhan</h2>
          <ol>
            <li><strong>Select your state, district, and constituency</strong> — this routes your report to the correct MP office.</li>
            <li><strong>Pick a category</strong> — roads, water, health, education, electricity, or other.</li>
            <li><strong>Add location details</strong> — village, ward, pincode, or use GPS.</li>
            <li><strong>Describe the problem</strong> — be specific: how long it's been happening, how many people are affected.</li>
            <li><strong>Add evidence</strong> — photos, videos, or documents (optional but recommended).</li>
            <li><strong>Submit</strong> — you receive a reference ID to track your grievance.</li>
          </ol>

          <h2>4. What happens after you submit</h2>
          <p>Samadhan scores your report using verified demand, infrastructure-gap evidence, and severity. The ranked list is shown to officials who can review, re-rank, or add the project to their constituency plan. Officials retain responsibility for verification, eligibility, funding, and sanctions — Samadhan does not issue sanctions or commit funds.</p>

          <h2>5. Track your report</h2>
          <p>Use your reference ID on the tracking page to see what was recorded, the category assigned, and the severity score. No login is required.</p>

          <p className='center-action'>
            <Link className='button button--primary' to='/report-issue'>Report a constituency issue</Link>
          </p>

          <RelatedPages path='/how-to-report' />
        </div>
      </main>
      <Footer />
    </div>
  );
}
