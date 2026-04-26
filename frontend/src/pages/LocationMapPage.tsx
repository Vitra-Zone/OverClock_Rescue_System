import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Building2, MapPin, Route, Navigation2, ChevronRight, AlertTriangle } from 'lucide-react';
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer } from 'react-leaflet';
import type { Incident } from '../types/incident';
import { fetchIncidents } from '../api/client';
import { HOTEL_SAFETY_INFO } from '../data/emergencyGuides';

interface Marker {
  label: string;
  coords: [number, number];
  color: string;
  desc: string;
}

const HOTEL_CENTER: [number, number] = [12.9716, 77.5946];

const PRESET_LOCATION_COORDS: Array<{ keys: string[]; coords: [number, number] }> = [
  { keys: ['pool'], coords: [12.9721, 77.5939] },
  { keys: ['lobby', 'reception', 'ground floor'], coords: [12.9714, 77.5942] },
  { keys: ['room 204', 'floor 2', 'second floor'], coords: [12.9727, 77.5954] },
  { keys: ['kitchen'], coords: [12.9711, 77.5938] },
  { keys: ['parking', 'car park'], coords: [12.9707, 77.5949] },
];

function resolveIncidentCoords(incident: Incident | null): [number, number] {
  const text = `${incident?.location ?? ''} ${incident?.message ?? ''}`.toLowerCase();
  const preset = PRESET_LOCATION_COORDS.find((item) => item.keys.some((key) => text.includes(key)));
  return preset?.coords ?? HOTEL_CENTER;
}

function buildContextPoints(base: [number, number]) {
  const nearestExitCoords: [number, number] = [base[0] - 0.00065, base[1] + 0.00045];
  const assemblyCoords: [number, number] = [base[0] - 0.0012, base[1] + 0.0009];
  return { nearestExitCoords, assemblyCoords };
}

function pickMapContext(incident: Incident | null) {
  const text = `${incident?.location ?? ''} ${incident?.incidentType ?? ''} ${incident?.message ?? ''}`.toLowerCase();
  const incidentCoords = resolveIncidentCoords(incident);
  const { nearestExitCoords, assemblyCoords } = buildContextPoints(incidentCoords);

  if (text.includes('pool')) {
    return {
      title: 'Pool Area & North Wing',
      nearestExit: HOTEL_SAFETY_INFO.exits[0],
      assemblyPoint: HOTEL_SAFETY_INFO.assemblyPoints[1],
      route: 'Proceed toward the main lobby corridor, then exit via the front car park.',
      markers: [
        { label: 'Pool Area', coords: incidentCoords, color: '#60A5FA', desc: 'Incident reported near the pool' },
        { label: 'Main Exit', coords: nearestExitCoords, color: '#34D399', desc: 'Fastest route to safety' },
        { label: 'Assembly', coords: assemblyCoords, color: '#A78BFA', desc: 'Safe gathering point' },
      ] as Marker[],
      mapCenter: incidentCoords,
      routePolyline: [incidentCoords, nearestExitCoords, assemblyCoords] as [number, number][],
    };
  }

  if (text.includes('ground') || text.includes('lobby') || text.includes('reception')) {
    return {
      title: 'Ground Floor / Lobby',
      nearestExit: HOTEL_SAFETY_INFO.exits[0],
      assemblyPoint: HOTEL_SAFETY_INFO.assemblyPoints[0],
      route: 'Use the main exit directly from the lobby, then move to Gate A.',
      markers: [
        { label: 'Lobby', coords: incidentCoords, color: '#F87171', desc: 'Current incident location' },
        { label: 'Reception', coords: [incidentCoords[0] + 0.0004, incidentCoords[1] - 0.0004], color: '#60A5FA', desc: 'Front desk coordination' },
        { label: 'Main Exit', coords: nearestExitCoords, color: '#34D399', desc: 'Preferred exit path' },
      ] as Marker[],
      mapCenter: incidentCoords,
      routePolyline: [incidentCoords, nearestExitCoords, assemblyCoords] as [number, number][],
    };
  }

  if (text.includes('floor 2') || text.includes('room 2') || text.includes('204')) {
    return {
      title: 'Second Floor / West Wing',
      nearestExit: HOTEL_SAFETY_INFO.exits[1],
      assemblyPoint: HOTEL_SAFETY_INFO.assemblyPoints[0],
      route: 'Move to the west stairwell and descend to the front car park assembly point.',
      markers: [
        { label: 'Room 204', coords: incidentCoords, color: '#F87171', desc: 'Incident location' },
        { label: 'West Stairwell', coords: [incidentCoords[0] - 0.0005, incidentCoords[1] - 0.0006], color: '#34D399', desc: 'Nearest safe stairwell' },
        { label: 'Front Exit', coords: nearestExitCoords, color: '#60A5FA', desc: 'Evacuation destination' },
      ] as Marker[],
      mapCenter: incidentCoords,
      routePolyline: [incidentCoords, nearestExitCoords, assemblyCoords] as [number, number][],
    };
  }

  return {
    title: 'Hotel Overview Map',
    nearestExit: HOTEL_SAFETY_INFO.exits[0],
    assemblyPoint: HOTEL_SAFETY_INFO.assemblyPoints[0],
    route: 'Use the closest marked stairwell, then exit to the front car park.',
    markers: [
      { label: 'Current Area', coords: incidentCoords, color: '#F87171', desc: 'Selected incident location' },
      { label: 'Main Exit', coords: nearestExitCoords, color: '#34D399', desc: 'Primary exit' },
      { label: 'Security Desk', coords: [incidentCoords[0] - 0.0002, incidentCoords[1] + 0.0006], color: '#A78BFA', desc: 'Staff control point' },
    ] as Marker[],
    mapCenter: incidentCoords,
    routePolyline: [incidentCoords, nearestExitCoords, assemblyCoords] as [number, number][],
  };
}

