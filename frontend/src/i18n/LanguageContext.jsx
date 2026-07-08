import { createContext, useContext, useState, useCallback } from 'react'
import { UI, CATEGORY_IDS, CHANNEL_IDS } from './translations'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('samadhan_ui_lang') || 'en')

  const switchLang = useCallback((code) => {
    setLang(code)
    localStorage.setItem('samadhan_ui_lang', code)
  }, [])

  const t = UI[lang] || UI.en

  const tc = useCallback(
    (categoryId) => t.categories[categoryId]?.label || categoryId,
    [t],
  )

  const tcd = useCallback(
    (categoryId) => t.categories[categoryId]?.desc || '',
    [t],
  )

  const tch = useCallback(
    (channelId) => t.channels[channelId] || channelId,
    [t],
  )

  const ts = useCallback(
    (level) => t.severityLevels[level] || String(level),
    [t],
  )

  return (
    <LanguageContext.Provider value={{ lang, switchLang, t, tc, tcd, tch, ts, categoryIds: CATEGORY_IDS, channelIds: CHANNEL_IDS }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
