import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function ProtectedStaffRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, enabled } = useAuth();
  const location = useLocation();

  if (!enabled) {
    return <>{children}</>;
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-crisis-text">Checking staff access...</div>;
  }

  if (!user) {
    return <Navigate to="/staff-login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}
