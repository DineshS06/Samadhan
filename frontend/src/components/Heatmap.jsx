import { useLanguage } from '../i18n/LanguageContext'

const SEVERITY_COLORS = { high: '#EF4444', medium: '#F28C0F', low: '#22C55E' }

export default function Heatmap({ points }) {
  const { t } = useLanguage()

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm h-full flex flex-col">
      <div className="px-5 py-4 border-b border-slate-200">
        <h2 className="text-base font-bold text-[#032B5B]">{t.mapTitle}</h2>
        <p className="text-xs text-slate-500 mt-1">{t.mapSub}</p>
      </div>
      <div className="flex-1 p-4">
        <div className="relative w-full rounded-lg overflow-hidden border border-slate-200" style={{ height: '340px', background: 'linear-gradient(135deg, #e8f4f8, #d4e8d4, #f0e8d4)' }}>
          <svg viewBox="0 0 400 300" className="w-full h-full opacity-60">
            <path d="M60,80 Q120,40 200,60 T340,90 L360,180 Q300,240 200,260 T40,200 Z" fill="#c8dcc8" stroke="#7aab7a" strokeWidth="2" />
          </svg>
          {points.map((point, i) => (
            <div key={point.label} className="absolute flex flex-col items-center" style={{ left: `${15 + (i * 17) % 70}%`, top: `${20 + (i * 23) % 60}%` }}>
              <div className="w-4 h-4 rounded-full border-2 border-white shadow-lg" style={{ backgroundColor: SEVERITY_COLORS[point.severity] || SEVERITY_COLORS.medium }} />
              <span className="text-[10px] font-semibold text-[#032B5B] mt-1 bg-white/80 px-1 rounded">{point.label}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-3 justify-center text-xs text-slate-600">
          <span><span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-1" />{t.mapHigh}</span>
          <span><span className="inline-block w-3 h-3 rounded-full bg-orange-400 mr-1" />{t.mapMedium}</span>
          <span><span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-1" />{t.mapLow}</span>
        </div>
      </div>
    </div>
  )
}
