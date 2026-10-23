import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useLanguage } from '../i18n/LanguageContext'

const SEVERITY_COLORS = { high: '#EF4444', medium: '#F28C0F', low: '#22C55E' }

// Approximate centre coordinates for Indian Lok Sabha constituencies.
// Used to centre the map on the MP's constituency when mapConfig.center is not
// provided. Constituencies not listed here fall back to INDIA_CENTER.
const CONSTITUENCY_CENTERS = {
  'Visakhapatnam': [17.948925, 83.231312],
  'Mumbai South': [18.9389, 72.8354],
  'Delhi': [28.6139, 77.2090],
  'Bangalore South': [12.9716, 77.5946],
  'Chennai South': [13.0827, 80.2707],
  'Kolkata North': [22.5726, 88.3639],
  'Hyderabad': [17.3850, 78.4867],
  'Pune': [18.5204, 73.8567],
  'Ahmedabad West': [23.0225, 72.5714],
  'Lucknow': [26.8467, 80.9462],
  'Patna': [25.5941, 85.1376],
  'Jaipur': [26.9124, 75.7873],
  'Bhopal': [23.2599, 77.4126],
  'Chandigarh': [30.7333, 76.7794],
  'Shillong': [25.5788, 91.8933],
  'Aizawl': [23.7271, 92.7176],
  'Agartala': [23.8315, 91.2868],
  'Imphal': [24.8170, 93.9368],
  'Kohima': [25.6751, 94.1106],
  'Itanagar': [27.0844, 93.6073],
  'Panaji': [15.4909, 73.8278],
  'Port Blair': [11.6603, 92.7439],
  'Kavarrati': [10.5667, 72.6403],
}
// Geographic bounds of India (mainland + islands). Used to validate that
// marker coordinates are actually inside India before plotting.
const INDIA_LAT_MIN = 6.0
const INDIA_LAT_MAX = 37.5
const INDIA_LNG_MIN = 68.0
const INDIA_LNG_MAX = 98.0
const INDIA_CENTER = [22.0, 79.0]
const DEFAULT_ZOOM = 11

// Convert a numeric severity score (1-5) to a label for colour mapping.
function severityLabelFromScore(score) {
  if (score == null || score === '') return 'low'
  const s = Number(score)
  if (Number.isNaN(s)) return 'low'
  if (s >= 4) return 'high'
  if (s >= 3) return 'medium'
  return 'low'
}

function pinIcon(severity) {
  const color = SEVERITY_COLORS[severity] || SEVERITY_COLORS.low
  return L.divIcon({
    className: '',
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.35)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })
}

// Validate that a lat/lng pair falls inside India. Points outside are skipped
// so stray or test coordinates never plot outside the country.
function isInsideIndia(lat, lng) {
  const la = Number(lat)
  const lo = Number(lng)
  return (
    Number.isFinite(la) &&
    Number.isFinite(lo) &&
    la >= INDIA_LAT_MIN &&
    la <= INDIA_LAT_MAX &&
    lo >= INDIA_LNG_MIN &&
    lo <= INDIA_LNG_MAX
  )
}

