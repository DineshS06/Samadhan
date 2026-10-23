/**
 * Reverse-geocode via OpenStreetMap Nominatim.
 * Free, no key, but rate-limited to ~1 req/s. We debounce callers and add a User-Agent.
 * Docs: https://nominatim.openstreetmap.org/release-docs/develop/api/Reverse/
 */

const ENDPOINT = 'https://nominatim.openstreetmap.org/reverse'
let lastCallAt = 0

// Geographic bounds of India (mainland + islands). GPS fixes outside these
// bounds are rejected so stray coordinates never plot outside the country.
const INDIA_LAT_MIN = 6.0
const INDIA_LAT_MAX = 37.5
const INDIA_LNG_MIN = 68.0
const INDIA_LNG_MAX = 98.0

async function rateLimit() {
  const now = Date.now()
  const wait = Math.max(0, 1100 - (now - lastCallAt))
  if (wait > 0) await new Promise((r) => setTimeout(r, wait))
  lastCallAt = Date.now()
}

/**
 * @param {{latitude: number, longitude: number}} geo
 * @returns {Promise<{village?: string, ward?: string, pincode?: string, district?: string, state?: string, raw?: any, inIndia?: boolean} | null>}
 */
export async function reverseGeocode({ latitude, longitude }) {
  if (latitude == null || longitude == null) return null
  const la = Number(latitude)
  const lo = Number(longitude)
  if (!Number.isFinite(la) || !Number.isFinite(lo)) return null
  // Reject coordinates outside India
  if (la < INDIA_LAT_MIN || la > INDIA_LAT_MAX || lo < INDIA_LNG_MIN || lo > INDIA_LNG_MAX) {
    return { inIndia: false, latitude: la, longitude: lo }
  }
  await rateLimit()
  const url = new URL(ENDPOINT)
  url.searchParams.set('lat', String(latitude))
  url.searchParams.set('lon', String(longitude))
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('zoom', '18')

  try {
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'en' },
    })
    if (!res.ok) return null
    const data = await res.json()
    const a = data.address || {}
    return {
      inIndia: true,
      latitude: la,
      longitude: lo,
      village:
        a.village || a.town || a.suburb || a.hamlet || a.neighbourhood || a.city || '',
      ward: a.suburb || a.neighbourhood || '',
      pincode: a.postcode || '',
      district: a.county || a.state_district || a.district || '',
      state: a.state || '',
      raw: data,
    }
  } catch {
    return null
  }
}
