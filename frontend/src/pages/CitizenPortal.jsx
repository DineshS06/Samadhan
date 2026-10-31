import { useEffect, useState } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import Icon from '../components/Icon'
import { FormField, inputClass } from '../components/citizen/FormField'
import { submitGrievance } from '../lib/api'
import { trackFormSubmit } from '../components/GA4'
import { getBestPosition, reverseGeocode, describeAccuracy } from '../lib/geocode'
import { useLanguage } from '../i18n/LanguageContext'
import {
  getLanguagesForState,
  getDistrictsForState,
  getConstituenciesForState,
} from '../i18n/translations'
import { INDIAN_STATES } from '../data/formConfig'
import { formatConstituencyName } from '../data/districtConstituencies'

const CATEGORY_ICONS = {
  roads: 'road', water: 'water', health: 'health', education: 'education', power: 'power', housing: 'home',
  agri: 'plant', employment: 'briefcase', safety: 'shield', environment: 'leaf', transport: 'bus', other: 'file',
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
  const { t, tc, tcd, ts, categoryIds } = useLanguage()
  const [form, setForm] = useState(INITIAL)
  const [loading, setLoading] = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)
  // What the last GPS fix resolved to. Shown to the citizen so a wrong pin is
  // visible immediately instead of silently filling the wrong village.
  const [gpsInfo, setGpsInfo] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  // Set when a submission could NOT be recorded. The form is deliberately left
  // populated so the citizen can read and copy what they wrote to another channel.
  const [notRecorded, setNotRecorded] = useState(null)

  // Tracking state
  const [trackId, setTrackId] = useState('')
  const [trackResult, setTrackResult] = useState(null)
  const [trackError, setTrackError] = useState(null)
  const [trackLoading, setTrackLoading] = useState(false)

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  const availableLanguages = getLanguagesForState(form.state)
  const districts = getDistrictsForState(form.state)
  // Constituencies are always a dropdown, never a free-text box. District and
  // Lok Sabha boundaries do not align, so every seat in the chosen state is
  // offered. The district is still required for routing. A free-text box here
  // let a citizen type a seat that does not exist, and the backend then had no
  // seat to route the grievance to.
  const constituencies = getConstituenciesForState(form.state)
  const locationReady = Boolean(form.state && form.district.trim() && form.constituency.trim())

  
  useEffect(() => {
    if (form.language && !availableLanguages.includes(form.language)) set('language', '')
  }, [form.state])

  // Nominatim returns state and district names that do not always match our
  // option strings ("Andaman and Nicobar" vs "Andaman and Nicobar Islands",
  // "Y.S.R. Kadapa" vs "YSR Kadapa"). Comparing letters and digits only means
  // the autofill selects a real option instead of leaving the select blank.
  const matchOption = (value, options) => {
    if (!value || !Array.isArray(options)) return ''
    const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '')
    const target = norm(value)
    if (!target) return ''
    const exact = options.find((o) => norm(o) === target)
    if (exact) return exact
    const partial = options.find((o) => {
      const n = norm(o)
      return n.length >= 4 && target.length >= 4 && (n.startsWith(target) || target.startsWith(n))
    })
    return partial || ''
  }

  const useMyLocation = () => {
    if (!navigator.geolocation) { setError(t.geoUnsupported); return }
    setGeoLoading(true)
    setError(null)
    setGpsInfo(null)

    getBestPosition()
      .then(async (pos) => {
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }
        // Reverse-geocode so village/ward/pincode autofill (citizen can override).
        const address = await reverseGeocode(coords)

        // Check the country before storing the fix. The village field is only
        // required when there is no GPS, so storing a foreign fix first would
        // let a citizen outside India submit a grievance with no address at all.
        if (address && address.inIndia === false) {
          setError(t.gpsOutsideIndia)
          setGeoLoading(false)
          return
        }

        set('geolocation', coords)

        if (!address) {
          // Coordinates are still useful for the map even without an address.
          setGpsInfo({ ...coords, formatted: '', filled: [] })
          setError(t.gpsReverseFailed)
          setGeoLoading(false)
          return
        }

        // Resolve the state from the fix first, then look the district up in
        // that state's list. The GPS action is explicit, so a fix in a
        // different state replaces a stale selection instead of silently
        // keeping the wrong state. The constituency belongs to the old state,
        // so it is cleared when the state changes; the citizen can choose the
        // seat again. A resolved district also replaces a stale district.
        const gpsState = matchOption(address.state, INDIAN_STATES)
        const stateChanged = Boolean(gpsState && form.state && gpsState !== form.state)
        const nextState = gpsState || form.state
        const districtOptions = nextState ? getDistrictsForState(nextState) : null
        const gpsDistrict = matchOption(address.district, districtOptions)
        const nextDistrict = gpsDistrict || (stateChanged ? '' : form.district)
        const nextVillage = form.village || address.village || address.ward || ''
        const nextWard = form.ward_block || address.ward || address.block || ''
        const nextPincode = form.pincode || address.pincode || ''

        setForm((f) => ({
          ...f,
          geolocation: coords,
          state: nextState || f.state,
          district: nextDistrict || (stateChanged ? '' : f.district),
          constituency: stateChanged ? '' : f.constituency,
          village: f.village || nextVillage,
          ward_block: f.ward_block || nextWard,
          pincode: f.pincode || nextPincode,
        }))

        const filled = []
        if (nextState && nextState !== form.state) filled.push(t.state)
        if (nextDistrict && nextDistrict !== form.district) filled.push(t.district)
        if (nextVillage && nextVillage !== form.village) filled.push(t.village)
        if (nextWard && nextWard !== form.ward_block) filled.push(t.ward)
        if (nextPincode && nextPincode !== form.pincode) filled.push(t.pincode)

        setGpsInfo({
          ...coords,
          formatted: address.formatted || '',
          road: address.road || '',
          postOffice: address.postOffice || '',
          filled,
        })
        setGeoLoading(false)
      })
      .catch((err) => {
        let msg = t.gpsFail
        if (err.code === 1) msg = t.gpsPermissionDenied
        if (err.code === 2) msg = t.gpsPositionUnavailable
        if (err.code === 3) msg = t.gpsTimeout
        setError(msg)
        setGeoLoading(false)
      })
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
    // Ward/block is marked required in the UI, so enforce it here too.
    if (!form.ward_block.trim()) return t.valWard
    // PIN code: exactly 6 digits
    if (!/^\d{6}$/.test(form.pincode)) return t.valPincode
    if (!form.text.trim()) return t.valText
    // Reject nonsense/random text: repeated chars, keyboard mashing, too short
    if (_isGibberish(form.text)) return t.valNonsenseText
    return null
  }

  // Client-side gibberish detection so random text is flagged before submission.
  // The local is named `value`, not `t`: the i18n checker scans for `t.<key>`
  // and cannot tell a text variable from the translation object.
  function _isGibberish(text) {
    if (!text || !text.trim()) return true
    const value = text.trim()
    if (value.length < 5) return true
    if (/(.)\1{3,}/.test(value)) return true
    if (/(.{2,4})\1{3,}/.test(value)) return true
    const patterns = ['qwerty', 'asdfgh', 'zxcvbn', '12345', 'abcdef', 'poiuyt']
    const lower = value.toLowerCase()
    for (const p of patterns) if (lower.includes(p)) return true
    const vowels = (lower.match(/[aeiou]/g) || []).length
    const consonants = (lower.match(/[bcdfghjklmnpqrstvwxyz]/g) || []).length
    const alpha = vowels + consonants
    if (alpha > 0) {
      const ratio = vowels / alpha
      if ((ratio < 0.15 || ratio > 0.75) && /[bcdfghjklmnpqrstvwxyz]{5,}/.test(lower)) return true
    }
    return false
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
      // Analytics: record the attempt without any citizen-identifying values.
      // category is the only dimension reported, plus whether it was recorded.
      trackFormSubmit('report_issue', {
        category: form.category || 'unspecified',
        delivered: data._delivered,
      })

      if (data._delivered === 'mock') {
        // Nothing was recorded. Do not show a success card, do not hand out a
        // reference ID, and do NOT clear the form: the citizen still has to be
        // able to read and copy what they wrote. Previously this fell through to
        // a green "registered" card with a MOCK- id and wiped their grievance.
        setNotRecorded({ reason: data._error, draft: form })
        setResult(null)
        setTrackId('')
        setTrackResult(null)
        return
      }

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
    const ref = trackId.trim().toUpperCase()
    if (!ref) { setTrackError(t.enterRefId); setTrackResult(null); return }
    setTrackLoading(true)
    setTrackError(null)
    try {
      const response = await fetch(`/api/grievance/${encodeURIComponent(ref)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      // Only the frontend is deployed, so /api/grievance/* is a dead path and
      // the lookup lands on the SPA, which answers with an HTML 404 page rather
      // than JSON. Read the body first and branch on what actually came back,
      // because both cases are a 404: a wrong reference ID from a live backend
      // is JSON with an "error" key, and an unreachable backend is HTML. The
      // previous version treated every 404 as "service unavailable", so once a
      // backend was deployed a mistyped ID would have been reported as an
      // outage.
      let data = null
      let unreadable = false
      try {
        data = await response.json()
      } catch {
        unreadable = true
      }

      if (unreadable) throw new Error(t.trackUnavailable)

      if (!response.ok) {
        // A live backend answering 404 with a JSON error is a genuine miss.
        throw new Error(response.status === 404 ? t.trackNotFound : t.trackUnavailable)
      }

      // Backend returns the record under "result"; tolerate a flat shape too.
      const record = data.result || data

      // No value is defaulted. The previous version fell back to
      // status 'Submitted', severity 3/5, category 'Unknown' and location
      // 'Location not specified', so a record missing any of those fields
      // displayed a plausible-looking value that was never measured. A missing
      // field now shows the not-provided label instead.
      setTrackResult({
        reference_id: data.reference_id || ref,
        status: data.status ?? null,
        status_workflow: data.status_workflow !== false,
        submitted_at: data.submitted_at ?? record.submitted_at ?? null,
        details: record.summary ?? record.details ?? null,
        category: record.category ?? null,
        location: record.location ?? null,
        severity_score: record.severity_score ?? null
      })
    } catch (ex) {
      setTrackResult(null)
      setTrackError(ex.message)
    } finally {
      setTrackLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Header subtitle={t.citizenSubtitle} showLangToggle />

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-6 w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[#032B5B]">{t.reportIssue}</h1>
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
                        <select value={form.district} onChange={(e) => { set('district', e.target.value); set('constituency', '') }} className={inputClass} required>
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
                          {constituencies.map((c) => <option key={c} value={c}>{formatConstituencyName(c)}</option>)}
                        </select>
                      ) : (
                        <input type="text" value={form.constituency} onChange={(e) => set('constituency', e.target.value)} className={inputClass} placeholder={t.constituencyPh} required />
                      )}
                    </FormField>

                    <FormField label={t.language} required hint={t.languageHint}>
                      <div className="flex flex-wrap gap-2">
                        {availableLanguages.map((lang) => (
                          <button key={lang} type="button" onClick={() => set('language', lang)}
                            aria-pressed={form.language === lang}
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
                    aria-pressed={form.category === id}
                    className={`text-left p-3 rounded-xl border-2 transition-all ${
                      form.category === id ? 'border-[#F28C0F] bg-orange-50' : 'border-slate-200 hover:border-slate-300'
                    }`}>
                    <span className={`inline-flex items-center justify-center w-9 h-9 rounded-lg mb-1 ${
                      form.category === id ? 'bg-orange-100 text-[#8a4b0a]' : 'bg-[#EAF3FF] text-[#032B5B]'
                    }`}>
                      <Icon name={CATEGORY_ICONS[id]} size={19} />
                    </span>
                    <p className="font-semibold text-[#032B5B] text-xs mt-1 leading-tight">{tc(id)}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{tcd(id)}</p>
                  </button>
                ))}
              </div>
            </Section>

            <Section title={t.location}>
              <div className="space-y-4">
                {/* The GPS button used to sit inside the `locationReady` branch,
                    which is only true once state + district + constituency are
                    already filled. That made the feature circular: the one
                    control that can fill state and district from a coordinate
                    was hidden until those fields were filled by hand. It is now
                    always rendered, and the handler already back-fills state and
                    district from the reverse geocode. */}
                <button type="button" onClick={useMyLocation} disabled={geoLoading}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#032B5B] hover:bg-[#0a4080] text-white text-sm font-medium px-4 py-2.5 rounded-lg disabled:opacity-50">
                  {geoLoading ? t.gpsLoading : <><Icon name='pin' size={16} /> {t.useGps}</>}
                </button>
                {form.geolocation && (
                  <div role="status" aria-live="polite" className="rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-2.5 text-xs text-emerald-900 space-y-1">
                    <p className="font-semibold">
                      ✓ {t.gpsCaptured}
                      {Number.isFinite(form.geolocation.accuracy) && ` · ${describeAccuracy(form.geolocation.accuracy)}`}
                    </p>
                    <p className="font-mono text-[11px] text-emerald-800">
                      {form.geolocation.latitude.toFixed(5)}, {form.geolocation.longitude.toFixed(5)}
                    </p>
                    {gpsInfo?.formatted && (
                      <p className="text-emerald-800">{gpsInfo.formatted}</p>
                    )}
                    {(gpsInfo?.road || gpsInfo?.postOffice) && (
                      <p className="text-emerald-800">
                        {[gpsInfo.road, gpsInfo.postOffice].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    {gpsInfo?.filled?.length > 0 && (
                      <p>{t.gpsFilled}: {gpsInfo.filled.join(', ')}</p>
                    )}
                    {form.geolocation.accuracy > 150 && (
                      <p className="text-amber-800">{t.gpsAccuracyPoor}</p>
                    )}
                  </div>
                )}
                {!locationReady && (
                  <p className="text-sm text-slate-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">{t.locationLockedHint}</p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label={t.village} required={!form.geolocation}>
                    <input type="text" value={form.village} onChange={(e) => set('village', e.target.value)} className={inputClass} placeholder={t.villagePh} required={!form.geolocation} />
                  </FormField>
                  <FormField label={t.ward} required>
                    <input type="text" value={form.ward_block} onChange={(e) => set('ward_block', e.target.value)} className={inputClass} placeholder={t.wardPh} required />
                  </FormField>
                  <FormField label={t.pincode} required>
                    <input type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={form.pincode} onChange={(e) => set('pincode', e.target.value)} className={inputClass} required />
                  </FormField>
                </div>
              </div>
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
                        aria-pressed={form.self_reported_severity === v}
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

            {error && <div role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded-lg mb-4">{error}</div>}

            {/* Nothing was recorded. Say so plainly, keep the text on screen,
                and never issue a reference ID for a grievance the system
                does not hold. */}
            {notRecorded && !result && (
              <div role="alert" className="mb-4 rounded-2xl border border-amber-300 bg-amber-50 p-5">
                <p className="font-bold text-amber-900">{t.notRecordedTitle}</p>
                <p className="text-sm text-amber-900 mt-2">{t.notRecordedLost}</p>
                <p className="text-sm text-amber-900 mt-2">{t.notRecordedNext}</p>
                {notRecorded.reason && (
                  <p className="text-[11px] text-amber-700 mt-3 font-mono break-all">
                    {t.notRecordedError} {notRecorded.reason}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => setNotRecorded(null)}
                  className="mt-4 px-4 py-2 rounded-lg bg-amber-800 text-white text-xs font-semibold"
                >
                  {t.notRecordedRetry}
                </button>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-[#F28C0F] hover:bg-[#e07d0a] disabled:opacity-60 text-[#142944] font-semibold py-3.5 rounded-lg shadow transition-colors">
              {loading ? t.submitting : t.submit}
            </button>
          </form>
        ) : (
          <div className="bg-white rounded-2xl border border-green-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 bg-green-50 text-center border-b border-green-100">
              <div className="text-3xl mb-2">✓</div>
              <p className="font-bold text-green-800">{t.success}</p>
              {/* Only render an ID we actually hold. */}
              {result.reference_id && (
              <p className="text-sm text-green-700 mt-2">{t.refId}: <span className="font-mono font-bold">{result.reference_id}</span></p>
              )}
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

        {/* Always rendered, not gated on {result}.
            It used to appear only after submitting in this browser session, which
            contradicted the receipt copy directly above it ("Save this ID to track
            your grievance status"): anyone who filed yesterday and came back today
            had no way to reach the tracker at all.

            It is a card in the same shell as the grievance form — same white
            surface, same 1px slate border, same radius, same shadow, same padding.
            As a bare <Section> outside any card it inherited :last-child's
            "no border, no padding", so it rendered as a loose uppercase label and
            two orphan controls floating under the form, which is why it read as
            unfinished next to "Your details".

            The result card and the error live inside this block, so an error can
            never appear with no input box on screen to correct.

            mt-6 because this card carries no margin of its own. It is a sibling of
            the form card above (and of the green receipt card after a submission),
            both of which are also white, rounded and bordered — so with no gap the
            three borders touched and the two cards read as one malformed block
            rather than as two things. */}
        <div className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <h2 className="text-sm font-bold text-[#032B5B] uppercase tracking-wide mb-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F28C0F]" aria-hidden="true" />
            {t.trackYourGrievance}
          </h2>
          <p className="text-sm text-slate-500 mb-5 max-w-prose">{t.trackIntro}</p>
          <div className="space-y-4">
            <FormField label={t.refId} hint={t.trackHint}>
              <input
                type="text"
                value={trackId}
                onChange={(e) => setTrackId(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleTrackSubmit(e) }}
                className={inputClass}
                placeholder={t.trackRefExample}
                autoComplete="off"
                spellCheck="false"
              />
            </FormField>
            {/* Dark text on the orange, not white: #F28C0F with white measures
                2.46:1, below the 4.5:1 AA threshold. #142944 on the same orange
                measures 5.97:1, and is what .button--primary already uses, so
                the portal now matches the rest of the design system. */}
            <button type="button" onClick={handleTrackSubmit} disabled={trackLoading}
              className="w-full bg-[#F28C0F] hover:bg-[#e07d0a] disabled:opacity-60 text-[#142944] font-semibold py-3.5 rounded-lg shadow transition-colors">
              {trackLoading ? t.tracking : t.checkStatus}
            </button>
          </div>

          {/* One live region for both outcomes, so a screen reader is told the
              answer instead of only being told that something changed. */}
          <div role="status" aria-live="polite" aria-busy={trackLoading}>
            {trackError && (
              <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded-lg">
                {trackError}
              </div>
            )}

            {trackResult && (
              <div className="bg-white rounded-2xl border border-blue-200 shadow-sm overflow-hidden mt-4">
                <div className="px-6 py-5 bg-blue-50 text-center border-b border-blue-100">
                  <p className="font-bold text-blue-800">{t.trackingResult}</p>
                  <p className="text-sm text-blue-700 mt-2">{t.refId}: <span className="font-mono font-bold">{trackResult.reference_id}</span></p>
                </div>

                {/* The system has no status lifecycle: nothing writes a status and
                    nothing advances one. Saying so is more useful to a citizen than
                    a bare "recorded" with no explanation. */}
                {!trackResult.status_workflow && (
                  <p className="px-6 pt-4 text-sm text-slate-600">{t.trackNoWorkflow}</p>
                )}

                {/* Every cell always renders. Conditionally emitting the submitted-on
                    cell left an odd number of children in a two-column grid, so the
                    last row came out with one cell and a hole beside it. */}
                <div className="p-6 grid grid-cols-2 gap-3 text-sm">
                  <RF
                    label={t.submittedOn}
                    value={trackResult.submitted_at ? formatSubmittedAt(trackResult.submitted_at) : t.notProvided}
                  />
                  <RF label={t.status} value={statusLabel(trackResult.status, t)} />
                  <RF label={t.category} value={trackResult.category ?? t.notProvided} />
                  <RF label={t.locationLabel} value={trackResult.location ?? t.notProvided} />
                  <RF
                    label={t.severityLabel}
                    value={trackResult.severity_score == null ? t.notProvided : `${trackResult.severity_score}/5`}
                  />
                  <div className="col-span-2 bg-slate-50 rounded-lg p-3">
                    <RF label={t.summaryLabel} value={trackResult.details ?? t.notProvided} />
                  </div>
                </div>
                <div className="px-6 pb-6">
                  <button type="button" onClick={() => {
                    setTrackResult(null)
                    setTrackError(null)
                    setTrackId('')
                  }} className="w-full py-2.5 rounded-lg bg-[#032B5B] text-white text-sm font-semibold">{t.trackAnother}</button>
                </div>
              </div>
            )}
          </div>
        </div>
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

/**
 * Render a submitted_at timestamp for a reader.
 *
 * The backend writes an ISO 8601 string with an offset ("2026-09-03T10:05:09
 * +05:30"). It is formatted in the viewer's own locale and zone rather than
 * being shown raw, because a raw offset string reads as noise to a citizen
 * checking on their grievance.
 *
 * Returns the input unchanged if it cannot be parsed, so an unexpected format
 * degrades to something readable rather than to "Invalid Date".
 */
function formatSubmittedAt(value) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

/**
 * Human label for a status value from the API.
 *
 * The endpoint returns the enum "recorded". Rendering it raw put a lowercase
 * machine token in front of a citizen. The translator is passed in rather than
 * read from a hook, because this is a plain function and `t` only exists inside
 * the component.
 *
 * An unrecognised status is passed through rather than replaced, so a value this
 * build has never seen is still shown instead of being silently hidden.
 */
const STATUS_KEYS = { recorded: 'statusRecorded' }

function statusLabel(status, t) {
  if (status == null || status === '') return t.notProvided
  const key = STATUS_KEYS[String(status).toLowerCase()]
  return key ? t[key] : String(status)
}
