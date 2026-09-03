import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useLanguage } from '../i18n/LanguageContext'

const SEVERITY_COLORS = { high: '#EF4444', medium: '#F28C0F', low: '#22C55E' }
const DEFAULT_CENTER = [17.948925, 83.231312]
const DEFAULT_ZOOM = 11

function pinIcon(severity) {
  const color = SEVERITY_COLORS[severity] || SEVERITY_COLORS.medium
  return L.divIcon({
    className: '',
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.35)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })
}

export default function ConstituencyMap({ points = [], mapConfig, mpOffice, focusPointId, onMarkerClick }) {
  const { t } = useLanguage()
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef(new Map()) // keyed by reference_id or label
  const boundaryLayerRef = useRef(null)

  const constituency = mpOffice?.constituency || mapConfig?.constituency || 'Visakhapatnam'
  const centerLat = mapConfig?.center?.[0] ?? DEFAULT_CENTER[0]
  const centerLng = mapConfig?.center?.[1] ?? DEFAULT_CENTER[1]
  const zoom = mapConfig?.zoom ?? DEFAULT_ZOOM
  const boundaryUrl = mapConfig?.boundary_url || '/api/geo/constituency/by-name/Visakhapatnam?state=Andhra%20Pradesh'

  // Initialise map once. Subsequent prop changes (points, boundaryUrl) are handled
  // by separate effects that mutate the existing map — no full rebuild.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = L.map(containerRef.current, { scrollWheelZoom: true }).setView([centerLat, centerLng], zoom)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
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

  // Boundary layer — only refetch when the boundary URL actually changes; abort stale fetches.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const ctrl = new AbortController()

    if (boundaryLayerRef.current) {
      map.removeLayer(boundaryLayerRef.current)
      boundaryLayerRef.current = null
    }

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
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const nextKeys = new Set()

    points.forEach((point) => {
      if (point.lat == null || point.lng == null) return
      const key = point.reference_id || point.label
      nextKeys.add(key)
      const existing = markersRef.current.get(key)
      if (existing) {
        existing.setLatLng([point.lat, point.lng])
        return
      }
      const marker = L.marker([point.lat, point.lng], { icon: pinIcon(point.severity) })
      const gpsLabel = point.source === 'citizen_gps' ? t.mapGpsPin : t.mapLocalityPin
      marker.bindPopup(`
        <div style="font-family:system-ui;font-size:12px;min-width:160px">
          <strong style="color:#032B5B">${point.reference_id || point.label}</strong><br/>
          <span style="color:#64748b">${point.category || ''}</span><br/>
          <span>${point.label}</span><br/>
          <span style="color:${SEVERITY_COLORS[point.severity] || '#F28C0F'}">${t.severityLabel}: ${point.severity_score || '—'}/5</span><br/>
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

  const gpsCount = points.filter((p) => p.source === 'citizen_gps').length
  const localityCount = points.length - gpsCount

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm h-full flex flex-col">
      <div className="px-5 py-4 border-b border-slate-200">
        <h2 className="text-base font-bold text-[#032B5B]">{t.mapTitle}</h2>
        <p className="text-xs text-slate-500 mt-1">
          {t.mapConstituencyScope}: <span className="font-semibold text-[#032B5B]">{constituency}</span>
        </p>
        <p className="text-[10px] text-slate-400 mt-0.5">
          {points.length} {t.mapIssuesMapped}
          {gpsCount > 0 && ` · ${gpsCount} ${t.mapGpsCount}`}
          {localityCount > 0 && ` · ${localityCount} ${t.mapLocalityCount}`}
        </p>
      </div>
      <div className="flex-1 p-4 min-h-[360px]">
        <div ref={containerRef} className="w-full h-[340px] rounded-lg overflow-hidden border border-slate-200 z-0" />
        <div className="flex gap-4 mt-3 justify-center text-xs text-slate-600">
          <span><span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-1" />{t.mapHigh}</span>
          <span><span className="inline-block w-3 h-3 rounded-full bg-orange-400 mr-1" />{t.mapMedium}</span>
          <span><span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-1" />{t.mapLow}</span>
        </div>
      </div>
    </div>
  )
}
