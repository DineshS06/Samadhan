import { useEffect, useState } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { FormField, inputClass } from '../components/citizen/FormField'
import { submitGrievance } from '../lib/api'
import { useLanguage } from '../i18n/LanguageContext'
import {
  getLanguagesForState,
  getDistrictsForState,
  getConstituenciesForState,
} from '../i18n/translations'
import { INDIAN_STATES } from '../data/formConfig'

const CHANNEL_ICONS = { web: '🌐', whatsapp: '💬', phone: '📞', twitter: '📱', meeting: '🏛️', letter: '✉️' }
const CATEGORY_ICONS = {
  roads: '🛣️', water: '💧', health: '🏥', education: '📚', power: '⚡', housing: '🏠',
  agri: '🌾', employment: '💼', safety: '🛡️', environment: '🌿', transport: '🚌', other: '📋',
}

const INITIAL = {
  name: '', phone: '', state: '', district: '', constituency: '', language: '',
  channel: 'web', category: '', village: '', ward_block: '', pincode: '',
  geolocation: null, text: '', self_reported_severity: 3, attachment: null,
}

function Section({ title, children }) {
  return (
    <section className="border-b border-slate-100 pb-6 mb-6 last:border-0 last:pb-0 last:mb-0">
      <h3 className="text-sm font-bold text-[#032B5B] uppercase tracking-wide mb-4 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[#F28C0F]" />
        {title}
      </h3>
      {children}
    </section>
  )
}

