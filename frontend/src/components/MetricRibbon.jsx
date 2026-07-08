import { useLanguage } from '../i18n/LanguageContext'

export default function MetricRibbon({ metrics }) {
  const { t } = useLanguage()

  const cards = [
    { key: 'total_grievances', label: t.metricGrievances, format: (v) => v.toLocaleString('en-IN') },
    { key: 'ai_prioritized_projects', label: t.metricProjects, format: (v) => String(v) },
    { key: 'active_mplads_fund_crores', label: t.metricMplads, format: (v) => `₹${v.toFixed(2)} Cr` },
    { key: 'allocated_funds_crores', label: t.metricAllocated, format: (v) => `₹${v.toFixed(2)} Cr` },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {cards.map(({ key, label, format }) => (
        <div key={key} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">{label}</p>
          <p className="text-2xl font-bold text-[#032B5B]">{format(metrics[key])}</p>
        </div>
      ))}
    </div>
  )
}
