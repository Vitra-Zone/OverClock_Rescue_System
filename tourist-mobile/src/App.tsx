import { BrowserRouter, Navigate, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { ProtectedTouristRoute } from './auth/ProtectedTouristRoute'
import { TouristHomePage } from './pages/TouristHomePage'
import { TouristLoginPage } from './pages/TouristLoginPage'
import { TouristRegisterPage } from './pages/TouristRegisterPage'
import { GuestPortalPage } from './pages/GuestPortalPage'
import { SOSScreen } from './pages/SOSScreen'
import { TouristProfilePage } from './pages/TouristProfilePage'
import { TouristIncidentsPage } from './pages/TouristIncidentsPage'
import { TouristPostSosPage } from './pages/TouristPostSosPage'
import { LocationMapPage } from './pages/LocationMapPage'
import { OfflineGuidancePage } from './pages/OfflineGuidancePage'
import { LiveGuidancePage } from './pages/LiveGuidancePage'
import { FallbackStatusScreen } from './pages/FallbackStatusScreen'
import { useConnectivity } from './hooks/useConnectivity'

function AppRoutes() {
  const { mode, setManualMode } = useConnectivity()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  
  const showBackButton = pathname !== '/' && pathname !== '/login' && pathname !== '/register' && !pathname.startsWith('/post-sos')
  
  return (
    <div className="min-h-screen bg-slate-950">
      {showBackButton && (
        <div className="border-b border-slate-700 bg-slate-900/70 backdrop-blur-sm sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 py-2">
            <button 
              onClick={() => navigate(-1)} 
              className="btn-ghost inline-flex items-center gap-1 text-xs text-slate-300 hover:text-white"
            >
              <ArrowLeft size={14} /> Back
            </button>
          </div>
        </div>
      )}
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/home" element={<TouristHomePage />} />
          <Route path="/login" element={<TouristLoginPage />} />
          <Route path="/register" element={<TouristRegisterPage />} />
          <Route path="/guest" element={<ProtectedTouristRoute><GuestPortalPage /></ProtectedTouristRoute>} />
          <Route path="/tourist" element={<ProtectedTouristRoute><GuestPortalPage /></ProtectedTouristRoute>} />
          <Route path="/sos" element={<ProtectedTouristRoute><SOSScreen /></ProtectedTouristRoute>} />
          <Route path="/post-sos/:incidentId" element={<ProtectedTouristRoute><TouristPostSosPage /></ProtectedTouristRoute>} />
          <Route path="/profile" element={<ProtectedTouristRoute><TouristProfilePage /></ProtectedTouristRoute>} />
          <Route path="/incidents" element={<ProtectedTouristRoute><TouristIncidentsPage /></ProtectedTouristRoute>} />
          <Route path="/location" element={<ProtectedTouristRoute><LocationMapPage /></ProtectedTouristRoute>} />
          <Route path="/location/:id" element={<ProtectedTouristRoute><LocationMapPage /></ProtectedTouristRoute>} />
          <Route path="/offline" element={<ProtectedTouristRoute><OfflineGuidancePage /></ProtectedTouristRoute>} />
          <Route path="/live-guidance" element={<ProtectedTouristRoute><LiveGuidancePage /></ProtectedTouristRoute>} />
          <Route path="/fallback" element={<ProtectedTouristRoute><FallbackStatusScreen connectivity={mode} onModeChange={(nextMode) => setManualMode(nextMode as typeof mode)} /></ProtectedTouristRoute>} />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App
