import { useState } from 'react';
import SEO from '../components/SEO';
import { SITE_URL } from '../components/SEO';
import { computeStudy } from '../lib/computeStudy';
import { FAQS } from '../data/faqData';

// Build rows: one row per FAQ
const rows = FAQS.map((faq, index) => ({
  id: `faq-${index + 1}`,
  label: faq.q,
  answer: faq.a,
  category: categorizeFaq(faq.q),
}));

const study = computeStudy(rows, {
  labelField: 'label',
  denominator: rows.length,
});

const totalFaqs = FAQS.length;
const privacyFaqs = rows.filter((r) => r.category === 'Privacy & Data').length;
const mpladsFaqs = rows.filter((r) => r.category === 'MPLADS & Eligibility').length;

function categorizeFaq(question) {
  const q = question.toLowerCase();
  if (q.includes('phone') || q.includes('public') || q.includes('data') || q.includes('privacy'))
    return 'Privacy & Data';
  if (q.includes('mplads') || q.includes('eligibility') || q.includes('approve'))
    return 'MPLADS & Eligibility';
  if (q.includes('account') || q.includes('register'))
    return 'Account & Reporting';
  if (q.includes('ai') || q.includes('misunderstand'))
    return 'AI & Limitations';
  if (q.includes('government') || q.includes('emergency'))
    return 'Status & Scope';
  if (q.includes('language'))
    return 'Languages';
  if (q.includes('useful') || q.includes('report'))
    return 'Reporting';
  if (q.includes('disagree') || q.includes('override'))
    return 'Official Process';
  if (q.includes('data sources') || q.includes('infrastructure'))
    return 'Data & Methodology';
  if (q.includes('lightly reported') || q.includes('prioritised'))
    return 'Scoring';
  return 'Other';
}

export default function ResearchFaqs() {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <>
      <SEO
        title='Citizen FAQ Statistics 2026: 11 Frequently Asked Questions'
        description='11 published FAQs about citizen grievances, privacy, MPLADS eligibility, AI limitations, and more. Each answer linkable and quotable.'
        path='/research/faqs'
        schema={{
          '@type': 'WebPage',
          '@id': SITE_URL + '/research/faqs#webpage',
          url: SITE_URL + '/research/faqs',
          name: 'Citizen FAQ Statistics 2026',
          description:
            '11 published FAQs about citizen grievances, privacy, MPLADS eligibility, AI limitations, and more. Each answer linkable and quotable.',
          inLanguage: 'en-IN',
          isPartOf: { '@id': SITE_URL + '/#website' },
          about: { '@id': SITE_URL + '/#organization' },
        }}
      />
      <main className='page-shell'>
        <div className='container section'>
          <h1>Citizen FAQ Statistics 2026: 11 Frequently Asked Questions</h1>

          <div className='at-a-glance'>
            <div className='stat'>
              <span className='stat-value'>{totalFaqs}</span>
              <span className='stat-label'>Published FAQs</span>
            </div>
            <div className='stat'>
              <span className='stat-value'>{privacyFaqs}</span>
              <span className='stat-label'>FAQs about privacy & data</span>
            </div>
            <div className='stat'>
              <span className='stat-value'>{mpladsFaqs}</span>
              <span className='stat-label'>FAQs about MPLADS & eligibility</span>
            </div>
          </div>

          <h2>Key Findings</h2>
          <section id='finding-total-faqs'>
            <h3>Total FAQs</h3>
            <p>{totalFaqs} published frequently asked questions.</p>
            <a href='#finding-total-faqs' className='link-to-finding'>
              Link to this finding
            </a>
          </section>

          <section id='finding-faq-topics'>
            <h3>FAQ topics covered</h3>
            <p>
              Topics include: account requirements, report usefulness, phone
              privacy, MPLADS eligibility, AI misinterpretation, government
              status, data sources, low-reporting areas, official overrides,
              languages, and emergency services.
            </p>
            <a href='#finding-faq-topics' className='link-to-finding'>
              Link to this finding
            </a>
          </section>

          <section id='finding-privacy-faq'>
            <h3>Privacy FAQs</h3>
            <p>
              {privacyFaqs} FAQ addresses whether contact details are made
              public (answered: no).
            </p>
            <a href='#finding-privacy-faq' className='link-to-finding'>
              Link to this finding
            </a>
          </section>

          <section id='finding-mplads-faq'>
            <h3>MPLADS FAQs</h3>
            <p>
              {mpladsFaqs} FAQ addresses whether Samadhan decides MPLADS
              eligibility (answered: no).
            </p>
            <a href='#finding-mplads-faq' className='link-to-finding'>
              Link to this finding
            </a>
          </section>

          {/* FAQ entity blocks: each question as anchored section */}
          <h2>All 11 FAQs</h2>
          <p>
            Each question is an anchored entity block with its answer. Use
            <strong>Link to this answer</strong> to cite a specific FAQ.
          </p>
          <div className='faq-list'>
            {rows.map((faq) => (
              <section
                key={faq.id}
                id={`entity-faq-${slugify(faq.label)}`}
                className='entity-block'
              >
                <h3
                  onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                  style={{ cursor: 'pointer' }}
                >
                  {faq.label}
                </h3>
                {openFaq === faq.id && (
                  <div className='entity-details'>
                    <p>{faq.answer}</p>
                    <p><strong>Topic:</strong> {faq.category}</p>
                    <a href={`#entity-faq-${slugify(faq.label)}`} className='link-to-answer'>
                      Link to this answer
                    </a>
                  </div>
                )}
              </section>
            ))}
          </div>

          <h2>Frequently Asked Questions (Quotable)</h2>
          <div className='faq-quotable'>
            {rows.map((faq) => (
              <section
                key={faq.id}
                id={`faq-answered-${slugify(faq.label)}`}
              >
                <h3 onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)} style={{ cursor: 'pointer' }}>
                  {faq.label}
                </h3>
                {openFaq === faq.id && <p>{faq.answer}</p>}
                <a href={`#faq-answered-${slugify(faq.label)}`} className='link-to-answer'>
                  Link to this answer
                </a>
              </section>
            ))}
          </div>

          <h2>Suggested Citation</h2>
          <p>
            Samadhan. Citizen FAQ Statistics 2026: 11 Frequently Asked
            Questions. {SITE_URL}/research/faqs. October 2026.
          </p>
        </div>
      </main>
    </>
  );
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+$/, '')
    .replace(/^-+/, '');
}
