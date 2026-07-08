/** Backend API base — uses Vite proxy in dev when VITE_API_URL is unset */
export const API_BASE = import.meta.env.VITE_API_URL || ''

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
      // If response is not JSON, treat as error and fallback to mock
      const text = await res.text()
      console.warn('submitGrievance: non-JSON response', text)
      throw new Error(`Invalid response: ${text}`)
    }
    if (!res.ok) throw new Error(data.error || 'Submission failed')
    return data
  } catch (err) {
    // Fallback to mock submission when backend is unavailable
    console.warn('submitGrievance falling back to mock:', err.message)
    const mockResponse = {
      reference_id: `MOCK-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      result: {
        ...payload,
        category: payload.category,
        location: payload.location,
        severity_score: payload.severity_score || 3,
        summary: payload.summary,
        infrastructure_gap_score: payload.infrastructure_gap_score || 0,
      },
    }
    return mockResponse
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

export async function fetchFormConfig() {
  try {
    const res = await fetch(`${API_BASE}/api/config`)
    if (res.ok) return res.json()
  } catch {
    // fallback to local config
  }
  return null
}