export default function CitizenPortal() {
  const { t, tc, tcd, tch, ts, categoryIds } = useLanguage()
  const [form, setForm] = useState(INITIAL)
  const [loading, setLoading] = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  // Tracking state
  const [trackId, setTrackId] = useState('')
  const [trackResult, setTrackResult] = useState(null)
  const [trackError, setTrackError] = useState(null)
  const [trackLoading, setTrackLoading] = useState(false)

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  const availableLanguages = getLanguagesForState(form.state)
  const districts = getDistrictsForState(form.state)
  const constituencies = getConstituenciesForState(form.state)
  const locationReady = Boolean(form.state && form.district.trim() && form.constituency.trim())

  // Auto-fetch location on mount if not yet set
  useEffect(() => {
    if (!form.geolocation && navigator.geolocation) {
      useMyLocation()
    }
  }, [])

  useEffect(() => {
    if (form.language && !availableLanguages.includes(form.language)) set('language', '')
  }, [form.state])

  const useMyLocation = () => {
    if (!navigator.geolocation) { setError(t.geoUnsupported); return }
    setGeoLoading(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set('geolocation', { latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy })
        setGeoLoading(false)
      },
      () => { setError(t.gpsFail); setGeoLoading(false) },
      { enableHighAccuracy: true, timeout: 15000 },
    )
  }

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError(t.valFileSize); return }
    const reader = new FileReader()
    reader.onload = () => {
      set('attachment', { name: file.name, type: file.type, data: reader.result.split(',')[1] })
    }
    reader.readAsDataURL(file)
  }

  const validate = () => {
    if (!form.state) return t.valState
    if (!form.district.trim()) return t.valDistrict
    if (!form.constituency.trim()) return t.valConstituency
    if (!form.language) return t.valLanguage
    if (!form.category) return t.valCategory
    if (!form.name.trim()) return t.valName
    if (!form.phone.trim()) return t.valPhone
    // Phone: exactly 10 digits
    const digits = form.phone.replace(/\D/g, '')
    if (!/^[6-9]\d{9}$/.test(digits)) return t.valPhoneFormat
    if (!form.village.trim() && !form.geolocation) return t.valVillage
    // PIN code: exactly 6 digits
    if (!/^\d{6}$/.test(form.pincode)) return t.valPincode
    if (!form.text.trim()) return t.valText
    return null
  }

  const describePlaceholder = () => {
    if (form.language === 'Hindi') return t.describePhHi
    if (form.language === 'Telugu') return t.describePhTe
    return t.describePhEn
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }
    setLoading(true)
    setError(null)
    try {
      const data = await submitGrievance({
        ...form,
        category: tc(form.category),
        phone: form.phone.replace(/\D/g, '').slice(-10),
      })
      setResult(data)
      // Auto-fill tracking with submitted grievance info
      setTrackId(data.reference_id)
      setTrackResult({
        reference_id: data.reference_id,
        status: 'Submitted',
        details: data.result.summary || '',
        category: data.result.category,
        location: data.result.location,
        severity_score: data.result.severity_score,
      })
      setForm(INITIAL)
    } catch (ex) {
      setError(ex.message)
    } finally {
      setLoading(false)
    }
  }

  // Real tracking function - calls backend API to get grievance details
  const handleTrackSubmit = async (e) => {
    e.preventDefault()
    if (!trackId.trim()) { setTrackError('Please enter a Reference ID'); return }
    setTrackLoading(true)
    setTrackError(null)
    try {
      const response = await fetch(`/api/grievance/${trackId.trim().toUpperCase()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch grievance details')
      }

      // Handle successful response
      if (data.success && data.result) {
        const result = data.result

        // Extract fields with sensible fallbacks
        const status = result.status ||
                      result.processing_status ||
                      'Submitted' // Default for newly submitted grievances

        // Details could be in summary, description, or details field
        const details = result.summary ||
                       result.description ||
                       result.details ||
                       'No details available'

        // Category should be directly available
        const category = result.category || 'Unknown'

        /* Location - could be in location, village, or derived from components */
        let location = result.location
        if (!location) {
          const village = result.village || ''
          const ward = result.ward_block || ''
          const pincode = result.pincode || ''
          location = [village, ward, pincode].filter(Boolean).join(', ') || 'Location not specified'
        }

        // Severity score - should be numeric 1-5
        const severity_score = parseInt(result.severity_score) || 3

        setTrackResult({
          reference_id: data.reference_id || result.reference_id || trackId,
          status: String(status),
          details: String(details),
          category: String(category),
          location: String(location),
          severity_score: Math.max(1, Math.min(5, severity_score)) // Clamp to 1-5
        })
      } else {
        // Fallback if response format is unexpected
        throw new Error('Invalid response format from server')
      }
    } catch (ex) {
      setTrackError(ex.message)
    } finally {
      setTrackLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Header subtitle={t.citizenSubtitle} />

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-6 w-full">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-[#032B5B]">{t.reportIssue}</h2>
          <p className="text-slate-500 text-sm mt-1">{t.reportDesc}</p>
        </div>

        {!result ? (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
            <Section title={t.yourDetails}>
              <div className="space-y-4">
                <FormField label={t.state} required>
                  <select value={form.state} onChange={(e) => { set('state', e.target.value); set('district', ''); set('constituency', '') }} className={inputClass} required>
                    <option value="">{t.selectState}</option>
                    {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </FormField>

                {form.state && (
                  <>
                    <FormField label={t.district} required>
                      {districts ? (
                        <select value={form.district} onChange={(e) => set('district', e.target.value)} className={inputClass} required>
                          <option value="">{t.districtPh}</option>
                          {districts.map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>
                      ) : (
                        <input type="text" value={form.district} onChange={(e) => set('district', e.target.value)} className={inputClass} placeholder={t.districtPh} required />
                      )}
                    </FormField>

                    <FormField label={t.constituency} required hint={t.constituencyHint}>
                      {constituencies ? (
                        <select value={form.constituency} onChange={(e) => set('constituency', e.target.value)} className={inputClass} required>
                          <option value="">{t.constituencyPh}</option>
                          {constituencies.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      ) : (
                        <input type="text" value={form.constituency} onChange={(e) => set('constituency', e.target.value)} className={inputClass} placeholder={t.constituencyPh} required />
                      )}
                    </FormField>

                    <FormField label={t.language} required hint={t.languageHint}>
                      <div className="flex flex-wrap gap-2">
                        {availableLanguages.map((lang) => (
                          <button key={lang} type="button" onClick={() => set('language', lang)}
                            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                              form.language === lang ? 'border-[#F28C0F] bg-orange-50 text-[#032B5B]' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}>{lang}</button>
                        ))}
                      </div>
                    </FormField>

                    {/* Removed channel section as per request */}
                  </>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label={t.name} required>
                    <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} className={inputClass} placeholder={t.namePh} required />
                  </FormField>
                  <FormField label={t.phone} required hint={t.phoneHint}>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => set('phone', e.target.value)}
                      className={inputClass}
                      placeholder={t.phonePh}
                      required
                      maxLength={10}
                      pattern="[0-9]{10}"
                      title="Please enter a 10‑digit mobile number"
                    />
                  </FormField>
                </div>

                <p className="text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">{t.privacyNotice}</p>
              </div>
            </Section>

            <Section title={t.issueCategory}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {categoryIds.map((id) => (
                  <button key={id} type="button" onClick={() => set('category', id)}
                    className={`text-left p-3 rounded-xl border-2 transition-all ${
                      form.category === id ? 'border-[#F28C0F] bg-orange-50' : 'border-slate-200 hover:border-slate-300'
                    }`}>
                    <span className="text-lg">{CATEGORY_ICONS[id]}</span>
                    <p className="font-semibold text-[#032B5B] text-xs mt-1 leading-tight">{tc(id)}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{tcd(id)}</p>
                  </button>
                ))}
              </div>
            </Section>

            <Section title={t.location}>
              {!locationReady ? (
                <p className="text-sm text-slate-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">{t.locationLockedHint}</p>
              ) : (
                <div className="space-y-4">
                  <button type="button" onClick={useMyLocation} disabled={geoLoading}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#032B5B] hover:bg-[#0a4080] text-white text-sm font-medium px-4 py-2.5 rounded-lg disabled:opacity-50">
                    {geoLoading ? t.gpsLoading : `📍 ${t.useGps}`}
                  </button>
                  {form.geolocation && (
                    <p className="text-xs text-green-700 font-mono">✓ {t.gpsCaptured}</p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label={t.village} required={!form.geolocation}>
                      <input type="text" value={form.village} onChange={(e) => set('village', e.target.value)} className={inputClass} placeholder={t.villagePh} required={!form.geolocation} />
                    </FormField>
                    <FormField label={t.ward} required>
                      <input type="text" value={form.ward_block} onChange={(e) => set('ward_block', e.target.value)} className={inputClass} placeholder={t.wardPh} />
                    </FormField>
                    <FormField label={t.pincode} required>
                      <input type="text" value={form.pincode} onChange={(e) => set('pincode', e.target.value)} className={inputClass} maxLength={6} />
                    </FormField>
                  </div>
                </div>
              )}
            </Section>

            <Section title={t.describeIssue}>
              <div className="space-y-4">
                <FormField label={t.describe} required hint={t.describeHint}>
                  <textarea rows={5} value={form.text} onChange={(e) => set('text', e.target.value)} required
                    placeholder={describePlaceholder()} className={`${inputClass} resize-y leading-relaxed`} />
                </FormField>
                <FormField label={t.severity}>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <button key={v} type="button" onClick={() => set('self_reported_severity', v)}
                        className={`flex-1 py-2 rounded-lg border text-center transition-colors ${
                          form.self_reported_severity === v ? 'border-[#F28C0F] bg-orange-50 font-bold text-[#032B5B]' : 'border-slate-200 text-slate-500'
                        }`}>
                        <div className="text-base">{v}</div>
                        <div className="text-[9px] leading-tight mt-0.5">{ts(v)}</div>
                      </button>
                    ))}
                  </div>
                </FormField>
              </div>
            </Section>

            <Section title={t.evidence}>
              <FormField label={t.attachments} hint={t.attachmentsHint}>
                <input type="file" accept="image/*,video/mp4,video/quicktime,.pdf,.doc,.docx" onChange={handleFile}
                  className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#032B5B] file:text-white file:font-medium hover:file:bg-[#0a4080]" />
                {form.attachment && (
                  <p className="text-xs text-green-700 mt-2">✓ {t.attachmentSelected}: {form.attachment.name}</p>
                )}
              </FormField>
            </Section>

            {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded-lg mb-4">{error}</div>}

            <button type="submit" disabled={loading}
              className="w-full bg-[#F28C0F] hover:bg-[#e07d0a] disabled:opacity-50 text-white font-semibold py-3.5 rounded-lg shadow transition-colors">
              {loading ? t.submitting : t.submit}
            </button>
          </form>
        ) : (
          <div className="bg-white rounded-2xl border border-green-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 bg-green-50 text-center border-b border-green-100">
              <div className="text-3xl mb-2">✓</div>
              <p className="font-bold text-green-800">{t.success}</p>
              <p className="text-sm text-green-700 mt-2">{t.refId}: <span className="font-mono font-bold">{result.reference_id}</span></p>
              <p className="text-xs text-green-600 mt-1">{t.saveRef}</p>
            </div>
            <div className="p-6 grid grid-cols-2 gap-3 text-sm">
              <RF label={t.category} value={result.result.category} />
              <RF label={t.locationLabel} value={result.result.location} />
              <RF label={t.severityLabel} value={`${result.result.severity_score}/5`} />
              <RF label={t.priorityLabel} value={result.result.infrastructure_gap_score} />
              <div className="col-span-2 bg-slate-50 rounded-lg p-3"><RF label={t.summaryLabel} value={result.result.summary} /></div>
            </div>
            <div className="px-6 pb-6">
              <button onClick={() => setResult(null)} className="w-full py-2.5 rounded-lg bg-[#032B5B] text-white text-sm font-semibold">{t.submitAnother}</button>
            </div>
          </div>
        )}

        {/* Track your grievance section (shown after successful submission) */}
        {result && (
          <Section title={t.trackYourGrievance || 'Track your grievance'}>
            <div className="space-y-4">
              <FormField label={t.refId || 'Reference ID'}>
                <input
                  type="text"
                  value={trackId}
                  onChange={(e) => setTrackId(e.target.value)}
                  className={inputClass}
                  placeholder={t.refIdPlaceholder || 'Enter Reference ID'}
                />
              </FormField>
              <button type="button" onClick={handleTrackSubmit} disabled={trackLoading}
                className="w-full bg-[#F28C0F] hover:bg-[#e07d0a] disabled:opacity-50 text-white font-semibold py-3.5 rounded-lg shadow transition-colors">
                {trackLoading ? t.tracking : 'Check Status'}
              </button>
            </div>
          </Section>
        )}

        {/* Tracking result display */}
        {trackResult && (
          <div className="bg-white rounded-2xl border border-blue-200 shadow-sm overflow-hidden mt-6">
            <div className="px-6 py-5 bg-blue-50 text-center border-b border-blue-100">
              <div className="text-3xl mb-2">🔍</div>
              <p className="font-bold text-blue-800">{t.trackingResult || 'Tracking Result'}</p>
              <p className="text-sm text-blue-700 mt-2">{t.refId}: <span className="font-mono font-bold">{trackResult.reference_id}</span></p>
            </div>
            <div className="p-6 grid grid-cols-2 gap-3 text-sm">
              <RF label={t.status} value={trackResult.status} />
              <RF label={t.category} value={trackResult.category} />
              <RF label={t.locationLabel} value={trackResult.location} />
              <RF label={t.severityLabel} value={`${trackResult.severity_score}/5`} />
              <div className="col-span-2 bg-slate-50 rounded-lg p-3"><RF label={t.summaryLabel} value={trackResult.details || ''} /></div>
            </div>
            <div className="px-6 pb-6">
              <button onClick={() => {
                setTrackResult(null)
                setTrackId('')
              }} className="w-full py-2.5 rounded-lg bg-[#032B5B] text-white text-sm font-semibold">{t.trackAnother || 'Track Another'}</button>
            </div>
          </div>
        )}

        {trackError && <div className="text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded-lg mb-4 mt-4">{trackError}</div>}
      </main>

      <Footer variant="citizen" />
    </div>
  )
}

function RF({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-500 uppercase">{label}</p>
      <p className="font-semibold text-[#032B5B] mt-0.5">{value}</p>
    </div>
  )
}