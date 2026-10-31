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

function firstOf(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

/**
 * Takes the most accurate fix available within a short window instead of
 * accepting the first one.
 *
 * Why: a phone's first fix is usually a coarse network location, often several
 * hundred metres or a few kilometres off. Handing that to the reverse geocoder
 * fills the form with the wrong village. Watching for a few seconds and keeping
 * the smallest accuracy radius usually gets a GPS fix an order of magnitude
 * better, and it costs the citizen a couple of seconds rather than a wrong
 * address.
 *
 * Resolves as soon as a fix of `targetAccuracy` metres or better arrives, or
 * with the best fix seen when the window closes.
 *
 * @returns {Promise<GeolocationPosition>}
 */
export function getBestPosition({ windowMs = 12000, targetAccuracy = 25 } = {}) {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(Object.assign(new Error('unsupported'), { code: 0 }))
      return
    }

    let best = null
    let settled = false
    let watchId = null
    let timer = null

    const finish = (fn, value) => {
      if (settled) return
      settled = true
      if (watchId != null) navigator.geolocation.clearWatch(watchId)
      if (timer != null) clearTimeout(timer)
      fn(value)
    }

    timer = setTimeout(() => {
      if (best) finish(resolve, best)
      else finish(reject, Object.assign(new Error('timeout'), { code: 3 }))
    }, windowMs)

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (!best || pos.coords.accuracy < best.coords.accuracy) best = pos
        if (pos.coords.accuracy <= targetAccuracy) finish(resolve, pos)
      },
      (err) => {
        // A later failure should not throw away a usable earlier fix.
        if (best) finish(resolve, best)
        else finish(reject, err)
      },
      { enableHighAccuracy: true, timeout: windowMs, maximumAge: 0 },
    )
  })
}

/**
 * @param {{latitude: number, longitude: number}} geo
 * @returns {Promise<object | null>}
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
  url.searchParams.set('lat', String(la))
  url.searchParams.set('lon', String(lo))
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('zoom', '18')

  try {
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } })
    if (!res.ok) return null
    const data = await res.json()
    const a = data.address || {}

    // Nominatim's field names vary by place. A village is a `village`, an urban
    // locality is a `suburb` or `neighbourhood`, and a municipal ward may only
    // appear as `city_district` or `quarter`. Falling through the list is what
    // makes the autofill work outside major cities.
    const village = firstOf(
      a.village, a.hamlet, a.town, a.suburb, a.quarter,
      a.neighbourhood, a.city_district, a.city, a.municipality,
    )
    const ward = firstOf(a.ward, a.suburb, a.quarter, a.neighbourhood, a.city_district)
    const block = firstOf(a.subdistrict, a.state_district, a.county, a.district)
    const district = firstOf(a.state_district, a.county, a.district, a.city)
    const road = firstOf(a.road, a.pedestrian, a.street, a.residential, a.path)
    const postOffice = firstOf(a.post_office)

    return {
      inIndia: true,
      latitude: la,
      longitude: lo,
      village,
      ward,
      block,
      district,
      state: firstOf(a.state, a.region),
      pincode: firstOf(a.postcode, a.postal_code),
      road,
      postOffice,
      // A single human-readable line, shown to the citizen so they can see what
      // was resolved and correct it if the pin is wrong.
      formatted: firstOf(data.display_name),
      placeType: firstOf(data.type, data.category),
      osm: data.osm_type && data.osm_id ? `${data.osm_type}/${data.osm_id}` : '',
      raw: data,
    }
  } catch {
    return null
  }
}

/**
 * "±12 m" style measurement.
 *
 * Deliberately numeric only: the surrounding labels are translated, and an
 * English word like "coarse" here would leak into the Hindi UI. The
 * plain-language warning already has its own translated string.
 */
export function describeAccuracy(meters) {
  if (!Number.isFinite(meters)) return ''
  if (meters < 1000) return `±${Math.round(meters)} m`
  return `±${(meters / 1000).toFixed(1)} km`
}
