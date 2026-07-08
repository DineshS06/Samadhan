import { useLanguage } from '../i18n/LanguageContext'

export default function Header({ subtitle, showLangToggle = true }) {
  const { lang, switchLang, t } = useLanguage()

  return (
    <header className="bg-[#032B5B] text-white px-4 sm:px-6 py-4 flex items-center gap-3 shadow-md">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-lg bg-[#F28C0F] flex items-center justify-center font-bold text-lg shrink-0">
          S
        </div>
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-bold tracking-tight truncate">{t.appTitle}</h1>
          <p className="text-xs text-blue-200 mt-0.5 truncate">{subtitle || t.citizenSubtitle}</p>
        </div>
      </div>

      {showLangToggle && (
        <div className="flex items-center gap-1 shrink-0 bg-white/10 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => switchLang('en')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
              lang === 'en' ? 'bg-white text-[#032B5B]' : 'text-blue-100 hover:text-white'
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => switchLang('hi')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
              lang === 'hi' ? 'bg-white text-[#032B5B]' : 'text-blue-100 hover:text-white'
            }`}
          >
            हिंदी
          </button>
        </div>
      )}
    </header>
  )
}
