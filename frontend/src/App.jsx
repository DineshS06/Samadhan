import CitizenPortal from './pages/CitizenPortal'
import MPDashboard from './pages/MPDashboard'
import MPLogin from './pages/MPLogin'

export default function App() {
  const path = window.location.pathname

  if (path.startsWith('/mp/login')) {
    return <MPLogin />
  }

  if (path.startsWith('/mp')) {
    return <MPDashboard />
  }

  return <CitizenPortal />
}
