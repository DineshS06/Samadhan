import { STATE_CONSTITUENCIES } from '../data/constituencyData.js'
import { formatConstituencyName } from '../data/districtConstituencies.js'

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

const SHARED_PASSWORD = 'samadhan2026'

// The four usernames published before every seat had an account. Kept so old
// notes and bookmarks still sign in.
const LEGACY_ALIASES = {
  'mp.visakhapatnam': ['Andhra Pradesh', 'VISAKHAPATNAM'],
  'mp.hyderabad': ['Telangana', 'HYDERABAD'],
  'mp.delhi': ['Delhi', 'NEW DELHI'],
  'mp.lucknow': ['Uttar Pradesh', 'LUCKNOW'],
}

/** Lowercase and drop everything that is not a letter or digit. */
function normalise(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

function findSeat(state, constituency) {
  const seats = STATE_CONSTITUENCIES[state]
  if (!Array.isArray(seats)) return null
  const wanted = normalise(constituency)
  return seats.find((seat) => normalise(seat) === wanted) || null
}

/**
 * Resolve either `{ state, constituency }` or a username to a real seat.
 *
 * Every seat can be named as `mp.<seat>` when the name is unique across India,
 * or `mp.<state>.<seat>` when it is not (Maharajganj, Aurangabad, Hamirpur).
 */
function resolveSeat(identifier) {
  if (identifier && typeof identifier === 'object') {
    const seat = findSeat(identifier.state, identifier.constituency)
    return seat ? { state: identifier.state, constituency: seat } : null
  }

  const username = String(identifier || '').trim().toLowerCase()
  if (LEGACY_ALIASES[username]) {
    const [state, constituency] = LEGACY_ALIASES[username]
    return { state, constituency }
  }
  if (!username.startsWith('mp.')) return null

  const rest = username.slice(3)
  if (rest.includes('.')) {
    const stateToken = rest.split('.')[0]
    const seatToken = rest.split('.').slice(1).join('.')
    const state = Object.keys(STATE_CONSTITUENCIES)
      .find((name) => normalise(name) === normalise(stateToken))
    if (!state) return null
    const seat = findSeat(state, seatToken)
    return seat ? { state, constituency: seat } : null
  }

  const matches = []
  for (const [state, seats] of Object.entries(STATE_CONSTITUENCIES)) {
    const seat = seats.find((name) => normalise(name) === normalise(rest))
    if (seat) matches.push({ state, constituency: seat })
  }
  return matches.length === 1 ? matches[0] : null
}

/**
 * Credential check used only when there is no backend at all.
 *
 * This is not real authentication: the password is printed on the login page.
 * It exists so the form behaves like a login — a wrong password is rejected —
 * instead of accepting anything. Every one of the 543 seats resolves here, so
 * the static build offers the same seats as the Flask backend.
 */
function localLogin(identifier, password) {
  const seat = resolveSeat(identifier)
  if (!seat || password !== SHARED_PASSWORD) {
    throw new Error('Invalid constituency or password')
  }
  const mp = {
    name: 'MP Office',
    constituency: formatConstituencyName(seat.constituency),
    state: seat.state,
  }
  setMpSession(`local-${Date.now()}`, mp)
  return mp
}

/**
 * Sign in an MP office.
 *
 * The previous version wrapped the whole request in one try/catch and minted a
 * mock session in the catch, so three different failures all granted access:
 * a wrong password, a 401 from a backend that correctly rejected the login, and
 * a static host answering /api/* with index.html. A login that cannot fail is
 * not a login, and a backend rejection must never be turned into a session.
 */
export async function mpLogin(identifier, password) {
  const isSeat = identifier && typeof identifier === 'object'
  const body = isSeat
    ? { state: identifier.state, constituency: identifier.constituency, password }
    : { username: identifier, password }

  let res
  try {
    res = await fetch('/api/mp/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    // No network at all: fall back to the published shared account.
    return localLogin(identifier, password)
  }

  const type = res.headers.get('content-type') || ''
  if (!type.includes('application/json')) {
    // A static host rewrites unknown paths to index.html. That means "no
    // backend", not "wrong password".
    return localLogin(identifier, password)
  }

  let data
  try {
    data = await res.json()
  } catch {
    throw new Error('The login service returned an unreadable response')
  }
  if (!res.ok) throw new Error(data.error || 'Invalid constituency or password')
  setMpSession(data.token, data.mp)
  return data.mp
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

const ZERO_METRICS = {
  total_grievances: 0,
  ai_prioritized_projects: 0,
  active_mplads_fund_crores: 0,
  allocated_funds_crores: 0,
}

function sameSeat(left, right) {
  return normalise(left) === normalise(right)
}

/**
 * Scope the committed fixture to the signed-in seat.
 *
 * `/dashboard_feed.json` is a Visakhapatnam sample. On the static build every
 * seat reads that file, so without this a Karimnagar office would see
 * Visakhapatnam's header, projects and counts. For any other seat return the
 * same structure with honest zeros and no projects; the map still draws the
 * right boundary because it reads the per-seat index.
 */
function scopeStaticFeed(data, profile) {
  if (!profile || sameSeat(data?.mp_office?.constituency, profile.constituency)) {
    return data
  }
  return {
    ...data,
    metrics: { ...ZERO_METRICS },
    projects: [],
    heatmap_points: [],
    mp_office: { ...profile, name: profile.name || 'MP Office' },
    map: {
      ...(data?.map || {}),
      constituency: profile.constituency,
      state: profile.state,
      center: undefined,
      zoom: undefined,
      bounds: undefined,
    },
    _dataSource: 'static-empty',
  }
}

/**
 * Fetch the MP dashboard feed.
 *
 * Returns `{ ...feed, _dataSource }` so the UI can say where the numbers came
 * from. Previously the fallback was silent: on the deployed site /api/* is a
 * dead path, so every visit showed demo counts rendered exactly like live ones.
 * That reads as real data about a real constituency, which it is not.
 *
 * _dataSource is one of:
 *   'live'          - the Flask backend answered
 *   'static'        - fell back to the committed fixture for the same seat
 *   'static-empty'  - the fixture belongs to another seat; counts are zeroed
 *   'empty'         - nothing could be loaded; zeroed structure
 */
export async function fetchMpDashboard() {
  // Read the seat before the request: a 401 clears the session, and the
  // fallback still needs to know which seat the office signed in as.
  const profile = getMpProfile()
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
    return { ...data, _dataSource: 'live' }
  } catch (err) {
    // Fallback to static JSON file
    console.warn('fetchMpDashboard falling back to static data:', err.message)
    try {
      const resp = await fetch('/dashboard_feed.json')
      if (!resp.ok) throw new Error(`Failed to load static dashboard: ${resp.status}`)
      const data = await resp.json()
      const scoped = scopeStaticFeed(data, profile)
      return { ...scoped, _dataSource: scoped._dataSource || 'static' }
    } catch (e) {
      console.error('Failed to load fallback dashboard data:', e)
      // Return a minimal structure to avoid breaking UI
      return {
        metrics: { ...ZERO_METRICS },
        projects: [],
        heatmap_points: [],
        last_updated: new Date().toISOString(),
        map: {},
        mp_office: profile || { name: 'MP Office', constituency: 'Visakhapatnam', state: 'Andhra Pradesh' },
        _dataSource: 'empty',
      }
    }
  }
}
