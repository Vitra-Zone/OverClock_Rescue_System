import React from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ProtectedStaffRoute } from './auth/ProtectedStaffRoute';
import { TouristHomePage } from './pages/TouristHomePage';
import { GuestPortalPage } from './pages/GuestPortalPage';
import { StaffPortalPage } from './pages/StaffPortalPage';
import { SiteChooserPage } from './pages/SiteChooserPage';
import { AIAgentDashboard } from './pages/AIAgentDashboard';
import { StaffLoginPage } from './pages/StaffLoginPage';
import { StaffRoleLoginPage } from './pages/StaffRoleLoginPage';
import { LocationMapPage } from './pages/LocationMapPage';
import { SOSScreen } from './pages/SOSScreen';
import { OfflineGuidancePage } from './pages/OfflineGuidancePage';
import { FallbackStatusScreen } from './pages/FallbackStatusScreen';
import { LiveGuidancePage } from './pages/LiveGuidancePage';
import { StaffDashboard } from './pages/StaffDashboard';
import { IncidentDetail } from './pages/IncidentDetail';
import { TouristProfilePage } from './pages/TouristProfilePage';
import { TouristPostSosPage } from './pages/TouristPostSosPage';
import { TouristIncidentsPage } from './pages/TouristIncidentsPage';
import { HotelTouristRegistrationPage } from './pages/HotelTouristRegistrationPage';
import { useConnectivity } from './hooks/useConnectivity';

function AppRoutes() {
  const { mode, setManualMode } = useConnectivity();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isTouristRoute = pathname.startsWith('/tourist-home') || pathname.startsWith('/tourist') || pathname.startsWith('/guest') || pathname.startsWith('/sos') || pathname.startsWith('/offline') || pathname.startsWith('/live-guidance') || pathname.startsWith('/fallback') || pathname.startsWith('/profile') || pathname.startsWith('/post-sos');
  const showBackRow = isTouristRoute && pathname !== '/tourist-home' && pathname !== '/tourist' && !pathname.startsWith('/post-sos');

  return (
    <div className="min-h-screen bg-crisis-bg">
      <Navbar connectivity={mode} onModeChange={setManualMode} />
      {showBackRow ? (
        <div className="border-b border-crisis-border bg-crisis-surface/70 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4 py-2">
            <button onClick={() => navigate(-1)} className="btn-ghost inline-flex items-center gap-1 text-xs">
              <ArrowLeft size={14} /> Back
            </button>
          </div>
        </div>
      ) : null}
      <main>
        <Routes>
          <Route path="/" element={<SiteChooserPage />} />
          <Route path="/tourist-home" element={<TouristHomePage />} />
          <Route path="/guest" element={<GuestPortalPage connectivity={mode} />} />
          <Route path="/tourist" element={<GuestPortalPage connectivity={mode} />} />
          <Route path="/management" element={<StaffLoginPage />} />
          <Route path="/tourist-incidents" element={<TouristIncidentsPage />} />
          <Route path="/profile" element={<TouristProfilePage />} />
          <Route path="/staff-login" element={<StaffLoginPage />} />
          <Route path="/staff-login/:role" element={<StaffRoleLoginPage />} />
          <Route path="/staff" element={<ProtectedStaffRoute><StaffPortalPage connectivity={mode} /></ProtectedStaffRoute>} />
          <Route path="/staff/register-tourist" element={<ProtectedStaffRoute><HotelTouristRegistrationPage /></ProtectedStaffRoute>} />
          <Route path="/agent" element={<ProtectedStaffRoute><AIAgentDashboard /></ProtectedStaffRoute>} />
          <Route path="/ai-dashboard" element={<ProtectedStaffRoute><AIAgentDashboard /></ProtectedStaffRoute>} />
          <Route path="/location" element={<LocationMapPage />} />
          <Route path="/location/:id" element={<LocationMapPage />} />
          <Route path="/sos" element={<SOSScreen connectivity={mode} />} />
          <Route path="/post-sos/:incidentId" element={<TouristPostSosPage />} />
          <Route path="/offline" element={<OfflineGuidancePage />} />
          <Route path="/live-guidance" element={<LiveGuidancePage />} />
          <Route path="/fallback" element={<FallbackStatusScreen connectivity={mode} onModeChange={setManualMode} />} />
          <Route path="/dashboard" element={<ProtectedStaffRoute><StaffDashboard /></ProtectedStaffRoute>} />
          <Route path="/dashboard/:id" element={<ProtectedStaffRoute><IncidentDetail /></ProtectedStaffRoute>} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
