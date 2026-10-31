import { Link } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useLanguage } from '../i18n/LanguageContext'

export default function NotFound() {
  const { t } = useLanguage()
  return (
    <div className="page-shell">
      <Header showLangToggle />
      <main>
        <section className="section">
          <div className="container text-center">
            {/* h1, not p: the page previously had no heading element at all, so it
                was invisible to heading navigation and to screen readers. */}
            {/* The number is decoration; the heading is the page name. With the
                number as the h1, heading navigation announced "404" and nothing
                else, and the page had no descriptive title for a reader who
                arrived from a stale link. */}
            <p aria-hidden='true' className="text-6xl font-bold text-[#032B5B]">404</p>
            <h1 className="text-2xl font-bold text-[#032B5B] mt-2">{t.notFound}</h1>
            <p className="text-slate-600 mt-2">The page you asked for does not exist or has moved.</p>
            <Link to="/" className="button button--primary mt-6">
              {t.backToCitizen}
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}