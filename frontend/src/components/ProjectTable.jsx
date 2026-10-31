import { useLanguage } from '../i18n/LanguageContext'

function ScoreBadge({ value }) {
  const color = value >= 85 ? 'bg-red-100 text-red-700' : value >= 70 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
  return <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${color}`}>{value}</span>
}

export default function ProjectTable({ projects, onReview }) {
  const { t } = useLanguage()

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200">
        <h2 className="text-base font-bold text-[#032B5B]">{t.tableTitle}</h2>
        <p className="text-xs text-slate-500 mt-1">{t.tableSub}</p>
      </div>

      {projects.length === 0 ? (
        <p className="px-5 py-8 text-sm text-slate-500">{t.tableEmpty}</p>
      ) : (
        <>
          {/* Phones get cards. A six-column table at 390px pushed the action button
              off-screen behind a horizontal scroll, so the one control an MP needs
              was the one control they could not see. */}
          <ul className="sm:hidden divide-y divide-slate-100">
            {projects.map((project) => (
              <li key={project.id} className="p-4">
                <p className="text-xs font-bold text-slate-400">#{project.rank}</p>
                <p className="font-medium text-slate-800 mt-0.5">{project.project_name}</p>
                <p className="text-xs text-slate-500">{project.category}</p>
                <p className="text-xs text-slate-500 mt-1">{project.location}</p>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{t.colDemand}</p>
                    <div className="mt-1"><ScoreBadge value={project.public_demand_index} /></div>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{t.colGap}</p>
                    <div className="mt-1"><ScoreBadge value={project.infrastructure_gap_score} /></div>
                  </div>
                </div>

                <button
                  onClick={() => onReview(project)}
                  className="mt-3 w-full bg-[#F28C0F] hover:bg-[#e07d0a] text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow"
                >
                  {t.reviewBtn}
                </button>
              </li>
            ))}
          </ul>

          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-4 py-3 font-semibold text-[#032B5B]">{t.colRank}</th>
                  <th className="px-4 py-3 font-semibold text-[#032B5B]">{t.colProject}</th>
                  <th className="px-4 py-3 font-semibold text-[#032B5B]">{t.colLocation}</th>
                  <th className="px-4 py-3 font-semibold text-[#032B5B]">{t.colDemand}</th>
                  <th className="px-4 py-3 font-semibold text-[#032B5B]">{t.colGap}</th>
                  <th className="px-4 py-3 font-semibold text-[#032B5B]">{t.colAction}</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project, idx) => (
                  <tr key={project.id} className={`border-t border-slate-100 hover:bg-slate-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}>
                    <td className="px-4 py-3 font-bold text-[#032B5B]">#{project.rank}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{project.project_name}</p>
                      <p className="text-xs text-slate-500">{project.category}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{project.location}</td>
                    <td className="px-4 py-3"><ScoreBadge value={project.public_demand_index} /></td>
                    <td className="px-4 py-3"><ScoreBadge value={project.infrastructure_gap_score} /></td>
                    <td className="px-4 py-3">
                      <button onClick={() => onReview(project)}
                        className="bg-[#F28C0F] hover:bg-[#e07d0a] text-white text-xs font-semibold px-4 py-2 rounded-lg shadow whitespace-nowrap">
                        {t.reviewBtn}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
