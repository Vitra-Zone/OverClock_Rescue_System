import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, LayoutDashboard, AlertTriangle, BookOpen, Radio, UserRound, UsersRound, Bot, MapPinned, LogOut } from 'lucide-react';
import type { ConnectivityMode } from '../types/incident';
import { ConnectivityBadge } from './ConnectivityBadge';
import { useAuth } from '../auth/AuthContext';

interface Props {
  connectivity: ConnectivityMode;
  onModeChange?: (mode: ConnectivityMode) => void;
}

const NAV_ITEMS = [
  { path: '/',          label: 'Home',       icon: <Shield size={16} /> },
  { path: '/guest',     label: 'Guest',      icon: <UserRound size={16} /> },
  { path: '/staff',     label: 'Staff',      icon: <UsersRound size={16} /> },
  { path: '/agent',     label: 'AI Agent',   icon: <Bot size={16} /> },
  { path: '/ai-dashboard', label: 'AI Analytics', icon: <LayoutDashboard size={16} /> },
  { path: '/location',  label: 'Map',        icon: <MapPinned size={16} /> },
  { path: '/sos',       label: 'SOS',        icon: <AlertTriangle size={16} /> },
  { path: '/offline',   label: 'Guides',     icon: <BookOpen size={16} /> },
  { path: '/fallback',  label: 'Fallback',   icon: <Radio size={16} /> },
  { path: '/dashboard', label: 'Dashboard',  icon: <LayoutDashboard size={16} /> },
];

export function Navbar({ connectivity, onModeChange }: Props) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, enabled, logout } = useAuth();
  const isMinimalHeader = true;
  const navbarConnectivity: ConnectivityMode = connectivity === 'offline' ? 'offline' : 'online';
  
  const isManagementRoute = pathname.startsWith('/staff') || pathname.startsWith('/dashboard') || pathname.startsWith('/agent');
  const showConnectivity = !isManagementRoute && pathname !== '/';

  return (
    <header className="sticky top-0 z-50 bg-crisis-surface/80 backdrop-blur-md border-b border-crisis-border">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4 relative">
        {/* Logo */}
        {!isMinimalHeader ? (
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 shrink-0"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-crisis-primary to-crisis-accent flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <span className="font-bold text-crisis-text text-sm hidden sm:block">Hackdays</span>
          </button>
        ) : (
          <div className="w-28" aria-hidden="true" />
        )}

        {isMinimalHeader && (
          <button
            onClick={() => navigate('/')}
            className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-crisis-primary to-crisis-accent flex items-center justify-center">
              <Shield size={17} className="text-white" />
            </div>
            <span className="font-bold text-crisis-text text-lg">Hackdays</span>
          </button>
        )}

        {!isMinimalHeader && (
          <nav className="flex items-center gap-0.5">
            {NAV_ITEMS.map(({ path, label, icon }) => {
              const active = pathname === path || (path !== '/' && pathname.startsWith(path));
              return (
                <button
                  key={path}
                  id={`nav-${label.toLowerCase()}`}
                  onClick={() => navigate(path)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150
                    ${active
                      ? 'bg-crisis-primary/15 text-crisis-primary'
                      : 'text-crisis-text-dim hover:text-crisis-text hover:bg-white/5'
                    }`}
                >
                  {icon}
                  <span className="hidden sm:block">{label}</span>
                </button>
              );
            })}
          </nav>
        )}

        {/* Connectivity - only on guest side */}
        {showConnectivity && (
          <ConnectivityBadge
            mode={navbarConnectivity}
            onModeChange={onModeChange}
            showToggle={false}
          />
        )}

        {/* Logout - only on management side */}
        {isManagementRoute && enabled && (
          <button
            onClick={async () => {
              await logout();
              navigate('/');
            }}
            className="btn-ghost text-xs inline-flex items-center gap-1"
          >
            <LogOut size={14} /> Logout
          </button>
        )}

        {!isMinimalHeader && enabled && (
          user ? (
            <button
              onClick={async () => {
                await logout();
                navigate('/');
              }}
              className="btn-ghost text-xs"
            >
              Logout
            </button>
          ) : (
            <button onClick={() => navigate('/staff-login')} className="btn-ghost text-xs">
              Staff Login
            </button>
          )
        )}
      </div>
    </header>
  );
}
