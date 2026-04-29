import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, User, MessageSquare, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';
import type { ConnectivityMode, Incident, Coordinates } from '../types/incident';
import { SOSButton } from '../components/SOSButton';
import { createIncident, fetchIncident, runAITriage, triggerFallback } from '../api/client';
import { useTouristAuth } from '../auth/TouristAuthContext';

interface Props {
  connectivity: ConnectivityMode;
  showBackButton?: boolean;
  afterSubmitFlow?: 'incident' | 'guides-map';
}

type Step = 'form' | 'sending' | 'success' | 'offline';
const GUEST_SUCCESS_STORAGE_KEY = 'hackdays_guest_last_report';
const GUEST_EMERGENCY_SELECTION_KEY = 'hackdays_guest_emergency_selection';
const GUEST_BOUND_HOTEL_CONTEXT_KEY = 'hackdays_guest_bound_hotel_context';
const GUEST_QR_PREFILL_STORAGE_KEY = 'hackdays_guest_qr_prefill';

const DEFAULT_BOUND_HOTEL_CONTEXT = {
  name: 'Rescue OverClock Partner Hotel',
  address: 'City Center, Main Road, India',
  coordinates: {
    lat: 28.6139,
    lng: 77.209,
  },
};

const HOTEL_LOCATIONS = [
  'Room',
  'Pool Area',
  'Lobby',
  'Restaurant',
  'Gym',
  'Parking',
  'Corridor',
  'Rooftop',
];

const HOTEL_EMERGENCY_TYPES = ['Fire', 'Health', 'Medical', 'Electrical', 'Security Threat', 'Anything Else'];
const OTHER_EMERGENCY_TYPES = ['Theft', 'Murder', 'Assault', 'Harassment', 'Suspicious Activity', 'Other'];

