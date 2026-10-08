import { Link } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useLanguage } from '../i18n/LanguageContext'

export default function NotFound() {
  const { t } = useLanguage()
  return (
    <div className="page-shell">
      <Header />
      <main>
        <section className="section">
          <div className="container text-center">
            {/* h1, not p: the page previously had no heading element at all, so it
                was invisible to heading navigation and to screen readers. */}
            <h1 className="text-6xl font-bold text-[#032B5B]">404</h1>
            <p className="text-slate-600 mt-2">{t.notFound}</p>
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