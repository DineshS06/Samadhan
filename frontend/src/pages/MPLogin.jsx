import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { mpLogin } from '../lib/mpAuth'
import { STATE_CONSTITUENCIES } from '../data/constituencyData'
import { formatConstituencyName } from '../data/districtConstituencies'

const STATES = Object.keys(STATE_CONSTITUENCIES).sort((a, b) => a.localeCompare(b))
const DEFAULT_STATE = 'Andhra Pradesh'
const DEFAULT_SEAT = 'VISAKHAPATNAM'

export default function MPLogin() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [state, setState] = useState(DEFAULT_STATE)
  const [constituency, setConstituency] = useState(DEFAULT_SEAT)
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const seats = STATE_CONSTITUENCIES[state] || []

  const handleStateChange = (event) => {
    const next = event.target.value
    setState(next)
    setConstituency(STATE_CONSTITUENCIES[next]?.[0] || '')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await mpLogin({ state, constituency }, password)
      navigate('/mp', { replace: true })
    } catch (ex) {
      setError(ex.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Header subtitle={t.mpLoginSubtitle} showLangToggle />

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <h1 className="text-xl font-bold text-[#032B5B]">{t.mpLoginTitle}</h1>
          <p className="text-sm text-slate-500 mt-2">{t.mpLoginDesc}</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="mp-state" className="block text-sm font-semibold text-[#032B5B] mb-1.5">{t.mpState}</label>
              <select
                id="mp-state"
                value={state}
                onChange={handleStateChange}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm bg-white focus:border-[#F28C0F]"
                required
              >
                {STATES.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="mp-constituency" className="block text-sm font-semibold text-[#032B5B] mb-1.5">{t.mpConstituency}</label>
              <select
                id="mp-constituency"
                value={constituency}
                onChange={(e) => setConstituency(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm bg-white focus:border-[#F28C0F]"
                required
              >
                {seats.map((name) => (
                  <option key={name} value={name}>{formatConstituencyName(name)}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="mp-password" className="block text-sm font-semibold text-[#032B5B] mb-1.5">{t.mpPassword}</label>
              <input
                id="mp-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:border-[#F28C0F]"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</div>
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
            <p className="font-semibold text-[#032B5B]">{t.mpLoginHelpTitle}</p>
            <p>{t.mpLoginHelp}</p>
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
