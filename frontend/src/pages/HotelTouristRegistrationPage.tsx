import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, QrCode, RefreshCw, UsersRound } from 'lucide-react';
import QRCode from 'qrcode';
import type { TouristProfile } from '../types/tourist';
import { fetchHotelLinkedTourists } from '../api/client';

type ManagementRole = 'hotel' | 'hotel_staff' | 'fire' | 'medical' | 'police';
const MANAGEMENT_ROLE_KEY = 'hackdays_management_role';

function parseRole(raw: string | null): ManagementRole {
  if (raw === 'fire' || raw === 'medical' || raw === 'police' || raw === 'hotel_staff') return raw;
  return 'hotel';
}

function calculateNights(startDate: string, endDate: string): number | null {
  if (!startDate || !endDate) return null;
  const start = new Date(`${startDate}T00:00:00Z`).getTime();
  const end = new Date(`${endDate}T00:00:00Z`).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  return Math.max(1, Math.floor((end - start) / (1000 * 60 * 60 * 24)));
}

function normalizePhoneNumber(value: string | undefined): string {
  if (!value) return '';
  const normalized = value.trim().replace(/[^+\d]/g, '');
  return /^\+?\d{7,15}$/.test(normalized) ? normalized : '';
}

export function HotelTouristRegistrationPage() {
  const navigate = useNavigate();
  const role = useMemo(() => parseRole(window.sessionStorage.getItem(MANAGEMENT_ROLE_KEY)), []);
  const [roomNumber, setRoomNumber] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [qrPayload, setQrPayload] = useState('');
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [linkedTourists, setLinkedTourists] = useState<TouristProfile[]>([]);
  const [loadingLinked, setLoadingLinked] = useState(false);

  const hotelName = (import.meta.env.VITE_HOTEL_NAME?.trim() ?? 'OverClock Tower');
  const hotelLocation = (import.meta.env.VITE_HOTEL_LOCATION?.trim() ?? 'Assam, Guwahati');
  const hotelPhoneNumber = normalizePhoneNumber(import.meta.env.VITE_TWILIO_SMS_NUMBER?.trim());
  const nightsOfStay = calculateNights(startDate, endDate);

  const loadLinkedTourists = async () => {
    setLoadingLinked(true);
    try {
      const data = await fetchHotelLinkedTourists({
        hotelName,
        hotelLocation,
        roomNumber: roomNumber.trim() || undefined,
      });
      setLinkedTourists(data);
    } catch {
      setLinkedTourists([]);
    } finally {
      setLoadingLinked(false);
    }
  };

  useEffect(() => {
    if (!roomNumber.trim() || !startDate || !endDate || !nightsOfStay) {
      setQrPayload('');
      setQrImageUrl(null);
      return;
    }

    const payload = [
      hotelName,
      hotelLocation,
      roomNumber.trim(),
      String(nightsOfStay),
      hotelPhoneNumber,
      startDate,
      endDate,
    ].join('|');

    setQrPayload(payload);
    void QRCode.toDataURL(payload, {
      width: 320,
      margin: 1,
      color: { dark: '#0b1020', light: '#ffffff' },
    }).then(setQrImageUrl).catch(() => {
      setQrImageUrl(null);
      setError('Unable to generate QR right now.');
    });
  }, [endDate, hotelLocation, hotelName, hotelPhoneNumber, nightsOfStay, roomNumber, startDate]);

  useEffect(() => {
    void loadLinkedTourists();
  }, [hotelLocation, hotelName]);

  if (role !== 'hotel') {
    return (
      <div className="min-h-screen px-4 py-10">
        <div className="max-w-3xl mx-auto card p-6 sm:p-8 space-y-4">
          <h1 className="text-2xl font-black text-crisis-text">Hotel Access Only</h1>
          <p className="text-crisis-text-dim">This registration page is only available for the Hotel management role.</p>
          <button onClick={() => navigate('/staff')} className="btn-primary w-fit">Back to Command Center</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 sm:py-10">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <button onClick={() => navigate('/staff')} className="btn-ghost inline-flex items-center gap-2 text-sm">
            <ArrowLeft size={16} /> Back to Command Center
          </button>
          <button onClick={() => void loadLinkedTourists()} className="btn-ghost inline-flex items-center gap-2 text-sm" disabled={loadingLinked}>
            <RefreshCw size={14} className={loadingLinked ? 'animate-spin' : ''} /> Refresh linked tourists
          </button>
        </div>

        <section className="card p-6 sm:p-7 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-crisis-muted mb-1">Hotel command center</p>
            <h1 className="text-3xl font-black text-crisis-text inline-flex items-center gap-2"><QrCode size={20} className="text-cyan-300" /> Register Tourist</h1>
            <p className="text-crisis-text-dim text-sm mt-2">Generate QR with room and stay duration. Tourist scans it to bind profile with hotel.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="form-label">Room Number</label>
              <input className="form-input" value={roomNumber} onChange={(event) => setRoomNumber(event.target.value)} placeholder="204" />
            </div>
            <div>
              <label className="form-label">Start Date</label>
              <input className="form-input" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </div>
            <div>
              <label className="form-label">End Date</label>
              <input className="form-input" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
            </div>
          </div>

          <div className="rounded-2xl border border-crisis-border/70 bg-crisis-bg/60 p-3 text-xs text-crisis-text-dim">
            <div>Hotel: <span className="text-crisis-text">{hotelName}</span> · <span className="text-crisis-text">{hotelLocation}</span></div>
            <div>Contact: <span className="text-crisis-text">{hotelPhoneNumber}</span></div>
            <div>Nights: <span className="text-crisis-text">{nightsOfStay ?? '-'}</span></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4">
            <div className="rounded-2xl border border-crisis-border/60 bg-white/95 p-4 flex items-center justify-center min-h-[320px]">
              {qrImageUrl ? (
                <img src={qrImageUrl} alt="Hotel registration QR" className="w-72 h-72 object-contain" />
              ) : (
                <p className="text-slate-600 text-sm text-center">Enter room number, start date, and end date to generate QR.</p>
              )}
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-crisis-border/60 bg-crisis-bg/60 p-3 text-xs text-crisis-text-dim break-all">
                <p className="mb-1 text-crisis-text">QR Payload</p>
                <p>{qrPayload || 'Payload will appear here after form completion.'}</p>
              </div>
              <button
                type="button"
                className="btn-secondary text-sm"
                onClick={async () => {
                  if (!qrPayload) {
                    setError('Complete room and date fields first.');
                    return;
                  }
                  try {
                    await navigator.clipboard.writeText(qrPayload);
                    setError(null);
                  } catch {
                    setError('Could not copy payload. Copy manually from the box.');
                  }
                }}
              >
                Copy Payload
              </button>
              {error && <p className="text-sm text-amber-300">{error}</p>}
            </div>
          </div>
        </section>

        <section className="card p-5 sm:p-6 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-base font-semibold text-crisis-text inline-flex items-center gap-2"><UsersRound size={16} /> Tourists linked to this hotel</p>
            <p className="text-xs text-crisis-text-dim">{linkedTourists.length} found</p>
          </div>

          {loadingLinked ? (
            <p className="text-sm text-crisis-text-dim">Loading linked tourists...</p>
          ) : linkedTourists.length === 0 ? (
            <p className="text-sm text-crisis-text-dim">No linked tourist records yet for current filters.</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {linkedTourists.map((tourist) => (
                <div key={tourist.uid} className="rounded-xl border border-crisis-border/50 bg-crisis-bg/70 p-3 text-sm">
                  <p className="font-semibold text-crisis-text">{tourist.touristFirstName} {tourist.touristLastName}</p>
                  <p className="text-crisis-text-dim text-xs">{tourist.digitalId} · +91 {tourist.phoneNumber}</p>
                  <p className="text-crisis-text-dim text-xs mt-1">Room {tourist.hotelBinding?.roomNumber} · {tourist.hotelBinding?.stayStartDate ?? '-'} to {tourist.hotelBinding?.stayEndDate ?? '-'}</p>
                  <p className="text-crisis-text-dim text-xs">Last location: {tourist.currentLocation || 'Unavailable'}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
