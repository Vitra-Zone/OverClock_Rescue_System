import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, MapPin, MessageSquare } from 'lucide-react';
import type { Coordinates } from '@overclock/shared/types';
import { createIncident, runAITriage, triggerFallback } from '@overclock/shared/api';
import { useTouristAuth } from '../auth/TouristAuthContext';
import { SOSButton } from '../components/SOSButton';

export function SOSScreen() {
  const navigate = useNavigate();
  const { profile } = useTouristAuth();
  const [guestName, setGuestName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [location, setLocation] = useState('');
  const [message, setMessage] = useState('');
  const [coordinates, setCoordinates] = useState<Coordinates | undefined>(profile?.coordinates);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setGuestName(`${profile.touristFirstName} ${profile.touristLastName}`.trim());
    setRoomNumber(profile.hotelBinding?.roomNumber ?? '');
    setLocation(profile.currentLocation ?? profile.hotelBinding?.hotelLocation ?? '');
  }, [profile]);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported on this device.');
      return;
    }

    navigator.geolocation.getCurrentPosition((position) => {
      const coords: Coordinates = {
        lat: Number(position.coords.latitude.toFixed(6)),
        lng: Number(position.coords.longitude.toFixed(6)),
        accuracy: Math.round(position.coords.accuracy),
      };
      setCoordinates(coords);
      setLocation(`Lat ${coords.lat}, Lng ${coords.lng}`);
    }, () => setError('Unable to fetch location. Allow location access and try again.'), {
      enableHighAccuracy: true,
      timeout: 10000,
    });
  };

  const handleSOS = async () => {
    if (!guestName.trim() || !location.trim() || !message.trim()) {
      setError('Please fill in your name, location, and message.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const created = await createIncident({
        guestName: guestName.trim(),
        roomNumber: roomNumber.trim() || 'Unknown',
        location: location.trim(),
        coordinates,
        incidentScope: 'in_hotel',
        hotelContext: profile?.hotelBinding ? { name: profile.hotelBinding.hotelName, address: profile.hotelBinding.hotelLocation, coordinates } : undefined,
        message: message.trim(),
        connectivityMode: 'online',
        source: 'web',
        touristProfileId: profile?.uid,
        touristDigitalId: profile?.digitalId,
        touristHotelBinding: profile?.hotelBinding,
      });

      await runAITriage(created.id, created.message, created.location);
      await triggerFallback(created.id, 'video');
      navigate(`/post-sos/${created.id}`);
    } catch {
      setError('Could not submit SOS right now. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="rounded-3xl border border-red-500/30 bg-red-950/30 p-5">
          <div className="flex items-center gap-3 text-red-300">
            <AlertTriangle size={20} />
            <h1 className="text-2xl font-black text-white">Emergency SOS</h1>
          </div>
          <p className="mt-2 text-sm text-red-100/80">Send a new emergency report and route it through the tourist response flow.</p>
        </div>

        <div className="rounded-3xl border border-slate-700 bg-slate-900 p-5 space-y-4">
          <label className="block space-y-2">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Your name</span>
            <input className="form-input w-full" value={guestName} onChange={(e) => setGuestName(e.target.value)} />
          </label>
          <label className="block space-y-2">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Room number</span>
            <input className="form-input w-full" value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} />
          </label>
          <label className="block space-y-2">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Location</span>
            <input className="form-input w-full" value={location} onChange={(e) => setLocation(e.target.value)} />
          </label>
          <label className="block space-y-2">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400">What happened?</span>
            <textarea className="form-input w-full min-h-32" value={message} onChange={(e) => setMessage(e.target.value)} />
          </label>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="grid gap-3 sm:grid-cols-2">
            <button onClick={useCurrentLocation} className="btn-secondary inline-flex items-center justify-center gap-2">
              <MapPin size={16} /> Use current location
            </button>
            <button onClick={handleSOS} disabled={busy} className="btn-primary inline-flex items-center justify-center gap-2">
              <MessageSquare size={16} /> {busy ? 'Sending...' : 'Send SOS'}
            </button>
          </div>

          <SOSButton loading={busy} onClick={handleSOS} />
          <button onClick={() => navigate('/tourist')} className="btn-ghost w-full text-sm">Back to dashboard</button>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-900 p-4 text-sm text-slate-300">
          After the SOS is created, the app opens the post-SOS follow-up page automatically.
        </div>
      </div>
    </div>
  );
}
