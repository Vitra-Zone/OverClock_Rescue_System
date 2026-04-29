export function GuestPortalPage(props: { connectivity: string }) {
  return <div className="p-4 text-white">Guest Portal - {props.connectivity}</div>
}

export function TouristProfilePage() {
  return <div className="p-4 text-white">Tourist Profile</div>
}

export function TouristIncidentsPage() {
  return <div className="p-4 text-white">My Incidents</div>
}

export function TouristPostSosPage() {
  return <div className="p-4 text-white">Post SOS</div>
}

export function SOSScreen(props: { connectivity: string }) {
  return <div className="p-4 text-white">SOS Screen - {props.connectivity}</div>
}

export function LocationMapPage() {
  return <div className="p-4 text-white">Location Map</div>
}

export function OfflineGuidancePage() {
  return <div className="p-4 text-white">Offline Guidance</div>
}

export function LiveGuidancePage() {
  return <div className="p-4 text-white">Live Guidance</div>
}

export function FallbackStatusScreen(props: { connectivity: string; onModeChange: (mode: string) => void }) {
  return <div className="p-4 text-white">Fallback Status - {props.connectivity}</div>
}