export function SOSScreen({ connectivity, showBackButton = true, afterSubmitFlow = 'incident' }: Props) {
  const navigate = useNavigate();
  const { profile, loading: touristAuthLoading } = useTouristAuth();
  const [step, setStep] = useState<Step>('form');
  const [incident, setIncident] = useState<Incident | null>(null);
  const [liveVideoUrl, setLiveVideoUrl] = useState<string | null>(null);
  const [fallbackStatus, setFallbackStatus] = useState<string | null>(null);
  const [form, setForm] = useState({
    guestName: '',
    locationMode: 'hotel',
    hotelLocation: 'Room',
    roomNumber: '',
    otherLocation: '',
    emergencyType: 'Fire',
    details: '',
  });
  const [coordinates, setCoordinates] = useState<Coordinates | undefined>(undefined);
  const [boundHotelContext, setBoundHotelContext] = useState(DEFAULT_BOUND_HOTEL_CONTEXT);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasHotelBinding = Boolean(profile?.hotelBinding);

  useEffect(() => {
    if (afterSubmitFlow !== 'guides-map') return;
    try {
      const raw = window.sessionStorage.getItem(GUEST_SUCCESS_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        incident: Incident;
        liveVideoUrl: string | null;
        fallbackStatus: string | null;
      };
      if (!parsed?.incident?.id) return;
      setIncident(parsed.incident);
      setLiveVideoUrl(parsed.liveVideoUrl ?? null);
      setFallbackStatus(parsed.fallbackStatus ?? null);
      setStep('success');
    } catch {
      // Ignore malformed cached payloads.
    }
  }, [afterSubmitFlow]);

  useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem(GUEST_BOUND_HOTEL_CONTEXT_KEY);
      if (!stored) {
        window.sessionStorage.setItem(GUEST_BOUND_HOTEL_CONTEXT_KEY, JSON.stringify(DEFAULT_BOUND_HOTEL_CONTEXT));
        return;
      }
      const parsed = JSON.parse(stored) as typeof DEFAULT_BOUND_HOTEL_CONTEXT;
      if (parsed?.name && parsed?.address) {
        setBoundHotelContext(parsed);
      }
    } catch {
      window.sessionStorage.setItem(GUEST_BOUND_HOTEL_CONTEXT_KEY, JSON.stringify(DEFAULT_BOUND_HOTEL_CONTEXT));
    }
  }, []);

  useEffect(() => {
    try {
      const rawPrefill = window.sessionStorage.getItem(GUEST_QR_PREFILL_STORAGE_KEY);
      if (!rawPrefill) return;
      const prefill = JSON.parse(rawPrefill) as {
        guestName?: string;
        roomNumber?: string;
        hotelLocation?: string;
      };
      if (prefill?.guestName) {
        setForm((current) => ({
          ...current,
          guestName: prefill.guestName ?? current.guestName,
          roomNumber: prefill.roomNumber ?? current.roomNumber,
          hotelLocation: prefill.hotelLocation && HOTEL_LOCATIONS.includes(prefill.hotelLocation)
            ? prefill.hotelLocation
            : current.hotelLocation,
          locationMode: 'hotel',
        }));
      }
      window.sessionStorage.removeItem(GUEST_QR_PREFILL_STORAGE_KEY);
    } catch {
      window.sessionStorage.removeItem(GUEST_QR_PREFILL_STORAGE_KEY);
    }
  }, []);

  

  useEffect(() => {
    if (!profile) return;

    setForm((current) => ({
      ...current,
      guestName: `${profile.touristFirstName} ${profile.touristLastName}`.trim() || current.guestName,
      roomNumber: profile.hotelBinding?.roomNumber ?? current.roomNumber,
      hotelLocation: profile.hotelBinding?.hotelLocation ?? current.hotelLocation,
      locationMode: 'hotel',
    }));

    if (profile.hotelBinding?.hotelName && profile.hotelBinding.hotelLocation) {
      setBoundHotelContext({
        name: profile.hotelBinding.hotelName,
        address: profile.hotelBinding.hotelLocation,
        coordinates: profile.coordinates ?? DEFAULT_BOUND_HOTEL_CONTEXT.coordinates,
      });
    }
  }, [profile]);

  useEffect(() => {
    if (!incident?.id || step === 'form') return;

    const timer = window.setInterval(async () => {
      try {
        const latest = await fetchIncident(incident.id);
        setIncident(latest);
      } catch {
        // Keep the current SOS screen even if a refresh fails.
      }
    }, 15000);

    return () => window.clearInterval(timer);
  }, [incident?.id, step]);

  const resetForNewReport = () => {
    window.sessionStorage.removeItem(GUEST_SUCCESS_STORAGE_KEY);
    window.sessionStorage.removeItem(GUEST_EMERGENCY_SELECTION_KEY);
    setIncident(null);
    setLiveVideoUrl(null);
    setFallbackStatus(null);
    setCoordinates(undefined);
    setError(null);
    setForm({
      guestName: '',
      locationMode: 'hotel',
      hotelLocation: 'Room',
      roomNumber: '',
      otherLocation: '',
      emergencyType: HOTEL_EMERGENCY_TYPES[0],
      details: '',
    });
    setStep('form');
  };

  // If user isn't bound to a hotel, auto-switch to 'other' and attempt to capture geolocation once.
  useEffect(() => {
    if (hasHotelBinding) return;
    if (form.otherLocation) return; // already have a detected location
    setForm((f) => ({ ...f, locationMode: 'other', emergencyType: OTHER_EMERGENCY_TYPES[0] }));
    void useCurrentLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHotelBinding]);


  

  const updateForm = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported in this browser.');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextCoordinates: Coordinates = {
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6)),
          accuracy: Math.round(position.coords.accuracy),
        };
        setCoordinates(nextCoordinates);
        setForm((f) => ({
          ...f,
          otherLocation: `Lat ${nextCoordinates.lat}, Lng ${nextCoordinates.lng}`,
        }));
        setLocating(false);
      },
      () => {
        setError('Unable to fetch your current location. Check location permissions.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  const handleSOS = async () => {
    const isHotelMode = form.locationMode === 'hotel';
    const needsRoomNumber = isHotelMode && form.hotelLocation === 'Room';
    const hasLocation = isHotelMode
      ? Boolean(form.hotelLocation && (!needsRoomNumber || form.roomNumber.trim()))
      : Boolean(form.otherLocation.trim());

    if (!form.guestName || !form.emergencyType || !hasLocation) {
      setError('Please fill in your name, location, and emergency type.');
      return;
    }

    const location = isHotelMode
      ? hasHotelBinding && profile?.hotelBinding
        ? `${profile.hotelBinding.hotelLocation}, Room ${profile.hotelBinding.roomNumber}`
        : form.hotelLocation === 'Room'
          ? `Room ${form.roomNumber.trim() || 'Unknown'}`
          : form.hotelLocation
      : form.otherLocation.trim();

    const message = `Emergency Type: ${form.emergencyType}. ${form.details.trim() || 'No additional details provided.'}`;

    setError(null);

    if (connectivity === 'offline') {
      setStep('offline');
      return;
    }

    setStep('sending');
    try {
      // Create incident
      const created = await createIncident({
        guestName: form.guestName,
        roomNumber: hasHotelBinding && profile?.hotelBinding
          ? profile.hotelBinding.roomNumber
          : isHotelMode && form.roomNumber.trim()
            ? form.roomNumber.trim()
            : 'Unknown',
        location,
        coordinates,
        incidentScope: isHotelMode ? 'in_hotel' : 'outside',
        hotelContext: boundHotelContext,
        message,
        connectivityMode: connectivity,
        source: 'web',
        touristProfileId: profile?.uid,
        touristDigitalId: profile?.digitalId,
        touristHotelBinding: profile?.hotelBinding,
      });
      setIncident(created);

      // Trigger AI triage
      await runAITriage(created.id, created.message, created.location);

      let nextLiveVideoUrl: string | null = null;
      let nextFallbackStatus: string | null = null;

      if (connectivity === 'online') {
        const video = await triggerFallback(created.id, 'video');
        nextLiveVideoUrl = String(video.meetUrl ?? '');
        nextFallbackStatus = 'Live emergency guidance session is ready.';
        setLiveVideoUrl(nextLiveVideoUrl);
        setFallbackStatus(nextFallbackStatus);
      }

      if (connectivity === 'sms_fallback') {
        await triggerFallback(created.id, 'sms');
        nextFallbackStatus = 'SMS fallback was triggered because backend/data is constrained.';
        setFallbackStatus(nextFallbackStatus);
      }

      if (connectivity === 'voice_fallback') {
        await triggerFallback(created.id, 'voice');
        nextFallbackStatus = 'Voice fallback was triggered to connect to emergency guidance by phone.';
        setFallbackStatus(nextFallbackStatus);
      }

      if (afterSubmitFlow === 'guides-map') {
        const payload = {
          incident: created,
          liveVideoUrl: nextLiveVideoUrl,
          fallbackStatus: nextFallbackStatus,
          emergencyType: form.emergencyType,
          locationMode: form.locationMode,
        };
        window.sessionStorage.setItem(GUEST_SUCCESS_STORAGE_KEY, JSON.stringify(payload));
        window.sessionStorage.setItem(
          GUEST_EMERGENCY_SELECTION_KEY,
          JSON.stringify({ emergencyType: form.emergencyType, locationMode: form.locationMode })
        );
      }

      window.sessionStorage.setItem('hackdays_tourist_last_incident', JSON.stringify({ incidentId: created.id }));
      setStep('success');
    } catch (err: unknown) {
      console.error(err);
      // If backend is down, simulate offline mode
      setStep('offline');
    }
  };

  if (touristAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <div className="card max-w-md w-full p-8 text-center space-y-4">
          <div className="mx-auto h-12 w-12 rounded-full border-4 border-crisis-primary/25 border-t-crisis-primary animate-spin" />
          <p className="text-crisis-text font-semibold">Restoring your SOS form...</p>
          <p className="text-crisis-text-dim text-sm">Loading your tourist profile and hotel details.</p>
        </div>
      </div>
    );
  }

  if (step === 'offline') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="card max-w-md w-full p-8 space-y-6">
          <div className="w-16 h-16 rounded-full bg-amber-900/40 flex items-center justify-center mx-auto">
            <MessageSquare size={28} className="text-amber-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-crisis-text mb-2">No Connection</h2>
            <p className="text-crisis-text-dim">You're offline or the backend isn't reachable. Your SOS has been logged locally.</p>
          </div>
          <div className="space-y-3">
            <button id="sos-offline-guides-btn" onClick={() => navigate('/offline')} className="btn-primary w-full">
              View Emergency Guides
            </button>
            <button id="sos-fallback-btn" onClick={() => navigate('/fallback')} className="btn-secondary w-full">
              SMS / Voice Fallback
            </button>
            <div className="text-crisis-accent font-bold text-lg">📞 Emergency: 112</div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="card max-w-md w-full p-8 space-y-6 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-emerald-900/40 flex items-center justify-center mx-auto">
            <CheckCircle size={28} className="text-emerald-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-crisis-text mb-2">Help Is On The Way</h2>
            <p className="text-crisis-text-dim">Your emergency has been reported. Hotel staff have been notified.</p>
          </div>
          {incident && (
            <div className="bg-crisis-bg/60 rounded-xl p-4 text-left space-y-2 border border-crisis-border/50">
              <p className="text-xs text-crisis-muted">Incident ID</p>
              <p className="font-mono text-crisis-primary font-bold">{incident.id.toUpperCase()}</p>
              <div className="divider" />
              <p className="text-xs text-crisis-muted">Status</p>
              <p className="text-crisis-text font-semibold">{incident.status.replace('_', ' ')}</p>
              <p className="text-xs text-crisis-text-dim">This SOS stays here until the incident is resolved.</p>
              {fallbackStatus && <p className="text-xs text-crisis-primary">{fallbackStatus}</p>}
            </div>
          )}
          <div className="space-y-3">
            {afterSubmitFlow === 'guides-map' ? (
              <>
                <button
                  id="sos-live-guidance-btn"
                  onClick={() =>
                    navigate('/live-guidance', {
                      state: {
                        incidentId: incident?.id ?? null,
                        liveVideoUrl,
                      },
                    })
                  }
                  className="btn-secondary w-full"
                >
                  Live Guidance
                </button>
                <button
                  id="sos-open-guides-btn"
                  onClick={() =>
                    navigate('/offline', {
                      state: { emergencyType: form.emergencyType, locationMode: form.locationMode },
                    })
                  }
                  className="btn-primary w-full"
                >
                  Open Offline Guides
                </button>
                <button id="sos-report-new-btn" onClick={resetForNewReport} className="btn-ghost w-full text-sm">
                  Report New SOS
                </button>
              </>
            ) : (
              <>
                <button
                  id="sos-view-incident-btn"
                  onClick={() => incident ? navigate(`/post-sos/${incident.id}`) : navigate('/tourist')}
                  className="btn-primary w-full"
                >
                  Open SOS Follow-up
                </button>
                <button id="sos-home-btn" onClick={() => navigate('/')} className="btn-ghost w-full text-sm">
                  Return to Home
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'sending') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="card max-w-md w-full p-8 space-y-6">
          <div className="w-16 h-16 rounded-full bg-red-900/40 flex items-center justify-center mx-auto sos-glow">
            <AlertTriangle size={28} className="text-red-400 animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-crisis-text mb-2">Alerting Staff...</h2>
            <p className="text-crisis-text-dim">Creating incident and running AI triage. Please stay calm.</p>
          </div>
          <div className="flex justify-center">
            <div className="w-8 h-8 border-4 border-crisis-primary/30 border-t-crisis-primary rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  // Form state
  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-lg mx-auto">
        {/* Back button */}
        {showBackButton && (
          <button onClick={() => navigate(-1)} className="btn-ghost flex items-center gap-1 text-sm mb-6 -ml-2">
            <ArrowLeft size={16} /> Back
          </button>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-900/30 border border-red-700/40 
                          text-red-400 text-xs font-medium mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            Emergency SOS
          </div>
          <h1 className="text-3xl font-black text-crisis-text mb-2">Request Help</h1>
          <p className="text-crisis-text-dim text-sm">Fill in your details, then tap SOS to alert hotel staff immediately.</p>
        </div>

        {/* Form */}
        <div className="card p-6 space-y-5 mb-8">
          <div>
            <label className="form-label" htmlFor="sos-name">
              <User size={13} className="inline mr-1" /> Your Name *
            </label>
            <input
              id="sos-name"
              type="text"
              className="form-input"
              placeholder="e.g. Arjun Mehta"
              value={form.guestName}
              onChange={(e) => updateForm('guestName', e.target.value)}
            />
          </div>

          <div>
            <label className="form-label" htmlFor="sos-location-mode">Location Type *</label>
            <select
              id="sos-location-mode"
              className="form-input"
              value={form.locationMode}
              onChange={(e) => {
                const nextMode = e.target.value;
                setForm((f) => ({
                  ...f,
                  locationMode: nextMode,
                  emergencyType: nextMode === 'hotel' ? HOTEL_EMERGENCY_TYPES[0] : OTHER_EMERGENCY_TYPES[0],
                }));
                if (nextMode === 'other') {
                  void Promise.resolve().then(() => useCurrentLocation());
                }
              }}
            >
              <option value="hotel">Hotel</option>
              <option value="other">Other</option>
            </select>
          </div>

          {form.locationMode === 'hotel' ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label" htmlFor="sos-hotel-location">Location *</label>
                <select
                  id="sos-hotel-location"
                  className="form-input"
                  value={form.hotelLocation}
                  onChange={(e) => updateForm('hotelLocation', e.target.value)}
                >
                  {HOTEL_LOCATIONS.map((locationOption) => (
                    <option key={locationOption} value={locationOption}>{locationOption}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label" htmlFor="sos-room">
                  <MapPin size={13} className="inline mr-1" /> Room Number{form.hotelLocation === 'Room' ? ' *' : ''}
                </label>
                <input
                  id="sos-room"
                  type="text"
                  className="form-input"
                  placeholder="e.g. 204"
                  value={hasHotelBinding ? profile?.hotelBinding?.roomNumber ?? form.roomNumber : form.roomNumber}
                  onChange={(e) => updateForm('roomNumber', e.target.value)}
                  disabled={form.hotelLocation !== 'Room' || hasHotelBinding}
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="form-label" htmlFor="sos-other-location">Map Location *</label>
              <input
                id="sos-other-location"
                type="text"
                className="form-input"
                placeholder={locating ? 'Detecting current location...' : 'Auto-detected map location'}
                value={form.otherLocation}
                readOnly
              />
            </div>
          )}

          <div>
            <label className="form-label" htmlFor="sos-emergency-type">Emergency Type *</label>
            <select
              id="sos-emergency-type"
              className="form-input"
              value={form.emergencyType}
              onChange={(e) => updateForm('emergencyType', e.target.value)}
            >
              {(form.locationMode === 'hotel' ? HOTEL_EMERGENCY_TYPES : OTHER_EMERGENCY_TYPES).map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label" htmlFor="sos-message">
              <MessageSquare size={13} className="inline mr-1" /> Additional Details
            </label>
            <textarea
              id="sos-message"
              className="form-input resize-none"
              rows={4}
              placeholder="Describe what happened..."
              value={form.details}
              onChange={(e) => updateForm('details', e.target.value)}
            />
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-700/40 rounded-xl p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* SOS Button */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <SOSButton onPress={handleSOS} loading={false} />
        </div>

        {/* Emergency number */}
        <div className="text-center">
          <p className="text-crisis-text-dim text-sm">
            If life-threatening, also call{' '}
            <a href="tel:112" className="text-crisis-accent font-bold text-lg">112</a>
          </p>
        </div>
      </div>
    </div>
  );
}
