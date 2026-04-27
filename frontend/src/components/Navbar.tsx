import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, LayoutDashboard, AlertTriangle, BookOpen, Radio, UserRound, UsersRound, Bot, MapPinned, LogOut, UserCog, Menu } from 'lucide-react';
import type { ConnectivityMode } from '../types/incident';
import { ConnectivityBadge } from './ConnectivityBadge';
import { useAuth } from '../auth/AuthContext';
import { useTouristAuth } from '../auth/TouristAuthContext';

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
  const [touristMenuOpen, setTouristMenuOpen] = React.useState(false);
  const { user, enabled, logout: logoutStaff } = useAuth();
  const { user: touristUser, logout: logoutTourist, profile: touristProfile } = useTouristAuth();
  const navbarConnectivity: ConnectivityMode = connectivity === 'offline' ? 'offline' : 'online';
  
  const isManagementRoute = pathname.startsWith('/staff') || pathname.startsWith('/dashboard') || pathname.startsWith('/agent');
  const isTouristRoute = pathname === '/' || pathname.startsWith('/tourist') || pathname.startsWith('/guest') || pathname.startsWith('/sos') || pathname.startsWith('/offline') || pathname.startsWith('/live-guidance') || pathname.startsWith('/fallback') || pathname.startsWith('/profile') || pathname.startsWith('/post-sos');
  const showConnectivity = isTouristRoute;
  const showTouristActions = isTouristRoute && pathname !== '/' && !pathname.startsWith('/post-sos') && Boolean(touristUser);
  const showTouristEdit = showTouristActions && Boolean(touristProfile);
  const showStaffLogout = isManagementRoute && enabled;
  const showTouristLogout = showTouristActions;

  React.useEffect(() => {
    setTouristMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 bg-crisis-surface/80 backdrop-blur-md border-b border-crisis-border">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4 relative">
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={() => navigate('/?chooser=1')} className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-crisis-primary to-crisis-accent flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <span className="font-bold text-crisis-text text-sm">Hackdays</span>
          </button>
        </div>

        {!isManagementRoute && !isTouristRoute && (
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

        {isTouristRoute && pathname !== '/' && !pathname.startsWith('/post-sos') ? (
          <div className="flex items-center gap-2">
            {showConnectivity && (
              <ConnectivityBadge
                mode={navbarConnectivity}
                onModeChange={pathname === '/fallback' ? onModeChange : undefined}
                showToggle={false}
              />
            )}
            {showTouristActions ? (
              <div className="relative">
                <button
                  onClick={() => setTouristMenuOpen((prev) => !prev)}
                  className="btn-ghost inline-flex items-center justify-center"
                  aria-label="Open tourist menu"
                >
                  <Menu size={16} />
                </button>
                {touristMenuOpen ? (
                  <div className="absolute right-0 top-10 w-44 rounded-xl border border-crisis-border bg-crisis-surface shadow-lg p-1 z-[80]">
                    {showTouristEdit ? (
                      <button
                        onClick={() => {
                          setTouristMenuOpen(false);
                          navigate('/profile');
                        }}
                        className="w-full rounded-lg px-3 py-2 text-left text-xs text-crisis-text hover:bg-white/5 inline-flex items-center gap-2"
                      >
                        <UserCog size={14} /> Edit profile
                      </button>
                    ) : null}
                    {showTouristLogout ? (
                      <button
                        onClick={async () => {
                          setTouristMenuOpen(false);
                          await logoutTourist();
                          navigate('/');
                        }}
                        className="w-full rounded-lg px-3 py-2 text-left text-xs text-crisis-text hover:bg-white/5 inline-flex items-center gap-2"
                      >
                        <LogOut size={14} /> Logout
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : isManagementRoute ? null : (
          <div className="flex items-center gap-2">
            {showConnectivity && (
              <ConnectivityBadge
                mode={navbarConnectivity}
                onModeChange={pathname === '/fallback' ? onModeChange : undefined}
                showToggle={false}
              />
            )}
            {!user ? (
              <button onClick={() => navigate('/staff-login')} className="btn-ghost text-xs">Staff Login</button>
            ) : null}
          </div>
        )}

        {showStaffLogout && (
          <button
            onClick={async () => {
              await logoutStaff();
              navigate('/');
            }}
            className="btn-ghost text-xs inline-flex items-center gap-1"
          >
            <LogOut size={14} /> Logout
          </button>
        )}
      </div>
    </header>
  );
}
