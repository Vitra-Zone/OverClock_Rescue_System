import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.overclock.rescue.tourist',
  appName: 'OverClock Rescue - Tourist',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    allowNavigation: ['*'],
  },
  plugins: {
    App: {
      exitOnBackButton: false,
    },
    Geolocation: {
      permissions: ['location'],
    },
    Keyboard: {
      resizeOnFullScreen: true,
    },
  },
};

export default config;
