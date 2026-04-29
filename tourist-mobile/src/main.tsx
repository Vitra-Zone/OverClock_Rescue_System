import React from 'react'
import ReactDOM from 'react-dom/client'
import 'leaflet/dist/leaflet.css'
import App from './App.tsx'
import './index.css'
import { TouristAuthProvider } from './auth/TouristAuthContext'
import { initializeCapacitor } from './utils/capacitor'
import { getAPIClient } from '@overclock/shared/api'

// Initialize Capacitor
initializeCapacitor()

// Configure shared API client with backend URL from env (if provided)
const backendUrl = (import.meta.env.VITE_BACKEND_URL as string | undefined)?.trim() ?? ''
if (backendUrl) {
  const apiBase = backendUrl.replace(/\/$/, '') + '/api'
  // create the singleton API client with correct base URL
  getAPIClient({ baseUrl: apiBase })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TouristAuthProvider>
      <App />
    </TouristAuthProvider>
  </React.StrictMode>,
)
