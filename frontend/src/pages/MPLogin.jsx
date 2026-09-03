import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { mpLogin } from '../lib/mpAuth'

export default function MPLogin() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [username, setUsername] = useState('mp.visakhapatnam')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await mpLogin(username.trim(), password)
      navigate('/mp', { replace: true })
    } catch (ex) {
      setError(ex.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Header subtitle={t.mpLoginSubtitle} />

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <h2 className="text-xl font-bold text-[#032B5B]">{t.mpLoginTitle}</h2>
          <p className="text-sm text-slate-500 mt-2">{t.mpLoginDesc}</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#032B5B] mb-1.5">{t.mpUsername}</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#F28C0F]/40"
                required
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#032B5B] mb-1.5">{t.mpPassword}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#F28C0F]/40"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#032B5B] hover:bg-[#0a4080] disabled:opacity-50 text-white font-semibold py-3 rounded-lg"
            >
              {loading ? t.mpLoginLoading : t.mpLoginBtn}
            </button>
          </form>

          <div className="mt-6 p-3 bg-slate-50 rounded-lg text-xs text-slate-600 space-y-1">
            <p className="font-semibold text-[#032B5B]">{t.mpDemoAccounts}</p>
            <p>mp.visakhapatnam · mp.hyderabad · mp.delhi · mp.lucknow</p>
            <p>{t.mpDemoPassword}: <span className="font-mono">samadhan2026</span></p>
          </div>

          <p className="text-center mt-6">
            <Link to="/" className="text-sm text-[#032B5B] hover:text-[#F28C0F]">{t.backToCitizen}</Link>
          </p>
        </div>
      </main>

      <Footer variant="mp" />
    </div>
  )
}
