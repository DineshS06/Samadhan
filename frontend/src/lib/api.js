/** Backend API base — uses Vite proxy in dev when VITE_API_URL is unset */
export const API_BASE = import.meta.env.VITE_API_URL || ''

/**
 * Submit a citizen grievance.
 *
 * Returns `_delivered: 'live' | 'mock'` so the caller can tell the citizen
 * whether anything was actually recorded.
 *
 * This matters: only the frontend is deployed, so on the live site /api/* is a
 * dead path. Previously every failure fell back to a MOCK-… response and the UI
 * showed a green "registered" card with a reference ID, wiped the form, and
 * lost the citizen's grievance entirely. A mock receipt is not a receipt.
 *
 * @returns {Promise<{reference_id: string, result: object, _delivered: 'live'|'mock', _error?: string}>}
 */
export async function submitGrievance(payload) {
  try {
    const res = await fetch(`${API_BASE}/api/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    let data
    try {
      data = await res.json()
    } catch (e) {
      // If response is not JSON, treat as error and fall through to the
      // not-recorded path below.
      const text = await res.text()
      console.warn('submitGrievance: non-JSON response', text)
      throw new Error(`Invalid response: ${text}`)
    }
    if (!res.ok) throw new Error(data.error || 'Submission failed')
    if (!data.reference_id) throw new Error('Backend accepted the request but returned no reference ID')
    return { ...data, _delivered: 'live' }
  } catch (err) {
    // No backend, or the backend refused it. Keep the payload so the caller can
    // show the citizen what they wrote and offer a copy path, but never present
    // this as a successful registration.
    console.warn('submitGrievance could not deliver:', err.message)
    return {
      reference_id: null,
      result: {
        ...payload,
        category: payload.category,
        location: payload.location,
        severity_score: payload.severity_score || 3,
        summary: payload.summary,
        infrastructure_gap_score: payload.infrastructure_gap_score || 0,
      },
      _delivered: 'mock',
      _error: err.message,
    }
  }
}

export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE}/api/health`)
    const data = await res.json()
    return data
  } catch (err) {
    console.warn('checkBackendHealth failed, assuming unhealthy:', err.message)
    return { status: 'offline' }
  }
}

// fetchFormConfig() was removed: it called GET /api/config, which no backend
// route serves, and no caller used it. The form is driven by src/data/formConfig.js
// and src/i18n/translations.js, so there was nothing to fetch.
