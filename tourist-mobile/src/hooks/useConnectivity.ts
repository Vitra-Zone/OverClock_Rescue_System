import { useState, useEffect } from 'react'
import { checkBackendHealth } from '@overclock/shared/api'

export type ConnectivityMode = 'online' | 'offline' | 'sms_fallback' | 'voice_fallback'

export function useConnectivity() {
  const [mode, setMode] = useState<ConnectivityMode>('online')
  const [manualMode, setManualMode] = useState<ConnectivityMode | null>(null)

  useEffect(() => {
    if (manualMode) {
      setMode(manualMode)
      return
    }

    const checkConnectivity = async () => {
      const health = await checkBackendHealth()
      setMode(health.online ? 'online' : 'offline')
    }

    checkConnectivity()
    const interval = setInterval(checkConnectivity, 30000)

    return () => clearInterval(interval)
  }, [manualMode])

  return { mode, setManualMode }
}
