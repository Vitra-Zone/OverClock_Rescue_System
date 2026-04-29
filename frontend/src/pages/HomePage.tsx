import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, UserRound, UsersRound, ChevronRight, ScanLine, Camera, X, QrCode } from 'lucide-react';
import QRCode from 'qrcode';
import type { ConnectivityMode } from '../types/incident';

interface Props {
  connectivity: ConnectivityMode;
}

const GUEST_QR_PREFILL_STORAGE_KEY = 'hackdays_guest_qr_prefill';
const HOTEL_LOCATION_OPTIONS = ['Room', 'Pool Area', 'Lobby', 'Restaurant', 'Gym', 'Parking', 'Corridor', 'Rooftop'];

function parseGuestQrPayload(rawPayload: string) {
  const [nameRaw, roomRaw, locationRaw] = rawPayload.split('|').map((part) => part.trim());
  const guestName = nameRaw ?? '';
  const roomNumber = roomRaw ?? '';
  const hotelLocation = locationRaw ?? 'Room';

  if (!guestName || !roomNumber) {
    return null;
  }

  return {
    guestName,
    roomNumber,
    hotelLocation,
  };
}

function getBarcodeDetector():
  | {
      new (options?: { formats?: string[] }): {
        detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>;
      };
    }
  | null {
  const detector = (window as unknown as { BarcodeDetector?: unknown }).BarcodeDetector;
  return detector ? (detector as never) : null;
}

