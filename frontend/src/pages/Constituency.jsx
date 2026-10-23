import SEO, { SITE_URL } from '../components/SEO';

export default function Constituency() {
  return (
    <>
      <SEO
        title='Constituency in India — Lok Sabha Seats and Your MP'
        description='What a constituency means in India, how Lok Sabha seats work, and how to find your Member of Parliament. Electoral district, MPLADS, and citizen grievance redressal.'
        path='/constituency'
        schema={{
          '@type': 'WebPage',
          '@id': SITE_URL + '/constituency#webpage',
          url: SITE_URL + '/constituency',
          name: 'Constituency in India — Lok Sabha Seats and Your MP',
          description: 'What a constituency means in India, how Lok Sabha seats work, and how to find your Member of Parliament. Electoral district, MPLADS, and citizen grievance redressal.',
          inLanguage: 'en-IN',
        }}
      />
      <main className='container section'>
        <h1>Constituency in India — Lok Sabha Seats and Your MP</h1>
        <p className='lead'>A constituency is an electoral district whose voters elect a representative — in India's case, a Member of Parliament (MP) to the Lok Sabha. There are 543 Lok Sabha constituencies across India's states and union territories.</p>

        <h2>What is a constituency?</h2>
        <p>A constituency (or electoral district) is a geographical area whose residents elect one representative. In India:</p>
        <ul>
          <li><strong>Lok Sabha</strong> — 543 constituencies, each electing one MP</li>
          <li><strong>Rajya Sabha</strong> — MPs elected by state legislative assemblies</li>
          <li><strong>State assemblies</strong> — MLAs elected from state constituencies</li>
        </ul>

        <h2>How constituencies are decided</h2>
        <p>Constituency boundaries are set by the Delimitation Commission based on Census data. The goal is roughly equal population across constituencies so that each MP represents a similar number of voters. Boundaries are reviewed periodically after each Census.</p>

        <h2>Your MP's role</h2>
        <p>Your elected MP represents your constituency in Parliament and can recommend development works through:</p>
        <ul>
          <li><strong>MPLADS</strong> — up to ₹5 crore per year for local development works</li>
          <li><strong>Questions in Parliament</strong> — raising your constituency's issues nationally</li>
          <li><strong>Grievance redressal</strong> — forwarding citizen complaints to ministries</li>
        </ul>

        <h2>How Samadhan uses constituency data</h2>
        <p>Samadhan groups citizen reports by constituency so MP offices can see which issues are most urgent in their area. Each report is scored by demand, infrastructure deficit, and severity — then shown to officials as a ranked review order.</p>

        <h2>Find your constituency</h2>
        <p>If you're not sure which Lok Sabha constituency you're in, check your voter ID card or the Election Commission of India website. When you report an issue on Samadhan, select your state and constituency so your report reaches the right MP office.</p>

        <p className='cta'><a href='/report-issue'>Report an issue in your constituency →</a></p>
      </main>
    </>
  );
}