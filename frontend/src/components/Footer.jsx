import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'

export default function Footer({ variant = 'citizen' }) {
  const { t } = useLanguage()

  return (
    <footer className="border-t border-slate-200 bg-white mt-8 py-6 px-4">
      <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <p>{t.footerTagline}</p>
        {variant === 'citizen' ? (
          <Link to="/mp/login" className="text-[#032B5B] hover:text-[#F28C0F] font-medium transition-colors">
            {t.staffLogin} →
          </Link>
        ) : (
          <Link to="/" className="text-[#032B5B] hover:text-[#F28C0F] font-medium transition-colors">
            {t.backToCitizen}
          </Link>
        )}
      </div>
    </footer>
  )
}
