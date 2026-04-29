import { useEffect, useMemo } from 'react';
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { divIcon } from 'leaflet';
import type { Coordinates, Incident } from '@overclock/shared/types';
import { calculateDistanceKm } from '@overclock/shared/utils';

interface Props {
  center: Coordinates;
  incidents: Incident[];
  radiusKm?: number;
  title?: string;
  selectedIncidentId?: string;
  onSelectIncident?: (incident: Incident) => void;
  recenterToken?: number;
}

function toLatLng(coords: Coordinates): [number, number] {
  return [coords.lat, coords.lng];
}

function MapRecenter({ center, token }: { center: Coordinates; token?: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView(toLatLng(center), map.getZoom(), { animate: false });
  }, [center, map, token]);

  return null;
}

function makePinIcon(color: string, active = false) {
  return divIcon({
    className: '',
    html: `
      <div style="position:relative; width:${active ? '34px' : '30px'}; height:${active ? '42px' : '38px'}; transform: translateY(-2px);">
        <div style="position:absolute; inset:0; background:${color}; clip-path: polygon(50% 100%, 14% 60%, 14% 31%, 31% 12%, 69% 12%, 86% 31%, 86% 60%); border-radius: 18px 18px 22px 22px; box-shadow: 0 12px 26px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.25);"></div>
        <div style="position:absolute; left:50%; top:10px; transform:translateX(-50%); width:${active ? '11px' : '9px'}; height:${active ? '11px' : '9px'}; border-radius:999px; background:rgba(255,255,255,0.96); box-shadow:0 0 0 3px rgba(255,255,255,0.18);"></div>
      </div>
    `,
    iconSize: [34, 42],
    iconAnchor: [17, 40],
    popupAnchor: [0, -38],
  });
}

export function TouristIncidentMap({ center, incidents, radiusKm = 10, title = 'Nearby incidents', selectedIncidentId, onSelectIncident, recenterToken }: Props) {
  const nearby = useMemo(() => {
    return incidents
      .filter((incident) => incident.coordinates)
      .map((incident) => ({
        incident,
        distance: calculateDistanceKm(center, incident.coordinates!),
      }))
      .filter((entry) => entry.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 20);
  }, [center, incidents, radiusKm]);

  return (
    <div className="relative h-full min-h-[32rem] overflow-hidden rounded-3xl border border-slate-700 bg-[#0b1020]">
      <div className="absolute top-3 left-3 z-10 rounded-full bg-black/55 px-3 py-1 text-xs text-white backdrop-blur">{title}</div>
      <MapContainer center={toLatLng(center)} zoom={13} className="h-full w-full z-0" scrollWheelZoom>
        <MapRecenter center={center} token={recenterToken} />
        <TileLayer
          attribution='&copy; OpenStreetMap contributors &copy; CARTO'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <Circle center={toLatLng(center)} radius={radiusKm * 1000} pathOptions={{ color: '#f97316', fillColor: '#f97316', fillOpacity: 0.08, weight: 1 }} />
        <Marker position={toLatLng(center)} icon={makePinIcon('#f97316', true)}>
          <Popup>
            <div className="text-sm space-y-1">
              <strong>You are here</strong>
              <div>{center.lat.toFixed(5)}, {center.lng.toFixed(5)}</div>
            </div>
          </Popup>
        </Marker>

        {nearby.map(({ incident, distance }) => {
          const active = selectedIncidentId === incident.id;
          return (
            <Marker
              key={incident.id}
              position={toLatLng(incident.coordinates!)}
              icon={makePinIcon(active ? '#fbbf24' : '#ef4444', active)}
              eventHandlers={{ click: () => onSelectIncident?.(incident) }}
            >
              <Popup>
                <div className="text-sm space-y-1">
                  <strong>{incident.incidentType.toUpperCase()}</strong>
                  <div>{incident.location}</div>
                  <div className="text-xs text-slate-500">{distance.toFixed(1)} km away</div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/55" />
    </div>
  );
}
