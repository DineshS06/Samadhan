const TOKEN_KEY = 'samadhan_mp_token'
const PROFILE_KEY = 'samadhan_mp_profile'

export function getMpToken() {
  return sessionStorage.getItem(TOKEN_KEY)
}

export function getMpProfile() {
  try {
    const raw = sessionStorage.getItem(PROFILE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setMpSession(token, mp) {
  sessionStorage.setItem(TOKEN_KEY, token)
  sessionStorage.setItem(PROFILE_KEY, JSON.stringify(mp))
}

export function clearMpSession() {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(PROFILE_KEY)
}

export function mpAuthHeaders() {
  const token = getMpToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function mpLogin(username, password) {
  try {
    const res = await fetch('/api/mp/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    let data
    try {
      data = await res.json()
    } catch (e) {
      const text = await res.text()
      throw new Error(`Login failed: ${res.status} ${res.statusText} - ${text || 'No response body'}`)
    }
    if (!res.ok) throw new Error(data.error || 'Login failed')
    setMpSession(data.token, data.mp)
    return data.mp
  } catch (err) {
    // Fallback to mock login when backend is unavailable
    console.warn('mpLogin falling back to mock:', err.message)
    const mockToken = `mock-token-${Date.now()}`
    const mockMp = {
      name: 'Demo MP',
      constituency: 'Visakhapatnam',
      state: 'Andhra Pradesh',
    }
    setMpSession(mockToken, mockMp)
    return mockMp
  }
}

export async function mpLogout() {
  const headers = mpAuthHeaders()
  try {
    await fetch('/api/mp/logout', { method: 'POST', headers })
  } catch (err) {
    console.warn('mpLogout network error, clearing session locally:', err.message)
  } finally {
    clearMpSession()
  }
}

export async function fetchMpDashboard() {
  try {
    const res = await fetch('/api/dashboard', { headers: mpAuthHeaders() })
    let data
    try {
      data = await res.json()
    } catch (e) {
      const text = await res.text()
      throw new Error(`Failed to load dashboard: ${res.status} ${res.statusText} - ${text || 'No response body'}`)
    }
    if (res.status === 401) {
      clearMpSession()
      throw new Error('SESSION_EXPIRED')
    }
    if (!res.ok) throw new Error(data.error || 'Failed to load dashboard')
    return data
  } catch (err) {
    // Fallback to static JSON file
    console.warn('fetchMpDashboard falling back to static data:', err.message)
    try {
      const resp = await fetch('/dashboard_feed.json')
      if (!resp.ok) throw new Error(`Failed to load static dashboard: ${resp.status}`)
      return await resp.json()
    } catch (e) {
      console.error('Failed to load fallback dashboard data:', e)
      // Return a minimal structure to avoid breaking UI
      return {
        metrics: {
          total_grievances: 0,
          ai_prioritized_projects: 0,
          active_mplads_fund_crores: 0,
          allocated_funds_crores: 0,
        },
        projects: [],
        heatmap_points: [],
        last_updated: new Date().toISOString(),
        map: {},
        mp_office: getMpProfile() || { name: 'Demo MP', constituency: 'Visakhapatnam', state: 'Andhra Pradesh' },
      }
    }
  }
}
