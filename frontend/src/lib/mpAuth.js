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
  const res = await fetch('/api/mp/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Login failed')
  setMpSession(data.token, data.mp)
  return data.mp
}

export async function mpLogout() {
  const headers = mpAuthHeaders()
  try {
    await fetch('/api/mp/logout', { method: 'POST', headers })
  } finally {
    clearMpSession()
  }
}

export async function fetchMpDashboard() {
  const res = await fetch('/api/dashboard', { headers: mpAuthHeaders() })
  const data = await res.json()
  if (res.status === 401) {
    clearMpSession()
    throw new Error('SESSION_EXPIRED')
  }
  if (!res.ok) throw new Error(data.error || 'Failed to load dashboard')
  return data
}
