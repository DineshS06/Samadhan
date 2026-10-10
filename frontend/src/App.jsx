import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ErrorBoundary from './components/ErrorBoundary';
import GA4 from './components/GA4';
import SEO, { SITE_URL } from './components/SEO';
// BreadcrumbSchema was exported but never imported, so every page that renders
// a visible <Breadcrumb /> trail shipped no matching BreadcrumbList data.
import { BreadcrumbSchema } from './components/Breadcrumb';
// Imported from the data module, not the page component: a static import of
// ./pages/FAQ here would pull the whole page into the entry chunk and undo the
// lazy() route split below.
import { FAQS } from './data/faqData';

// Route-level code splitting. The MP dashboard pulls in Leaflet and the auth
// client, which the public pages never need. Loading them eagerly shipped
// ~471 KB of JS to every first-time visitor.
const CitizenPortal = lazy(() => import('./pages/CitizenPortal'));
const HowItWorks = lazy(() => import('./pages/HowItWorks'));
const Methodology = lazy(() => import('./pages/Methodology'));
const FAQ = lazy(() => import('./pages/FAQ'));
const About = lazy(() => import('./pages/About'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Accessibility = lazy(() => import('./pages/Accessibility'));
const MPDashboard = lazy(() => import('./pages/MPDashboard'));
const MPLogin = lazy(() => import('./pages/MPLogin'));
const NotFound = lazy(() => import('./pages/NotFound'));

function RouteFallback() {
  return (
    <div className='page-shell'>
      <main>
        <div className='container section' aria-busy='true' aria-live='polite'>
          <p>Loading…</p>
        </div>
      </main>
    </div>
  );
}

const org = {
  '@type': 'Organization',
  '@id': SITE_URL + '/#organization',
  name: 'Samadhan',
  url: SITE_URL,
  logo: SITE_URL + '/og-samadhan.png',
  description:
    'AI-assisted constituency development planning platform for Indian MPs and administrative offices.',
  // sameAs must point at profiles this project actually controls. An
  // unverifiable handle is an entity-confusion signal, so the source repo is
  // the only identity asserted here until a live org profile exists.
  sameAs: ['https://github.com/DineshS06/Samadhan'],
};

const site = {
  '@type': 'WebSite',
  '@id': SITE_URL + '/#website',
  name: 'Samadhan',
  url: SITE_URL,
  // Published content (pages, headings, long-form copy) is English only.
  // The citizen portal form and MP dashboard chrome DO have a complete Hindi
  // UI translation (src/i18n/translations.js), but that is an in-app toggle, not
  // a separate indexable document. Declaring hi-IN as a site language without a
  // real /hi/ page would be a false signal, so the hreflang annotations are
  // omitted until localized pages exist.
  inLanguage: 'en-IN',
  publisher: { '@id': SITE_URL + '/#organization' },
};

// WebPage describes the document the JSON-LD graph is embedded in. It was
// missing, so the graph asserted an Organization and a SoftwareApplication but
// never described the page itself.
const webPage = (path, name, description) => ({
  '@type': 'WebPage',
  '@id': SITE_URL + path + '#webpage',
  url: SITE_URL + path,
  name,
  description,
  isPartOf: { '@id': SITE_URL + '/#website' },
  about: { '@id': SITE_URL + '/#organization' },
  inLanguage: 'en-IN',
});

const software = {
  '@type': 'SoftwareApplication',
  name: 'Samadhan',
  url: SITE_URL,
  applicationCategory: 'GovernmentApplication',
  operatingSystem: 'Web',
  // The portal chrome is translated into Hindi and accepts Telugu input;
  // long-form page content is English only. See the note on `site.inLanguage`.
  inLanguage: ['en-IN', 'hi-IN'],
  isAccessibleForFree: true,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
};

// FAQ entries match the VISIBLE Home page answers exactly (schema markup must mirror on-page content)
const homeFaq = {
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'What is Samadhan?', acceptedAnswer: { '@type': 'Answer', text: 'An AI-assisted constituency planning tool that turns citizen requests into evidence-backed project recommendations.' } },
    { '@type': 'Question', name: 'How does prioritization work?', acceptedAnswer: { '@type': 'Answer', text: 'Samadhan compares verified demand, relevant infrastructure-gap evidence, and urgency, then shows the reasoning for human review.' } },
    { '@type': 'Question', name: 'Does it make decisions automatically?', acceptedAnswer: { '@type': 'Answer', text: 'No. Officials retain responsibility for verification, eligibility, funding, and sanctions.' } },
    { '@type': 'Question', name: 'Is it an emergency service?', acceptedAnswer: { '@type': 'Answer', text: 'No. Contact the appropriate emergency service for urgent help.' } },
  ],
};

