import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BadgeCheck, Camera, MapPin, QrCode, Sparkles } from 'lucide-react';
import type { Coordinates } from '../types/incident';
import { bindTouristHotel, updateTouristLocation } from '../api/client';
import { useTouristAuth } from '../auth/TouristAuthContext';

interface HotelQrPayload {
  hotelName: string;
  hotelLocation: string;
  roomNumber: string;
  nightsOfStay: number;
  hotelPhoneNumber?: string;
}

function parseHotelQrPayload(rawPayload: string): HotelQrPayload | null {
  const [hotelName, hotelLocation, roomNumber, nightsRaw, hotelPhoneNumber] = rawPayload.split('|').map((part) => part.trim());
  const nightsOfStay = Number.parseInt(nightsRaw ?? '', 10);
  if (!hotelName || !hotelLocation || !roomNumber || !Number.isFinite(nightsOfStay)) {
    return null;
  }

  return {
    hotelName,
    hotelLocation,
    roomNumber,
    nightsOfStay,
    hotelPhoneNumber: hotelPhoneNumber || undefined,
  };
}

function getBarcodeDetector(): {
  new (options?: { formats?: string[] }): { detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>> };
} | null {
  const detector = (window as unknown as { BarcodeDetector?: unknown }).BarcodeDetector;
  return detector ? (detector as never) : null;
}

const DEFAULT_COORDS: Coordinates = { lat: 28.6139, lng: 77.209 };

