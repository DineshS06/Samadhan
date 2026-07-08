import { useEffect, useState } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import MetricRibbon from '../components/MetricRibbon'
import ProjectTable from '../components/ProjectTable'
import ConstituencyMap from '../components/ConstituencyMap'
import SanctionModal from '../components/SanctionModal'
import { useLanguage } from '../i18n/LanguageContext'
import { fetchMpDashboard, getMpToken, mpLogout, getMpProfile, mpAuthHeaders } from '../lib/mpAuth'

function buildInstantSanction(project) {
  if (!project) return null
  return {
    subject: `Recommendation for ${project.project_name} at ${project.location}`,
    from_office: "Hon'ble Member of Parliament",
    to_office: 'The District Collector',
    project_name: project.project_name,
    location: project.location,
    category: project.category,
    summary: project.summary,
    project_scope: project.sanction_note_draft || project.summary,
    budget_allocation: 'Funds to be allocated from MPLADS corpus based on district engineering estimates and DPR review.',
    guidelines: [
      'Concerned district department shall execute within stipulated timeline.',
      'Monthly progress reports to MP Office mandatory.',
      'Quality audit before final payment release.',
      'Citizen feedback via Gram Sabha / Ward Sabha upon completion.',
    ],
    sanction_note: project.sanction_note_draft || project.summary,
  }
}

export default function MPDashboard() {
  const { t } = useLanguage()
  const [feed, setFeed] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedProject, setSelectedProject] = useState(null)
  const [sanctionDoc, setSanctionDoc] = useState(null)
  const [sanctionLoading, setSanctionLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const mpProfile = getMpProfile()

  useEffect(() => {
    if (!getMpToken()) {
      window.location.href = '/mp/login'
      return
    }
    fetchMpDashboard()
      .then(setFeed)
      .catch((ex) => {
        if (ex.message === 'SESSION_EXPIRED') {
          window.location.href = '/mp/login'
          return
        }
        setError(ex.message)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleReview = (project) => {
    setSelectedProject(project)
    setSanctionDoc(buildInstantSanction(project))
    setSanctionLoading(!project.sanction_note_draft)

    fetch(`/api/sanction/${project.id}`, { headers: mpAuthHeaders() })
      .then((r) => r.json())
      .then((data) => {
        if (data.sanction_note || data.subject) setSanctionDoc(data)
      })
      .catch(() => {})
      .finally(() => setSanctionLoading(false))
  }

  const handleLogout = async () => {
    await mpLogout()
    window.location.href = '/mp/login'
  }

  const handleForward = () => {
    setSelectedProject(null)
    setSanctionDoc(null)
    setToast(t.toastForward)
    setTimeout(() => setToast(null), 4000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="text-[#032B5B] font-semibold animate-pulse">{t.loading}</div>
      </div>
    )
  }

  if (error || !feed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || t.loadFail}</p>
          <a href="/mp/login" className="text-[#032B5B] underline">{t.mpLoginBtn}</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Header subtitle={`${t.mpSubtitle} — ${feed.mp_office?.constituency || mpProfile?.constituency || ''}`} />

      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2 flex items-center justify-between text-xs text-slate-600">
        <span>
          {t.mpLoggedInAs}: <strong className="text-[#032B5B]">{feed.mp_office?.name || mpProfile?.name}</strong>
          {' · '}{feed.mp_office?.constituency}, {feed.mp_office?.state}
        </span>
        <button type="button" onClick={handleLogout} className="text-[#032B5B] hover:text-[#F28C0F] font-medium">
          {t.mpLogout}
        </button>
      </div>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full">
        <MetricRibbon metrics={feed.metrics} />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3"><ProjectTable projects={feed.projects} onReview={handleReview} /></div>
          <div className="lg:col-span-2">
            <ConstituencyMap
              points={feed.heatmap_points || []}
              mapConfig={feed.map}
              mpOffice={feed.mp_office}
            />
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-6 text-center">
          {t.lastUpdated}: {new Date(feed.last_updated).toLocaleString('en-IN')}
          {feed.map?.data_source && ` · ${feed.map.data_source}`}
        </p>
      </main>

      <Footer variant="mp" />

      {selectedProject && (
        <SanctionModal
          project={selectedProject}
          document={sanctionDoc}
          loading={sanctionLoading}
          onClose={() => { setSelectedProject(null); setSanctionDoc(null) }}
          onForward={handleForward}
        />
      )}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-[#032B5B] text-white text-sm px-5 py-3 rounded-lg shadow-xl max-w-sm z-50">{toast}</div>
      )}
    </div>
  )
}
