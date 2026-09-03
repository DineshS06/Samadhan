/**
 * Reverse-geocode via OpenStreetMap Nominatim.
 * Free, no key, but rate-limited to ~1 req/s. We debounce callers and add a User-Agent.
 * Docs: https://nominatim.org/release-docs/develop/api/Reverse/
 */

const ENDPOINT = 'https://nominatim.openstreetmap.org/reverse'
let lastCallAt = 0

async function rateLimit() {
  const now = Date.now()
  const wait = Math.max(0, 1100 - (now - lastCallAt))
  if (wait > 0) await new Promise((r) => setTimeout(r, wait))
  lastCallAt = Date.now()
}

/**
 * @param {{latitude: number, longitude: number}} geo
 * @returns {Promise<{village?: string, ward?: string, pincode?: string, district?: string, state?: string, raw?: any} | null>}
 */
export async function reverseGeocode({ latitude, longitude }) {
  if (latitude == null || longitude == null) return null
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
