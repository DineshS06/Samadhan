import { BrowserRouter, Routes, Route } from 'react-router-dom'
import CitizenPortal from './pages/CitizenPortal'
import MPDashboard from './pages/MPDashboard'
import MPLogin from './pages/MPLogin'
import NotFound from './pages/NotFound'
import ErrorBoundary from './components/ErrorBoundary'

export default function App() {
  return (
    <ErrorBoundary>
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
