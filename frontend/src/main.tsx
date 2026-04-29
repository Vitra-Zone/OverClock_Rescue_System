import React from 'react'
import ReactDOM from 'react-dom/client'
import 'leaflet/dist/leaflet.css'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './auth/AuthContext'
import { TouristAuthProvider } from './auth/TouristAuthContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <TouristAuthProvider>
        <App />
      </TouristAuthProvider>
    </AuthProvider>
  </React.StrictMode>,
)
