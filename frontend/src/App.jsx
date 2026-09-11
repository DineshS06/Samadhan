import { BrowserRouter, Routes, Route } from 'react-router-dom'
import CitizenPortal from './pages/CitizenPortal'
import MPDashboard from './pages/MPDashboard'
import MPLogin from './pages/MPLogin'
import NotFound from './pages/NotFound'
import ErrorBoundary from './components/ErrorBoundary'
import GA4 from './components/GA4'

export default function App() {
  return (
    <ErrorBoundary>
      <GA4 />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<CitizenPortal />} />
          <Route path="/mp/login" element={<MPLogin />} />
          <Route path="/mp" element={<MPDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
