import { useEffect, useRef, useMemo } from 'react'
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

export default function ConstituencyMap({ points = [], mapConfig, mpOffice }) {
  const { t } = useLanguage()
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])

  const constituency = mpOffice?.constituency || mapConfig?.constituency || 'Visakhapatnam'
  const centerLat = mapConfig?.center?.[0] ?? DEFAULT_CENTER[0]
  const centerLng = mapConfig?.center?.[1] ?? DEFAULT_CENTER[1]
  const zoom = mapConfig?.zoom ?? DEFAULT_ZOOM
  const boundaryUrl = mapConfig?.boundary_url || '/api/geo/constituency/by-name/Visakhapatnam?state=Andhra%20Pradesh'

  const mapKey = useMemo(
    () => `${constituency}-${centerLat}-${centerLng}-${boundaryUrl}`,
    [constituency, centerLat, centerLng, boundaryUrl],
  )

  useEffect(() => {
    if (!containerRef.current) return

    if (mapRef.current) {
      mapRef.current.remove()
      mapRef.current = null
    }

    const map = L.map(containerRef.current, { scrollWheelZoom: true }).setView([centerLat, centerLng], zoom)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 18,
    }).addTo(map)
    mapRef.current = map

    fetch(boundaryUrl)
      .then((r) => r.json())
      .then((geojson) => {
        if (!mapRef.current) return
        const layer = L.geoJSON(geojson, {
          style: { color: '#032B5B', weight: 2.5, fillColor: '#032B5B', fillOpacity: 0.08 },
        }).addTo(map)
        try {
          map.fitBounds(layer.getBounds(), { padding: [24, 24] })
        } catch { /* keep default view */ }
      })
      .catch(() => {})

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [mapKey, centerLat, centerLng, zoom, boundaryUrl])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    markersRef.current.forEach((m) => map.removeLayer(m))
    markersRef.current = []

    points.forEach((point) => {
      if (point.lat == null || point.lng == null) return
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
      marker.addTo(map)
      markersRef.current.push(marker)
    })
  }, [points, t.mapGpsPin, t.mapLocalityPin, t.severityLabel])

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