// FAQ entries are imported from the page itself, so structured data cannot
// drift from the visible copy. Schema markup that contradicts on-page text is
// a manual-action risk, not a ranking win.
const faqPage = {
  '@type': 'FAQPage',
  mainEntity: FAQS.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

// Steps match the VISIBLE 6 steps on the How It Works page exactly
const howTo = {
  '@type': 'HowTo',
  name: 'How Samadhan turns citizen input into a project recommendation',
  description: 'One workflow connects multilingual intake, AI structuring, public-data enrichment, transparent scoring, and human approval.',
  step: [
    { '@type': 'HowToStep', position: 1, name: 'Ingest', text: 'Capture text, voice transcripts, images, letters, meetings, and mocked social posts.' },
    { '@type': 'HowToStep', position: 2, name: 'Understand', text: 'Extract language, category, location, urgency, affected group, and summary.' },
    { '@type': 'HowToStep', position: 3, name: 'Enrich', text: 'Match the location and category to selected public or curated indicators.' },
    { '@type': 'HowToStep', position: 4, name: 'Score', text: 'Combine demand, deficit, and severity into an explainable score.' },
    { '@type': 'HowToStep', position: 5, name: 'Review', text: 'Display hotspots and ranked recommendations in the MP portal.' },
    { '@type': 'HowToStep', position: 6, name: 'Act', text: 'Verify evidence and prepare a draft administrative brief.' },
  ],
};

const techArticle = {
  '@type': 'TechArticle',
  headline: 'An explainable scoring model for constituency project review',
  description:
    'Demand volume (40%), infrastructure deficit (40%) and severity (20%) with safeguards: duplicate control, location confidence, data provenance, human override, bias review, freshness checks.',
  author: { '@id': SITE_URL + '/#organization' },
  publisher: { '@id': SITE_URL + '/#organization' },
  datePublished: '2026-01-15',
  dateModified: '2026-09-22',
  inLanguage: 'en-IN',
  mainEntityOfPage: SITE_URL + '/methodology',
};

/**
 * Append a BreadcrumbList, but only for routes that actually render a trail.
 * Adding it everywhere would assert visible breadcrumbs that are not on the
 * page, which is the same class of error as schema copy that does not match.
 */
function crumbs(path, nodes) {
  return [...nodes, BreadcrumbSchema(path)];
}

const data = {
  home: [org, site, software, homeFaq],
  how: crumbs('/how-it-works', [
    org,
    webPage(
      '/how-it-works',
      'How Samadhan turns citizen input into a project recommendation',
      'The six-step workflow: multilingual intake, AI structuring, public infrastructure data, transparent scoring, and human approval.',
    ),
    howTo,
  ]),
  method: crumbs('/methodology', [
    org,
    webPage(
      '/methodology',
      'Constituency Project Scoring Methodology',
      'How Samadhan scores verified demand (40%), infrastructure deficit (40%), and severity (20%) into an explainable, auditable project review order.',
    ),
    techArticle,
  ]),
  faq: crumbs('/faq', [
    org,
    webPage(
      '/faq',
      'Citizen Grievance and Constituency Planning FAQs',
      'Clear answers on reporting a constituency issue, how priority scores work, privacy of contact details, data sources, and limits of AI-assisted planning.',
    ),
    faqPage,
  ]),
  about: crumbs('/about', [org, webPage('/about', 'About Samadhan', 'Purpose, audience, scope, and explicit limits of the platform.')]),
  privacy: crumbs('/privacy', [org, webPage('/privacy', 'Privacy for Citizen Grievance Data', 'What data is collected, how it is used, who can access it, and how contact details are protected.')]),
  accessibility: crumbs('/accessibility', [
    org,
    webPage(
      '/accessibility',
      'Accessibility of the Citizen Grievance Portal',
      'Semantic design, keyboard access, multilingual input, and known limitations of this build.',
    ),
  ]),
  // /report-issue has no SectionHeading-driven prose, but it is still a page.
  other: [
    org,
    webPage(
      '/report-issue',
      'Report a Constituency Issue in Your Language',
      'Submit a public grievance about your constituency with location and evidence. You get a reference ID; your name and phone number stay private.',
    ),
  ],
};

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <GA4 />
        <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path='/' element={
            <>
              <SEO
                title='Report Constituency Issues to Your MP'
                description='Turn multilingual citizen requests into ranked constituency projects using a published, evidence-backed scoring model you can check.'
                path='/'
                schema={data.home}
              />
              <Home />
            </>
          } />
          <Route path='/report-issue' element={
            <>
              <SEO
                title='Report a Constituency Issue in Your Language'
                description='Submit a public grievance about your constituency with location and evidence. You get a reference ID; your name and phone number stay private.'
                path='/report-issue'
                schema={data.other}
              />
              <CitizenPortal />
            </>
          } />
          <Route path='/how-it-works' element={
            <>
              <SEO
                title='How AI Ranks Citizen Requests Into Projects'
                description='The six-step workflow: multilingual intake, AI structuring, public-data enrichment, explainable 40-40-20 scoring, human review, and sanction drafts.'
                path='/how-it-works'
                schema={data.how}
              />
              <HowItWorks />
            </>
          } />
          <Route path='/methodology' element={
            <>
              <SEO
                title='Constituency Project Scoring Methodology'
                description='How Samadhan scores verified demand (40%), infrastructure deficit (40%), and severity (20%) into an explainable, auditable project review order.'
                path='/methodology'
                schema={data.method}
              />
              <Methodology />
            </>
          } />
          <Route path='/faq' element={
            <>
              <SEO
                title='Citizen Grievance and Constituency Planning FAQs'
                description='Clear answers on reporting a constituency issue, how priority scores work, privacy of contact details, data sources, and limits of AI-assisted planning.'
                path='/faq'
                schema={data.faq}
              />
              <FAQ />
            </>
          } />
          <Route path='/about' element={
            <>
              <SEO
                title='About Samadhan: Civic-Tech for Constituency Planning'
                description='Why Samadhan connects citizen demand with infrastructure evidence: the purpose, audience, scope, and explicit limits of the platform.'
                path='/about'
                schema={data.about}
              />
              <About />
            </>
          } />
          <Route path='/privacy' element={
            <>
              <SEO
                title='Privacy for Citizen Grievance Data'
                description='What data Samadhan collects when you report a constituency issue, how it is used, who can access it, and how your contact details are protected.'
                path='/privacy'
                schema={data.privacy}
              />
              <Privacy />
            </>
          } />
          <Route path='/accessibility' element={
            <>
              <SEO
                title='Accessibility of the Citizen Grievance Portal'
                description='Samadhan accessibility commitments for reporting a constituency issue: semantic design, keyboard access, multilingual input, and known limitations.'
                path='/accessibility'
                schema={data.accessibility}
              />
              <Accessibility />
            </>
          } />
          <Route path='/mp/login' element={
            <>
              <SEO title='MP Staff Login' description='Authorized staff login.' path='/mp/login' noIndex />
              <MPLogin />
            </>
          } />
          <Route path='/mp' element={
            <>
              <SEO title='MP Dashboard' description='Private executive dashboard.' path='/mp' noIndex />
              <MPDashboard />
            </>
          } />
          <Route path='*' element={
            <>
              <SEO title='Page Not Found' description='Page not found.' path='/404' noIndex />
              <NotFound />
            </>
          } />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
