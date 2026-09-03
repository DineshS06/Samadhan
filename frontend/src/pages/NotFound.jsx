import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'

export default function NotFound() {
  const { t } = useLanguage()
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4">
      <div className="text-center">
        <p className="text-6xl font-bold text-[#032B5B]">404</p>
        <p className="text-slate-600 mt-2">Page not found</p>
        <Link to="/" className="inline-block mt-6 px-5 py-2.5 bg-[#032B5B] text-white text-sm font-semibold rounded-lg hover:bg-[#0a4080]">
          {t.backToCitizen}
        </Link>
      </div>
    </div>
  )
}
