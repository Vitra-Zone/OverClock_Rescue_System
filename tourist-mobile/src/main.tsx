import React from 'react'
import ReactDOM from 'react-dom/client'
import 'leaflet/dist/leaflet.css'
import App from './App.tsx'
import './index.css'
import { TouristAuthProvider } from './auth/TouristAuthContext'
import { initializeCapacitor } from './utils/capacitor'

// Initialize Capacitor
initializeCapacitor()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TouristAuthProvider>
      <App />
    </TouristAuthProvider>
  </React.StrictMode>,
)
