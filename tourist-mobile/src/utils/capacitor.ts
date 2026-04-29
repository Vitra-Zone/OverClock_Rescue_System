import { Capacitor } from '@capacitor/core'
import { Geolocation } from '@capacitor/geolocation'
import { App } from '@capacitor/app'

let initialized = false

export async function initializeCapacitor() {
  if (initialized) return
  
  const platform = Capacitor.getPlatform()
  console.log('Running on platform:', platform)
  
  // Request permissions on mobile
  if (platform === 'ios' || platform === 'android') {
    try {
      const permission = await Geolocation.checkPermissions()
      console.log('Geolocation permission status:', permission)
      
      if (permission.location !== 'granted') {
        const result = await Geolocation.requestPermissions()
        console.log('Requested permission result:', result)
      }
    } catch (error) {
      console.warn('Failed to check/request geolocation permissions:', error)
    }
    
    // Setup back button handling
    try {
      App.addListener('backButton', ({ canGoBack }) => {
        if (!canGoBack) {
          App.exitApp()
        }
      })
    } catch (error) {
      console.warn('Failed to setup back button listener:', error)
    }
  }
  
  initialized = true
}

export function getPlatform(): string {
  return Capacitor.getPlatform()
}

export function isNative(): boolean {
  return Capacitor.isNativePlatform()
}
