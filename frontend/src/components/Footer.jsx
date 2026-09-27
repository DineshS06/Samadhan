import { Link } from 'react-router-dom';

export default function Footer({ variant = 'citizen' }) {
  return (
    <footer className='site-footer'>
      <div className='container site-footer__grid'>
        <div className='footer-brand'>
          <strong>Samadhan</strong>
          <p>AI-assisted constituency development planning for clearer, evidence-led public decisions.</p>
          <span>Prototype platform · Not an emergency service</span>
        </div>
        <nav>
          <h2>Platform</h2>
          <Link to='/report-issue'>Report an issue</Link>
          <Link to='/how-it-works'>How it works</Link>
          <Link to='/methodology'>Priority methodology</Link>
          <Link to='/faq'>FAQs</Link>
        </nav>
        <nav>
          <h2>Trust</h2>
          <Link to='/about'>About</Link>
          <Link to='/privacy'>Privacy</Link>
          <Link to='/accessibility'>Accessibility</Link>
          {variant === 'citizen' ? (
            <Link to='/mp/login' rel='nofollow'>MP office login</Link>
          ) : (
            <Link to='/report-issue'>Citizen portal</Link>
          )}
        </nav>
      </div>
      <div className='container site-footer__bottom'>
        <span>© 2026 Samadhan Civic Tech</span>
        <span>For citizens, MPs, and administrative officers.</span>
      </div>
    </footer>
  );
}