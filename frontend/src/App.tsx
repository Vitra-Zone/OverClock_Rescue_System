import React from 'react';
import { BrowserRouter, Navigate, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { ProtectedStaffRoute } from './auth/ProtectedStaffRoute';
import { StaffPortalPage } from './pages/StaffPortalPage';
import { SiteChooserPage } from './pages/SiteChooserPage';
import { AIAgentDashboard } from './pages/AIAgentDashboard';
import { StaffLoginPage } from './pages/StaffLoginPage';
import { StaffRoleLoginPage } from './pages/StaffRoleLoginPage';
import { LocationMapPage } from './pages/LocationMapPage';
import { StaffDashboard } from './pages/StaffDashboard';
import { IncidentDetail } from './pages/IncidentDetail';
import { HotelTouristRegistrationPage } from './pages/HotelTouristRegistrationPage';
import { useConnectivity } from './hooks/useConnectivity';

function AppRoutes() {
  const { mode, setManualMode } = useConnectivity();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const showBackRow = pathname !== '/management' && pathname !== '/staff-login' && !pathname.startsWith('/staff-login/') && pathname !== '/';

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
          <Route path="/" element={<Navigate to="/management" replace />} />
          <Route path="/management" element={<StaffLoginPage />} />
          <Route path="/staff-login" element={<StaffLoginPage />} />
          <Route path="/staff-login/:role" element={<StaffRoleLoginPage />} />
          <Route path="/staff" element={<ProtectedStaffRoute><StaffPortalPage connectivity={mode} /></ProtectedStaffRoute>} />
          <Route path="/staff/register-tourist" element={<ProtectedStaffRoute><HotelTouristRegistrationPage /></ProtectedStaffRoute>} />
          <Route path="/agent" element={<ProtectedStaffRoute><AIAgentDashboard /></ProtectedStaffRoute>} />
          <Route path="/ai-dashboard" element={<ProtectedStaffRoute><AIAgentDashboard /></ProtectedStaffRoute>} />
          <Route path="/location" element={<LocationMapPage />} />
          <Route path="/location/:id" element={<LocationMapPage />} />
          <Route path="/dashboard" element={<ProtectedStaffRoute><StaffDashboard /></ProtectedStaffRoute>} />
          <Route path="/dashboard/:id" element={<ProtectedStaffRoute><IncidentDetail /></ProtectedStaffRoute>} />
        </Routes>
      </main>
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
