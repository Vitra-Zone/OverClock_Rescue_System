# OverClock Tourist Mobile App

This is the mobile application for tourists using Capacitor (React + Vite).

## Quick Start

### Prerequisites
- Node.js 18+
- npm or pnpm
- Android Studio (for Android builds)
- Xcode (for iOS builds)

### Development

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Configure Firebase credentials in .env

# Start dev server
npm run dev
```

The app will start at `http://localhost:5173` with hot reload.

### Building for Android

```bash
# Build web assets
npm run build

# Sync to Capacitor
npx capacitor copy

# Build Android
npx capacitor build android

# OR open in Android Studio
npx capacitor open android
```

Then in Android Studio:
1. Select your device/emulator
2. Click Run (Shift + F10)

### Building for iOS

```bash
# Build web assets
npm run build

# Sync to Capacitor
npx capacitor copy

# Open in Xcode
npx capacitor open ios
```

Then in Xcode:
1. Configure signing certificate
2. Select device/simulator
3. Click Run

## Project Structure

```
src/
├── pages/               # Page components
│   ├── TouristLoginPage.tsx
│   ├── TouristRegisterPage.tsx
│   ├── TouristHomePage.tsx
│   ├── SOSScreen.tsx
│   ├── TouristProfilePage.tsx
│   ├── TouristIncidentsPage.tsx
│   └── ...
├── auth/                # Authentication
│   ├── TouristAuthContext.tsx
│   └── ProtectedTouristRoute.tsx
├── hooks/               # Custom hooks
│   └── useConnectivity.ts
├── components/          # Reusable components
├── utils/               # Utilities
│   └── capacitor.ts
├── App.tsx              # Root component
└── main.tsx             # Entry point
```

## Key Features

- 📱 Mobile-first design
- 🔐 Tourist authentication via Firebase
- 🗺️ Geolocation with Capacitor
- 🚨 Emergency SOS button
- 📊 Incident tracking
- 🔄 Offline support
- 🚀 Native Android/iOS builds

## Routes

- `/` - Home page
- `/login` - Tourist login
- `/register` - Create account
- `/guest` - Guest SOS flow
- `/sos` - Emergency button
- `/profile` - User profile
- `/incidents` - Incident history
- `/location` - Map view
- `/offline` - Offline guidance

## Environment Variables

```env
VITE_BACKEND_URL=http://localhost:3001
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project
```

## Capacitor Plugins

- `@capacitor/geolocation` - Location access
- `@capacitor/keyboard` - Keyboard handling
- `@capacitor/network` - Network status
- `@capacitor/app` - App lifecycle

## Testing on Device

### Android Device
```bash
npm run build
npx capacitor run android
```

### iOS Simulator
```bash
npm run build
npx capacitor run ios
```

## Troubleshooting

### Build fails
1. Clear cache: `rm -rf dist node_modules`
2. Reinstall: `npm install`
3. Rebuild: `npm run build`

### Geolocation not working
- Android: Check permissions in AndroidManifest.xml
- iOS: Check Info.plist location permissions

### Backend connection issues
- Verify `VITE_BACKEND_URL` in .env
- Check backend is running on port 3001
- Ensure CORS is configured

## Resources

- [Capacitor Docs](https://capacitorjs.com)
- [React Router](https://reactrouter.com)
- [Firebase Auth](https://firebase.google.com/docs/auth)
- [Android Studio Setup](https://developer.android.com/studio)
