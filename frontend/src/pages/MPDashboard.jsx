import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()
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
      navigate('/mp/login', { replace: true })
      return
    }
    fetchMpDashboard()
      .then(setFeed)
      .catch((ex) => {
        if (ex.message === 'SESSION_EXPIRED') {
          navigate('/mp/login', { replace: true })
          return
        }
        setError(ex.message)
      })
      .finally(() => setLoading(false))
  }, [navigate])

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
    navigate('/mp/login', { replace: true })
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
          <p role="alert" className="text-red-600 mb-4">{error || t.loadFail}</p>
          <Link to="/mp/login" className="text-[#032B5B] underline">{t.mpLoginBtn}</Link>
        </div>
      </div>
    )
  }

  // The office line used to concatenate the name straight into the
  // constituency with no separator, rendering "Demo MPVisakhapatnam". Build it
  // once, in order, so the spacing cannot go missing again.
  const officeName = feed.mp_office?.name || mpProfile?.name || ''
  const officeConstituency = feed.mp_office?.constituency || mpProfile?.constituency || ''
  const officePlace = [officeConstituency, feed.mp_office?.state || mpProfile?.state]
    .filter(Boolean)
    .join(', ')

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Header subtitle={officeConstituency ? `${t.mpSubtitle} — ${officeConstituency}` : t.mpSubtitle} showLangToggle />

      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2 flex items-center justify-between gap-3 text-xs text-slate-600">
      {/* The dashboard had no h1 anywhere, so it had no top-level heading for
          assistive tech or heading navigation. Visually hidden so the bar
          stays compact. */}
      <h1 className="sr-only">
        {t.mpSubtitle}
        {feed.mp_office?.constituency || mpProfile?.constituency
          ? ` — ${feed.mp_office?.constituency || mpProfile?.constituency}`
          : ''}
      </h1>
        <span className="min-w-0 truncate">
          {t.mpLoggedInAs}: <strong className="text-[#032B5B]">{officeName}</strong>
          {officePlace ? ` — ${officePlace}` : ''}
        </span>
        <button type="button" onClick={handleLogout} className="shrink-0 whitespace-nowrap text-[#032B5B] hover:text-[#F28C0F] font-medium">
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
        {/* The /api fallback was silent, so demo counts rendered exactly like
            live ones. On the deployed site /api/* is a dead path, meaning every
            visit showed fixture numbers as if they were this office's real
            figures. Say where the data came from. */}
        {feed._dataSource && feed._dataSource !== 'live' && (
          <div
            role='status'
            className='mx-auto mt-3 max-w-2xl rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-xs text-amber-900'
          >
            {feed._dataSource === 'static'
              ? 'Sample data: the API is unreachable, so these are the committed placeholder figures, not live figures for this office.'
              : feed._dataSource === 'static-empty'
                ? 'No grievances recorded for this constituency yet. The sample figures on this static build belong to Visakhapatnam, so they are not shown here.'
                : 'No data available: the API and the committed dataset both failed to load. All counts are zero.'}
          </div>
        )}
      </main>

      <Footer variant="mp" />

      {selectedProject && (
        <SanctionModal
          project={selectedProject}
          doc={sanctionDoc}
          loading={sanctionLoading}
          onClose={() => { setSelectedProject(null); setSanctionDoc(null) }}
          onForward={handleForward}
        />
      )}
      {toast && (
        <div role="status" aria-live="polite" className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 bg-[#032B5B] text-white text-sm px-5 py-3 rounded-lg shadow-xl max-w-sm z-50">{toast}</div>
      )}
    </div>
  )
}