export function TouristPortalPage() {
  const navigate = useNavigate();
  const { profile, loading, refreshProfile } = useTouristAuth();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const [currentCoords, setCurrentCoords] = useState<Coordinates>(profile?.coordinates ?? DEFAULT_COORDS);
  const [locationLabel, setLocationLabel] = useState(profile?.currentLocation ?? 'Waiting for location');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [manualPayload, setManualPayload] = useState('');
  const [bindingBusy, setBindingBusy] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  const hasHotelBinding = Boolean(profile?.hotelBinding);

  useEffect(() => {
    if (!profile) return;
    if (profile.coordinates) {
      setCurrentCoords(profile.coordinates);
    }
    if (profile.currentLocation?.trim()) {
      setLocationLabel(profile.currentLocation);
    }
  }, [profile]);

  const stopScanner = () => {
    if (frameRef.current) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
    setCameraReady(false);
  };

  const startScanner = async () => {
    setScannerError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setScannerError('Camera access is not available in this browser. Paste the hotel QR payload manually below.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      streamRef.current = stream;
      setCameraReady(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const Detector = getBarcodeDetector();
      if (!Detector) {
        setScannerError('QR auto-detect is not supported in this browser. Paste the hotel payload manually below.');
        return;
      }

      const detector = new Detector({ formats: ['qr_code'] });

      const loop = async () => {
        if (!videoRef.current) return;
        if (videoRef.current.readyState >= 2) {
          try {
            const barcodes = await detector.detect(videoRef.current);
            const value = barcodes[0]?.rawValue?.trim();
            if (value) {
              await applyPayload(value);
              return;
            }
          } catch {
            // Continue scanning.
          }
        }

        frameRef.current = window.requestAnimationFrame(() => {
          void loop();
        });
      };

      frameRef.current = window.requestAnimationFrame(() => {
        void loop();
      });
    } catch {
      setScannerError('Could not access the camera. Allow camera permission or paste the payload manually.');
    }
  };

  const applyPayload = async (rawPayload: string) => {
    const parsed = parseHotelQrPayload(rawPayload);
    if (!parsed) {
      setScannerError('Invalid QR payload. Use: HotelName|HotelLocation|RoomNumber|NightsOfStay|HotelPhoneNumber');
      return;
    }

    setBindingBusy(true);
    try {
      await bindTouristHotel({ ...parsed, qrPayload: rawPayload });
      await refreshProfile();
      setScannerOpen(false);
      stopScanner();
    } finally {
      setBindingBusy(false);
    }
  };

  useEffect(() => {
    if (loading || !profile) return;

    const refreshLocation = () => {
      if (!navigator.geolocation) return;

      navigator.geolocation.getCurrentPosition(async (position) => {
        const coords: Coordinates = {
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6)),
          accuracy: Math.round(position.coords.accuracy),
        };
        const label = `Lat ${coords.lat}, Lng ${coords.lng}`;
        setCurrentCoords(coords);
        setLocationLabel(label);
        try {
          await updateTouristLocation(coords, label);
          await refreshProfile();
        } catch {
          // Non-blocking: local view still updates.
        }
      });
    };

    refreshLocation();
    const timer = window.setInterval(refreshLocation, 10 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [loading, profile, refreshProfile]);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div className="min-h-screen px-3 py-4 sm:px-4 sm:py-6 pb-28">
      <div className="max-w-3xl mx-auto space-y-4 sm:space-y-5">
        <section className="space-y-4 sm:space-y-5">
          <div className="card p-5 sm:p-6 space-y-4 sm:space-y-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-crisis-muted mb-1">Digital Card</p>
                <h2 className="text-3xl font-black text-crisis-text">{profile?.digitalId ?? 'Generating...'}</h2>
              </div>
              <div className="chip chip-online inline-flex items-center gap-2"><BadgeCheck size={14} /> Registered tourist</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-crisis-border/60 bg-crisis-bg/60 p-4">
                <p className="text-xs text-crisis-muted uppercase tracking-[0.2em] mb-1">Full name</p>
                <p className="text-lg font-semibold text-crisis-text">{profile ? `${profile.touristFirstName} ${profile.touristLastName}` : 'Loading...'}</p>
              </div>
              <div className="rounded-2xl border border-crisis-border/60 bg-crisis-bg/60 p-4">
                <p className="text-xs text-crisis-muted uppercase tracking-[0.2em] mb-1">Current location</p>
                <p className="text-lg font-semibold text-crisis-text">{locationLabel}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-crisis-text-dim">
              <div className="rounded-2xl bg-crisis-bg/50 border border-crisis-border/50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-crisis-muted mb-1">State</p>
                <p className="text-crisis-text font-semibold">{profile?.homeState ?? '-'}</p>
              </div>
              <div className="rounded-2xl bg-crisis-bg/50 border border-crisis-border/50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-crisis-muted mb-1">District</p>
                <p className="text-crisis-text font-semibold">{profile?.homeDistrict ?? '-'}</p>
              </div>
              <div className="rounded-2xl bg-crisis-bg/50 border border-crisis-border/50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-crisis-muted mb-1">Mobile</p>
                <p className="text-crisis-text font-semibold">+91 {profile?.phoneNumber ?? '-'}</p>
              </div>
            </div>
          </div>

          <div className="card p-5 sm:p-6 space-y-4">
            <div className="space-y-3">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-crisis-muted mb-1">Hotel registration</p>
                <h3 className="text-xl sm:text-2xl font-bold text-crisis-text">Scan QR Code to register with hotel</h3>
              </div>
              {!hasHotelBinding && (
                <button onClick={() => { setScannerOpen(true); setTimeout(() => void startScanner(), 0); }} className="btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2">
                  <QrCode size={16} /> Scan QR Code
                </button>
              )}
            </div>

            {hasHotelBinding ? (
              <div className="rounded-3xl border border-emerald-700/35 bg-emerald-950/20 p-5 space-y-3">
                <div className="flex items-center gap-2 text-emerald-300 font-semibold"><BadgeCheck size={16} /> Bound to hotel</div>
                <p className="text-crisis-text font-semibold text-lg">{profile?.hotelBinding?.hotelName}</p>
                <p className="text-crisis-text-dim text-sm">{profile?.hotelBinding?.hotelLocation}</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div className="rounded-2xl bg-black/20 p-3 border border-white/10"><span className="text-crisis-muted">Room</span><p className="text-crisis-text font-semibold">{profile?.hotelBinding?.roomNumber}</p></div>
                  <div className="rounded-2xl bg-black/20 p-3 border border-white/10"><span className="text-crisis-muted">Nights</span><p className="text-crisis-text font-semibold">{profile?.hotelBinding?.nightsOfStay}</p></div>
                  <div className="rounded-2xl bg-black/20 p-3 border border-white/10"><span className="text-crisis-muted">Contact</span><p className="text-crisis-text font-semibold">{profile?.hotelBinding?.hotelPhoneNumber ?? 'N/A'}</p></div>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-crisis-border/60 bg-crisis-bg/60 p-5 space-y-3">
                <p className="text-crisis-text-dim text-sm">
                  Scan the hotel QR to share your digital tourist data with the hotel.
                </p>
              </div>
            )}
          </div>

          <div className="card p-5 sm:p-6 space-y-4">
            <button onClick={() => navigate('/tourist-incidents')} className="btn-primary w-full inline-flex items-center justify-center gap-2">
              <MapPin size={16} /> Incidents around you
            </button>
          </div>
        </section>
      </div>

      {hasHotelBinding && (
        <button
          onClick={() => navigate('/sos')}
          className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-40 h-14 px-5 rounded-full bg-orange-500 hover:bg-orange-400 text-white font-bold shadow-[0_16px_45px_rgba(251,146,60,0.45)] inline-flex items-center gap-2"
        >
          <Sparkles size={18} /> SOS
        </button>
      )}

      {scannerOpen && (
        <div className="fixed inset-0 z-[2000] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card w-full max-w-2xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-2xl font-bold text-crisis-text">Scan hotel QR</h3>
                <p className="text-sm text-crisis-text-dim">Payload format: HotelName|HotelLocation|RoomNumber|NightsOfStay|HotelPhoneNumber</p>
              </div>
              <button onClick={() => { stopScanner(); setScannerOpen(false); }} className="btn-ghost">Close</button>
            </div>

            <video ref={videoRef} className="w-full rounded-2xl border border-crisis-border bg-black aspect-video object-cover" muted playsInline />

            {!cameraReady && (
              <p className="text-sm text-crisis-text-dim">Starting camera... if it does not open, use the manual payload field below.</p>
            )}

            {scannerError && <p className="text-sm text-amber-300">{scannerError}</p>}

            <div className="space-y-3">
              <input
                value={manualPayload}
                onChange={(e) => setManualPayload(e.target.value)}
                className="form-input w-full"
                placeholder="Paste hotel QR payload here"
              />
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => void applyPayload(manualPayload)}
                  disabled={bindingBusy}
                  className="btn-primary inline-flex items-center justify-center gap-2"
                >
                  {bindingBusy ? 'Binding...' : 'Bind hotel'}
                </button>
                <button onClick={() => { void startScanner(); }} className="btn-secondary inline-flex items-center justify-center gap-2">
                  <Camera size={16} /> Retry scanner
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
