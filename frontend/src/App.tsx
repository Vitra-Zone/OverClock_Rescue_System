import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { ProtectedStaffRoute } from './auth/ProtectedStaffRoute';
import { HomePage } from './pages/HomePage';
import { GuestPortalPage } from './pages/GuestPortalPage';
import { StaffPortalPage } from './pages/StaffPortalPage';
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
import { useConnectivity } from './hooks/useConnectivity';

function AppRoutes() {
  const { mode, setManualMode } = useConnectivity();

  return (
    <div className="min-h-screen bg-crisis-bg">
      <Navbar connectivity={mode} onModeChange={setManualMode} />
      <main>
        <Routes>
          <Route path="/" element={<HomePage connectivity={mode} />} />
          <Route path="/guest" element={<GuestPortalPage connectivity={mode} />} />
          <Route path="/staff-login" element={<StaffLoginPage />} />
          <Route path="/staff-login/:role" element={<StaffRoleLoginPage />} />
          <Route path="/staff" element={<ProtectedStaffRoute><StaffPortalPage connectivity={mode} /></ProtectedStaffRoute>} />
          <Route path="/agent" element={<ProtectedStaffRoute><AIAgentDashboard /></ProtectedStaffRoute>} />
          <Route path="/ai-dashboard" element={<ProtectedStaffRoute><AIAgentDashboard /></ProtectedStaffRoute>} />
          <Route path="/location" element={<LocationMapPage />} />
          <Route path="/location/:id" element={<LocationMapPage />} />
          <Route path="/sos" element={<SOSScreen connectivity={mode} />} />
          <Route path="/offline" element={<OfflineGuidancePage />} />
          <Route path="/live-guidance" element={<LiveGuidancePage />} />
          <Route path="/fallback" element={<FallbackStatusScreen connectivity={mode} onModeChange={setManualMode} />} />
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