export function HomePage({ connectivity: _connectivity }: Props) {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);

  const [scannerOpen, setScannerOpen] = useState(false);
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [manualPayload, setManualPayload] = useState('');
  const [qrGuestName, setQrGuestName] = useState('Guest Name');
  const [qrRoomNumber, setQrRoomNumber] = useState('204');
  const [qrHotelLocation, setQrHotelLocation] = useState('Room');
  const [qrImageUrl, setQrImageUrl] = useState<string>('');
  const [qrError, setQrError] = useState<string | null>(null);

  const stopScanner = useCallback(() => {
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
  }, []);

  const applyQrPayload = useCallback(
    (rawPayload: string) => {
      const prefill = parseGuestQrPayload(rawPayload);
      if (!prefill) {
        setScannerError('Invalid QR payload. Use: Name|RoomNumber|HotelLocation');
        return false;
      }

      window.sessionStorage.setItem(GUEST_QR_PREFILL_STORAGE_KEY, JSON.stringify(prefill));
      stopScanner();
      setScannerOpen(false);
      navigate('/guest');
      return true;
    },
    [navigate, stopScanner]
  );

  const handleRegisterGuestViaQr = () => {
    setGeneratorOpen(false);
    setScannerError(null);
    setManualPayload('');
    setScannerOpen(true);
  };

  const handleOpenQrGenerator = () => {
    stopScanner();
    setScannerOpen(false);
    setGeneratorOpen(true);
    setQrError(null);
  };

  useEffect(() => {
    if (!generatorOpen) return;

    const guest = qrGuestName.trim();
    const room = qrRoomNumber.trim();
    if (!guest || !room) {
      setQrImageUrl('');
      return;
    }

    const payload = `${guest}|${room}|${qrHotelLocation}`;
    void QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 320,
      color: {
        dark: '#101727',
        light: '#F8FAFC',
      },
    })
      .then((dataUrl) => {
        setQrImageUrl(dataUrl);
        setQrError(null);
      })
      .catch(() => {
        setQrImageUrl('');
        setQrError('Could not generate QR right now. Try again.');
      });
  }, [generatorOpen, qrGuestName, qrRoomNumber, qrHotelLocation]);

  useEffect(() => {
    if (!scannerOpen) {
      stopScanner();
      return;
    }

    let disposed = false;

    const startScanner = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setScannerError('Camera access is not available in this browser. Paste payload manually below.');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });

        if (disposed) {
          for (const track of stream.getTracks()) {
            track.stop();
          }
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        const BarcodeDetectorCtor = getBarcodeDetector();
        if (!BarcodeDetectorCtor) {
          setScannerError('QR auto-detect is not supported in this browser. Paste payload manually below.');
          return;
        }

        const detector = new BarcodeDetectorCtor({ formats: ['qr_code'] });

        const scanLoop = async () => {
          if (disposed || !videoRef.current) return;
          if (videoRef.current.readyState >= 2) {
            try {
              const barcodes = await detector.detect(videoRef.current);
              const value = barcodes[0]?.rawValue?.trim();
              if (value) {
                applyQrPayload(value);
                return;
              }
            } catch {
              // Keep scanning; manual fallback remains available.
            }
          }
          frameRef.current = window.requestAnimationFrame(() => {
            void scanLoop();
          });
        };

        frameRef.current = window.requestAnimationFrame(() => {
          void scanLoop();
        });
      } catch {
        setScannerError('Could not access camera. Allow camera permission and try again, or paste payload manually.');
      }
    };

    void startScanner();

    return () => {
      disposed = true;
      stopScanner();
    };
  }, [applyQrPayload, scannerOpen, stopScanner]);

  return (
    <div className="h-[calc(100vh-56px)] px-4 py-6 overflow-hidden flex items-center">
      <div className="max-w-5xl mx-auto w-full">
        <section className="relative overflow-hidden card p-10 sm:p-12 min-h-[520px] flex items-center">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-24 -right-20 w-72 h-72 rounded-full bg-crisis-primary/10 blur-3xl" />
            <div className="absolute -bottom-28 -left-24 w-72 h-72 rounded-full bg-blue-500/10 blur-3xl" />
          </div>

          <div className="relative text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-crisis-bg/80 border border-crisis-border text-crisis-text-dim text-xs mb-6">
              <Shield size={14} className="text-crisis-primary" />
              Rescue OverClock
            </div>

            <h1 className="text-4xl sm:text-6xl font-black leading-none tracking-tight text-crisis-text mb-4">
              Choose your
              <span className="gradient-text"> entry path</span>
            </h1>
            <p className="text-crisis-text-dim text-base sm:text-lg max-w-2xl mx-auto mb-8">
              This prototype has two sides: guest SOS and hotel staff operations. Start by choosing who you are.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 justify-center mb-6">
              <button
                id="home-guest-btn"
                onClick={() => navigate('/guest')}
                className="card hover:border-crisis-primary/40 transition-all duration-200 p-6 text-left group active:scale-[0.99] min-h-[120px]"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-red-900/30 flex items-center justify-center text-red-400">
                      <UserRound size={24} />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-crisis-muted mb-1.5">Guest Side</p>
                      <p className="text-xl font-bold text-crisis-text">Request help instantly</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-crisis-muted group-hover:text-crisis-primary transition-colors" />
                </div>
              </button>

              <button
                id="home-staff-btn"
                onClick={() => navigate('/staff-login')}
                className="card hover:border-crisis-primary/40 transition-all duration-200 p-6 text-left group active:scale-[0.99] min-h-[120px]"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-blue-900/30 flex items-center justify-center text-blue-400">
                      <UsersRound size={24} />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-crisis-muted mb-1.5">Management Side</p>
                      <p className="text-xl font-bold text-crisis-text">Manage live incidents</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-crisis-muted group-hover:text-crisis-primary transition-colors" />
                </div>
              </button>
            </div>

            <div className="flex flex-col items-center gap-3">
              <button
                id="home-register-guest-qr-btn"
                type="button"
                onClick={handleRegisterGuestViaQr}
                className="btn-secondary inline-flex items-center gap-2 px-5 py-3"
              >
                <ScanLine size={16} />
                Scan Guest QR Code
              </button>
              <button
                id="home-generate-guest-qr-btn"
                type="button"
                onClick={handleOpenQrGenerator}
                className="btn-ghost inline-flex items-center gap-2 px-5 py-3"
              >
                <QrCode size={16} />
                Generate Guest QR Code
              </button>
              <div className="text-center text-xs text-crisis-text-dim max-w-md">
                Use the scanner for live guest intake, or submit a payload manually if the camera is unavailable.
              </div>
            </div>
          </div>
        </section>
      </div>

      {generatorOpen && (
        <div className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card w-full max-w-xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-crisis-text font-bold flex items-center gap-2">
                <QrCode size={16} className="text-crisis-primary" />
                Guest Registration QR
              </p>
              <button
                type="button"
                className="btn-ghost p-2"
                onClick={() => setGeneratorOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="qr-guest-name" className="form-label">Guest Name</label>
                <input
                  id="qr-guest-name"
                  className="form-input"
                  value={qrGuestName}
                  onChange={(e) => setQrGuestName(e.target.value)}
                  placeholder="Guest Name"
                />
              </div>
              <div>
                <label htmlFor="qr-room-number" className="form-label">Room Number</label>
                <input
                  id="qr-room-number"
                  className="form-input"
                  value={qrRoomNumber}
                  onChange={(e) => setQrRoomNumber(e.target.value)}
                  placeholder="204"
                />
              </div>
              <div>
                <label htmlFor="qr-hotel-location" className="form-label">Hotel Location</label>
                <select
                  id="qr-hotel-location"
                  className="form-input"
                  value={qrHotelLocation}
                  onChange={(e) => setQrHotelLocation(e.target.value)}
                >
                  {HOTEL_LOCATION_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-xl border border-crisis-border/60 bg-crisis-bg/60 p-3 text-xs text-crisis-text-dim">
              Payload format: Name|RoomNumber|HotelLocation
              <div className="mt-1 text-crisis-text">{`${qrGuestName.trim() || 'Guest Name'}|${qrRoomNumber.trim() || '204'}|${qrHotelLocation}`}</div>
            </div>

            <div className="rounded-xl border border-crisis-border/60 bg-white/95 p-4 flex items-center justify-center min-h-[260px]">
              {qrImageUrl ? (
                <img src={qrImageUrl} alt="Guest registration QR" className="w-64 h-64 object-contain" />
              ) : (
                <p className="text-slate-600 text-sm">Enter guest name and room number to generate QR.</p>
              )}
            </div>

            {qrError && (
              <div className="bg-amber-900/20 border border-amber-700/40 rounded-xl p-3 text-amber-200 text-sm">
                {qrError}
              </div>
            )}

            <div className="flex flex-wrap gap-2 justify-end">
              <button
                type="button"
                className="btn-ghost"
                onClick={async () => {
                  const payload = `${qrGuestName.trim()}|${qrRoomNumber.trim()}|${qrHotelLocation}`;
                  if (!qrGuestName.trim() || !qrRoomNumber.trim()) {
                    setQrError('Guest name and room number are required to copy payload.');
                    return;
                  }
                  try {
                    await navigator.clipboard.writeText(payload);
                    setQrError(null);
                  } catch {
                    setQrError('Clipboard write failed. Copy manually from payload box.');
                  }
                }}
              >
                Copy Payload
              </button>
              {qrImageUrl && (
                <a
                  href={qrImageUrl}
                  download={`guest-${(qrGuestName || 'registration').replace(/\s+/g, '-').toLowerCase()}-qr.png`}
                  className="btn-secondary"
                >
                  Download QR
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {scannerOpen && (
        <div className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card w-full max-w-lg p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-crisis-text font-bold flex items-center gap-2">
                <Camera size={16} className="text-crisis-primary" />
                Scan Guest QR
              </p>
              <button
                type="button"
                className="btn-ghost p-2"
                onClick={() => {
                  stopScanner();
                  setScannerOpen(false);
                }}
              >
                <X size={16} />
              </button>
            </div>

            <video ref={videoRef} className="w-full aspect-square rounded-xl bg-black object-cover" autoPlay muted playsInline />

            {scannerError && (
              <div className="bg-amber-900/20 border border-amber-700/40 rounded-xl p-3 text-amber-200 text-sm">
                {scannerError}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="manual-qr-payload" className="form-label">Manual Payload (Fallback)</label>
              <div className="flex gap-2">
                <input
                  id="manual-qr-payload"
                  className="form-input"
                  placeholder="Name|RoomNumber|HotelLocation"
                  value={manualPayload}
                  onChange={(e) => setManualPayload(e.target.value)}
                />
                <button
                  type="button"
                  className="btn-secondary px-4"
                  onClick={() => {
                    if (!manualPayload.trim()) {
                      setScannerError('Enter payload before submitting.');
                      return;
                    }
                    applyQrPayload(manualPayload.trim());
                  }}
                >
                  Use
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
