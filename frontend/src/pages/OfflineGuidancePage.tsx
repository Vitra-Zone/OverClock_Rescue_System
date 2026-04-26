import React, { useMemo, useState } from 'react';
import { ArrowLeft, MapPin, Phone, Building2, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { EMERGENCY_GUIDES, HOTEL_SAFETY_INFO } from '../data/emergencyGuides';

const GUEST_EMERGENCY_SELECTION_KEY = 'hackdays_guest_emergency_selection';

function pickGuideId(emergencyType: string | null | undefined) {
  if (!emergencyType) return 'medical';
  const normalized = emergencyType.toLowerCase().trim();

  if (normalized === 'other' || normalized === 'anything else') return null;
  if (['fire', 'electrical', 'gas leak'].includes(normalized)) return 'fire';
  if (['health', 'medical'].includes(normalized)) return 'medical';
  if (['security threat', 'theft', 'murder', 'assault', 'harassment', 'suspicious activity'].includes(normalized)) {
    return 'security';
  }
  if (normalized === 'earthquake') return 'earthquake';

  return 'medical';
}

export function OfflineGuidancePage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [showHotelInfo, setShowHotelInfo] = useState(false);

  const selectedEmergencyType = useMemo(() => {
    const stateSelection = (state as { emergencyType?: string } | null)?.emergencyType;
    if (stateSelection) return stateSelection;

    try {
      const raw = window.sessionStorage.getItem(GUEST_EMERGENCY_SELECTION_KEY);
      if (!raw) return undefined;
      const parsed = JSON.parse(raw) as { emergencyType?: string };
      return parsed.emergencyType;
    } catch {
      return undefined;
    }
  }, [state]);

  const guideId = pickGuideId(selectedEmergencyType);
  const selectedGuide = guideId ? EMERGENCY_GUIDES.find((guide) => guide.id === guideId) : null;

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Back + Header */}
        <button onClick={() => navigate(-1)} className="btn-ghost flex items-center gap-1 text-sm mb-6 -ml-2">
          <ArrowLeft size={16} /> Back
        </button>

        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/30 border border-emerald-700/40
                          text-emerald-400 text-xs font-medium mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Works Offline — No Internet Needed
          </div>
          <h1 className="text-3xl font-black text-crisis-text mb-2">Emergency Guides</h1>
          <p className="text-crisis-text-dim text-sm">
            Step-by-step instructions for common emergencies. Read carefully and stay calm.
          </p>
        </div>

        <div className="space-y-4 mb-8">
          {selectedGuide ? (
            <div className={`card border overflow-hidden ${selectedGuide.borderColor}`}>
              <div className="w-full flex items-center gap-4 p-5 text-left border-b border-white/10">
                <span className="text-4xl">{selectedGuide.icon}</span>
                <div>
                  <h2 className={`text-xl font-bold ${selectedGuide.accentColor}`}>{selectedGuide.title}</h2>
                  <p className="text-crisis-text-dim text-sm">
                    Applicable guide based on selected emergency
                    {selectedEmergencyType ? `: ${selectedEmergencyType}` : ''}.
                  </p>
                </div>
              </div>

              <div className={`px-5 pb-5 pt-4 bg-gradient-to-b ${selectedGuide.color} animate-fade-in`}>
                <ol className="space-y-3 mb-5">
                  {selectedGuide.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${selectedGuide.accentColor} bg-black/30`}>
                        {i + 1}
                      </span>
                      <span className="text-crisis-text text-base leading-snug pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-white/10">
                  <div className="bg-black/20 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-xs text-crisis-text-dim mb-1">
                      <Phone size={11} /> Emergency Contact
                    </div>
                    <p className={`font-semibold text-sm ${selectedGuide.accentColor}`}>{selectedGuide.contact}</p>
                  </div>
                  <div className="bg-black/20 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-xs text-crisis-text-dim mb-1">
                      <MapPin size={11} /> Assembly Point
                    </div>
                    <p className={`font-semibold text-sm ${selectedGuide.accentColor}`}>{selectedGuide.assembly}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card border border-amber-700/40 p-5 bg-amber-900/15">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={18} className="text-amber-400" />
                <h2 className="text-lg font-bold text-amber-300">Important Emergency Contacts</h2>
              </div>
              <p className="text-sm text-amber-100/80 mb-4">
                Guide steps are not available for "Other" emergency type. Call the relevant emergency service immediately.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-black/20 rounded-xl p-3 border border-white/10">
                  <p className="text-xs text-crisis-text-dim mb-1">Medical</p>
                  <p className="text-lg font-bold text-cyan-300">108</p>
                </div>
                <div className="bg-black/20 rounded-xl p-3 border border-white/10">
                  <p className="text-xs text-crisis-text-dim mb-1">Police</p>
                  <p className="text-lg font-bold text-blue-300">100</p>
                </div>
                <div className="bg-black/20 rounded-xl p-3 border border-white/10">
                  <p className="text-xs text-crisis-text-dim mb-1">Fire</p>
                  <p className="text-lg font-bold text-red-300">101</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Hotel Safety Info */}
        <div className="card p-5">
          <button
            id="hotel-info-toggle"
            onClick={() => setShowHotelInfo(!showHotelInfo)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-3">
              <Building2 size={20} className="text-crisis-primary" />
              <div>
                <p className="font-semibold text-crisis-text">{HOTEL_SAFETY_INFO.name}</p>
                <p className="text-crisis-text-dim text-sm">Hotel Safety Information</p>
              </div>
            </div>
            {showHotelInfo ? <ChevronUp size={18} className="text-crisis-muted" /> : <ChevronDown size={18} className="text-crisis-muted" />}
          </button>

          {showHotelInfo && (
            <div className="mt-5 space-y-5 animate-fade-in">
              <div className="divider" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-crisis-muted mb-1">Address</p>
                  <p className="text-crisis-text text-sm">{HOTEL_SAFETY_INFO.address}</p>
                </div>
                <div>
                  <p className="text-xs text-crisis-muted mb-1">Emergency Line</p>
                  <p className="text-crisis-primary font-bold">{HOTEL_SAFETY_INFO.emergencyLine}</p>
                </div>
                <div>
                  <p className="text-xs text-crisis-muted mb-1">Defibrillator Locations</p>
                  <p className="text-crisis-text text-sm">{HOTEL_SAFETY_INFO.defibrillator}</p>
                </div>
                <div>
                  <p className="text-xs text-crisis-muted mb-1">First Aid Kits</p>
                  <p className="text-crisis-text text-sm">{HOTEL_SAFETY_INFO.firstAidKit}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-crisis-muted mb-2">🚪 Exits</p>
                <div className="space-y-2">
                  {HOTEL_SAFETY_INFO.exits.map((exit, i) => (
                    <div key={i} className="bg-crisis-bg/60 rounded-lg px-4 py-3 border border-crisis-border/50">
                      <p className="font-semibold text-crisis-text text-sm">{exit.label}</p>
                      <p className="text-crisis-text-dim text-xs">{exit.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-crisis-muted mb-2">🏁 Assembly Points</p>
                <div className="space-y-2">
                  {HOTEL_SAFETY_INFO.assemblyPoints.map((pt, i) => (
                    <div key={i} className="bg-crisis-bg/60 rounded-lg px-4 py-3 border border-crisis-border/50">
                      <p className="font-semibold text-crisis-text text-sm">{pt.label}</p>
                      <p className="text-crisis-text-dim text-xs">{pt.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