export function LocationMapPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(id ?? '');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchIncidents();
        setIncidents(data);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  useEffect(() => {
    if (id) setSelectedId(id);
  }, [id]);

  useEffect(() => {
    if (!selectedId && incidents[0]?.id) {
      setSelectedId(incidents[0].id);
    }
  }, [incidents, selectedId]);

  const selectedIncident = incidents.find((incident) => incident.id === selectedId) ?? incidents[0] ?? null;
  const mapContext = useMemo(() => pickMapContext(selectedIncident), [selectedIncident]);

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-crisis-muted mb-2">Location module</p>
            <h1 className="text-3xl font-black text-crisis-text">Hotel Map & Response Route</h1>
            <p className="text-crisis-text-dim text-sm mt-1">Incident location, nearest exit, and assembly point in one view.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => navigate('/dashboard')} className="btn-secondary">Dashboard</button>
            <button onClick={() => navigate('/staff')} className="btn-secondary">Staff</button>
            <button onClick={() => navigate('/guest')} className="btn-primary">Guest</button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6 items-start">
          <section className="card p-6 space-y-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-crisis-muted mb-1">Selected incident</p>
                <h2 className="text-2xl font-bold text-crisis-text">
                  {loading ? 'Loading incidents...' : selectedIncident ? `${selectedIncident.id.toUpperCase()} · ${selectedIncident.incidentType}` : 'No incident selected'}
                </h2>
              </div>
              <select
                className="form-input max-w-[240px]"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
              >
                {!incidents.length && <option value="">No incidents available</option>}
                {incidents.map((incident) => (
                  <option key={incident.id} value={incident.id}>
                    {incident.id} · {incident.location}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative rounded-3xl border border-crisis-border overflow-hidden bg-black h-[460px]">
              <MapContainer
                center={mapContext.mapCenter}
                zoom={17}
                className="h-full w-full"
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <Polyline positions={mapContext.routePolyline} pathOptions={{ color: '#f97316', weight: 4 }} />

                <CircleMarker
                  center={mapContext.mapCenter}
                  radius={10}
                  pathOptions={{ color: '#f97316', fillColor: '#f97316', fillOpacity: 0.9 }}
                >
                  <Popup>
                    <div className="text-sm">
                      <strong>Incident</strong>
                      <div>{selectedIncident?.location ?? 'Unknown location'}</div>
                    </div>
                  </Popup>
                </CircleMarker>

                {mapContext.markers.map((marker) => (
                  <CircleMarker
                    key={marker.label}
                    center={marker.coords}
                    radius={8}
                    pathOptions={{ color: marker.color, fillColor: marker.color, fillOpacity: 0.8 }}
                  >
                    <Popup>
                      <div className="text-sm">
                        <strong>{marker.label}</strong>
                        <div>{marker.desc}</div>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>

              <div className="absolute top-4 left-4 right-4 z-[500] flex items-center justify-between gap-4 pointer-events-none">
                <div className="card px-3 py-2 bg-black/75 border-white/10 flex items-center gap-2 text-xs text-crisis-text-dim">
                  <Building2 size={14} className="text-crisis-primary" />
                  {mapContext.title}
                </div>
                <div className="card px-3 py-2 bg-black/75 border-white/10 text-xs text-crisis-text-dim">
                  OpenStreetMap Live View
                </div>
              </div>

              <div className="absolute bottom-4 left-4 right-4 z-[500] grid grid-cols-1 sm:grid-cols-3 gap-3 pointer-events-none">
                <div className="card p-3 bg-black/50 border-white/10">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-crisis-muted mb-1">Incident Location</p>
                  <p className="text-sm font-semibold text-crisis-text">{selectedIncident?.location ?? 'Unknown'}</p>
                </div>
                <div className="card p-3 bg-black/50 border-white/10">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-crisis-muted mb-1">Nearest Exit</p>
                  <p className="text-sm font-semibold text-crisis-text">{mapContext.nearestExit.label}</p>
                </div>
                <div className="card p-3 bg-black/50 border-white/10">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-crisis-muted mb-1">Assembly Point</p>
                  <p className="text-sm font-semibold text-crisis-text">{mapContext.assemblyPoint.label}</p>
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="card p-5 space-y-3">
              <div className="flex items-center gap-2 text-crisis-text font-semibold">
                <Route size={18} className="text-crisis-primary" />
                Response Route
              </div>
              <p className="text-crisis-text-dim text-sm leading-relaxed">{mapContext.route}</p>
              <div className="bg-crisis-bg/60 rounded-xl p-4 border border-crisis-border/50">
                <p className="text-xs uppercase tracking-[0.25em] text-crisis-muted mb-1">Nearest exit</p>
                <p className="text-crisis-text font-semibold">{mapContext.nearestExit.label}</p>
                <p className="text-sm text-crisis-text-dim">{mapContext.nearestExit.description}</p>
              </div>
              <div className="bg-crisis-bg/60 rounded-xl p-4 border border-crisis-border/50">
                <p className="text-xs uppercase tracking-[0.25em] text-crisis-muted mb-1">Assembly point</p>
                <p className="text-crisis-text font-semibold">{mapContext.assemblyPoint.label}</p>
                <p className="text-sm text-crisis-text-dim">{mapContext.assemblyPoint.description}</p>
              </div>
            </div>

            <div className="card p-5 space-y-3">
              <div className="flex items-center gap-2 text-crisis-text font-semibold">
                <Navigation2 size={18} className="text-emerald-400" />
                What responders should do
              </div>
              {[
                'Confirm the exact incident location from the guest or AI summary.',
                'Move toward the nearest exit using the safest stairwell.',
                'Assign one staff member to lead and one to stay on comms.',
                'If online, share live guidance through the AI agent page.',
              ].map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm text-crisis-text-dim">
                  <ChevronRight size={14} className="mt-0.5 text-crisis-primary shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="card p-5 space-y-3">
              <div className="flex items-center gap-2 text-crisis-text font-semibold">
                <MapPin size={18} className="text-blue-400" />
                Why this matters
              </div>
              <p className="text-sm text-crisis-text-dim leading-relaxed">
                The project currently stores location as text. This map module turns that text into a usable response route without needing Google Maps yet.
              </p>
              <button onClick={() => navigate('/agent')} className="btn-secondary w-full">
                Open AI Agent with this incident
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
