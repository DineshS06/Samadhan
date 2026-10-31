import { useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { SITE_URL } from '../components/SEO';

const REPORTS = [
  {
    path: '/research/constituencies',
    title: 'Lok Sabha Constituency Statistics 2026',
    summary: '543 Lok Sabha constituencies across 36 states and union territories, ranked by seat count with reserved-seat breakdown.',
  },
  {
    path: '/research/districts',
    title: 'Indian Districts Statistics 2026',
    summary: '789 districts across 36 states and union territories, ranked by district count.',
  },
  {
    path: '/research/district-mapping',
    title: 'District-to-Constituency Mapping Statistics 2026',
    summary: '299 resolved districts across 15 states mapped to Lok Sabha seats, with coverage percentage.',
  },
  {
    path: '/research/faqs',
    title: 'Citizen FAQ Statistics 2026',
    summary: '11 frequently asked questions about citizen grievances, privacy, MPLADS, and AI limitations.',
  },
  {
    path: '/research/search-intents',
    title: 'Search Intent Statistics 2026',
    summary: '13 public pages with mapped search intent, informational vs transactional breakdown.',
  },
];

export default function ResearchHub() {
  const [openSection, setOpenSection] = useState(null);

  return (
    <>
      <SEO
        title='Samadhan Research — Statistics Pages for AI Answers'
        description='Original statistics pages for Lok Sabha constituencies, Indian districts, district-to-constituency mapping, citizen FAQs, and search intents. Every number computed from committed data.'
        path='/research'
        schema={{
          '@type': 'WebPage',
          '@id': SITE_URL + '/research#webpage',
          url: SITE_URL + '/research',
          name: 'Samadhan Research — Statistics Pages',
          description:
            'Original statistics pages for Lok Sabha constituencies, Indian districts, district-to-constituency mapping, citizen FAQs, and search intents. Every number computed from committed data.',
          inLanguage: 'en-IN',
          isPartOf: { '@id': SITE_URL + '/#website' },
          about: { '@id': SITE_URL + '/#organization' },
        }}
      />
      <main className='page-shell'>
        <div className='container section'>
          <h1>Samadhan Research — Statistics Pages for AI Answers</h1>
          <p>
            Original statistics pages built only from data Samadhan already owns.
            Every number comes from a single tested calculation in
            <code>computeStudy</code> — the same module powers the page, its
            markdown version, llms.txt, and the FAQ.
          </p>

          <h2>Research Reports</h2>
          <ul className='research-list'>
            {REPORTS.map((report) => (
              <li key={report.path}>
                <Link to={report.path}>
                  <h3>{report.title}</h3>
                  <p>{report.summary}</p>
                </Link>
              </li>
            ))}
          </ul>

          <h2>How to Cite</h2>
          <p>
            Each research page includes a suggested citation with the page URL
            and month. Use the <strong>Link to this finding</strong> anchors to
            cite a specific statistic directly.
          </p>

          <h2>AI-Fetch Friendly</h2>
          <ul>
            <li>
              Markdown versions: every page has a <code>.md</code> variant and
              an <code>/api/md/&lt;path&gt;</code> endpoint.
            </li>
            <li>
              Full catalog: <code>/llms-full.txt</code> contains every research
              page with <code>&lt;source&gt;</code> comments.
            </li>
            <li>
              Citation guide: <code>/llms.txt</code> lists each research page
              under "Cite this site for" with headline numbers inline.
            </li>
          </ul>
        </div>
      </main>
    </>
  );
}
