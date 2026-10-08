import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import Icon from './Icon';
import logo from '../assets/logo.png';

const nav = [
  ['/', 'Home'],
  ['/how-it-works', 'How it works'],
  ['/methodology', 'Methodology'],
  ['/faq', 'FAQs'],
  ['/about', 'About'],
];

export default function Header({ showLangToggle = true, subtitle = '' }) {
  const { lang, switchLang } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <header className='site-header'>
      <div className='site-header__inner'>
        <Link to='/' className='brand' aria-label='Samadhan home'>
          {/* Above-the-fold and the LCP element: eager, high priority, and sized to
                reserve layout space so the header does not shift on load. */}
          <img
            src={logo}
            alt='Samadhan logo - constituency intelligence platform'
            width='54'
            height='42'
            loading='eager'
            fetchPriority='high'
            decoding='sync'
          />
          <span>
            <strong>Samadhan</strong>
            <small>{subtitle || 'Constituency intelligence'}</small>
          </span>
        </Link>
        <button className='nav-toggle' type='button' aria-expanded={open} onClick={() => setOpen(!open)}>
          <span className='sr-only'>Menu</span>
          <Icon name={open ? 'close' : 'menu'} />
        </button>
        <nav className={'site-nav ' + (open ? 'is-open' : '')} aria-label='Primary navigation'>
          {nav.map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => 'site-nav__link ' + (isActive ? 'is-active' : '')}
              onClick={() => setOpen(false)}
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className='header-actions'>
          {showLangToggle && (
            <div className='language-switch'>
              <button onClick={() => switchLang('en')} aria-pressed={lang === 'en'}>
                EN
              </button>
              <button onClick={() => switchLang('hi')} aria-pressed={lang === 'hi'}>
                हिं
              </button>
            </div>
          )}
          <Link to='/report-issue' className='button button--small button--primary'>
            Report a constituency issue
          </Link>
        </div>
      </div>
    </header>
  );
}