export default function ConstituencyMap({ points = [], mapConfig, mpOffice, focusPointId, onMarkerClick }) {
  const { t } = useLanguage()
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef(new Map()) // keyed by reference_id or label
  const boundaryLayerRef = useRef(null)

  const constituency = mpOffice?.constituency || mapConfig?.constituency || 'Visakhapatnam'
  const configuredCenter = mapConfig?.center
  const centerLat = configuredCenter?.[0] ?? CONSTITUENCY_CENTERS[constituency]?.[0] ?? INDIA_CENTER[0]
  const centerLng = configuredCenter?.[1] ?? CONSTITUENCY_CENTERS[constituency]?.[1] ?? INDIA_CENTER[1]
  const zoom = mapConfig?.zoom ?? DEFAULT_ZOOM
  // Only fetch a boundary if mapConfig provides a real URL. Dead API paths
  // (e.g. /api/geo/...) are skipped so the map still renders without a boundary.
  const boundaryUrl = mapConfig?.boundary_url && !String(mapConfig.boundary_url).startsWith('/api/')
    ? mapConfig.boundary_url
    : null

  // Initialise map once. Subsequent prop changes (points, boundaryUrl) are handled
  // by separate effects that mutate the existing map — no full rebuild.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = L.map(containerRef.current, { scrollWheelZoom: true }).setView([centerLat, centerLng], zoom)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      // Leaflet injects this string as HTML, but '&copy;' in a JS string literal is
      // not an HTML entity to the browser: the map credit rendered literally as
      // "&copy; OpenStreetMap". Use the character itself.
      attribution: '\u00A9 OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map)
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
      markersRef.current.clear()
      boundaryLayerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // React to centre/zoom prop changes after mount.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    map.setView([centerLat, centerLng], zoom)
  }, [centerLat, centerLng, zoom])

  // Boundary layer — only fetch when boundaryUrl is set; skip otherwise so the
  // map renders without a boundary instead of hitting a dead API path. The
  // existing layer is always removed first so a previous boundary is cleaned up
  // when the URL changes to null or to a different value.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const ctrl = new AbortController()

    if (boundaryLayerRef.current) {
      map.removeLayer(boundaryLayerRef.current)
      boundaryLayerRef.current = null
    }

    if (!boundaryUrl) return

    fetch(boundaryUrl, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((geojson) => {
        if (!mapRef.current) return
        const layer = L.geoJSON(geojson, {
          style: { color: '#032B5B', weight: 2.5, fillColor: '#032B5B', fillOpacity: 0.08 },
        }).addTo(map)
        boundaryLayerRef.current = layer
        try {
          map.fitBounds(layer.getBounds(), { padding: [24, 24] })
        } catch { /* keep default view */ }
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') { /* swallow network errors */ }
      })

    return () => ctrl.abort()
  }, [boundaryUrl])

  // Marker layer — diff by reference_id, only add/remove what changed.
  // Severity colour is derived from point.severity if present, otherwise from
  // point.severity_score (numeric 1-5). Points outside India are skipped.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const nextKeys = new Set()

    points.forEach((point) => {
      if (!isInsideIndia(point.lat, point.lng)) return
      const key = point.reference_id || point.label
      nextKeys.add(key)
      const existing = markersRef.current.get(key)
      if (existing) {
        existing.setLatLng([point.lat, point.lng])
        return
      }
      // Derive severity: prefer explicit label, otherwise derive from score.
      const severity = point.severity || severityLabelFromScore(point.severity_score)
      const marker = L.marker([point.lat, point.lng], { icon: pinIcon(severity) })
      const gpsLabel = point.source === 'citizen_gps' ? t.mapGpsPin : t.mapLocalityPin
      const displayScore = point.severity_score ?? '—'
      marker.bindPopup(`
        <div style="font-family:system-ui;font-size:12px;min-width:160px">
          <strong style="color:#032B5B">${point.reference_id || point.label}</strong><br/>
          <span style="color:#64748b">${point.category || ''}</span><br/>
          <span>${point.label}</span><br/>
          <span style="color:${SEVERITY_COLORS[severity] || '#F28C0F'}">${t.severityLabel}: ${displayScore}/5</span><br/>
          <span style="font-size:10px;color:#94a3b8">${gpsLabel}</span>
        </div>`)
      if (onMarkerClick) marker.on('click', () => onMarkerClick(point))
      marker.addTo(map)
      markersRef.current.set(key, marker)
    })

    // Remove markers no longer in the points list.
    for (const [key, marker] of markersRef.current) {
      if (!nextKeys.has(key)) {
        map.removeLayer(marker)
        markersRef.current.delete(key)
      }
    }
  }, [points, t.mapGpsPin, t.mapLocalityPin, t.severityLabel, onMarkerClick])

  // Pan/zoom to the focused point when focusPointId changes externally.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !focusPointId) return
    const marker = markersRef.current.get(focusPointId)
    if (!marker) return
    map.setView(marker.getLatLng(), Math.max(map.getZoom(), 13), { animate: true })
    marker.openPopup()
  }, [focusPointId])

  const validPoints = points.filter((p) => isInsideIndia(p.lat, p.lng))
  const gpsCount = validPoints.filter((p) => p.source === 'citizen_gps').length
  const localityCount = validPoints.length - gpsCount
  const boundaryMissing = !boundaryUrl

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm h-full flex flex-col">
      <div className="px-5 py-4 border-b border-slate-200">
        <h2 className="text-base font-bold text-[#032B5B]">{t.mapTitle}</h2>
        <p className="text-xs text-slate-500 mt-1">
          {t.mapConstituencyScope}: <span className="font-semibold text-[#032B5B]">{constituency}</span>
        </p>
        <p className="text-[10px] text-slate-400 mt-0.5">
          {validPoints.length} {t.mapIssuesMapped}
          {gpsCount > 0 && ` · ${gpsCount} ${t.mapGpsCount}`}
          {localityCount > 0 && ` · ${localityCount} ${t.mapLocalityCount}`}
          {boundaryMissing && ` · ${t.mapNoBoundary || 'Constituency boundary data not available'}`}
        </p>
      </div>
      <div className="flex-1 p-4 min-h-[360px]">
        <div ref={containerRef} className="w-full h-[340px] rounded-lg overflow-hidden border border-slate-200 z-0" />
        {boundaryMissing && (
          <div className="mt-2 p-2 text-xs text-amber-700 bg-amber-50 rounded border border-amber-200">
            {t.mapBoundaryNote || 'Constituency boundary overlay not available — showing grievance points only.'}
          </div>
        )}
        <div className="flex gap-4 mt-3 justify-center text-xs text-slate-600">
          <span><span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-1" />{t.mapHigh}</span>
          <span><span className="inline-block w-3 h-3 rounded-full bg-orange-400 mr-1" />{t.mapMedium}</span>
          <span><span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-1" />{t.mapLow}</span>
        </div>
      </div>
    </div>
  )
}
