# OverClock Rescue System - App Architecture Split Guide

## Overview

The OverClock Rescue System has been split into two separate applications:

1. **Management Portal (Web App)** - For staff and administrators
2. **Tourist Mobile App (Capacitor)** - For tourists/guests (Android & iOS)

## New Project Structure

```
OverClock_Rescue_System/
├── backend/                    # Express API (shared)
│   ├── src/
│   ├── package.json
│   └── ...
│
├── packages/
│   └── shared/                 # Shared code library
│       ├── src/
│       │   ├── types/          # Shared TypeScript types
│       │   ├── api/            # API client
│       │   ├── utils/          # Utilities (geo calculations, etc.)
│       │   ├── firebase/       # Firebase initialization
│       │   └── index.ts
│       └── package.json
│
├── frontend/                   # 🔄 RENAMED: management-portal
│   ├── src/
│   │   ├── pages/              # Staff pages only
│   │   ├── components/         # Staff components
│   │   ├── auth/               # Staff authentication
│   │   └── ...
│   ├── package.json
│   └── vite.config.ts
│
├── tourist-mobile/             # ✨ NEW: Mobile app
│   ├── src/
│   │   ├── pages/              # Tourist pages
│   │   ├── components/         # Tourist components
│   │   ├── auth/               # Tourist authentication
│   │   ├── hooks/              # Custom hooks
│   │   └── ...
│   ├── android/                # Capacitor Android
│   ├── ios/                    # Capacitor iOS
│   ├── capacitor.config.ts
│   ├── package.json
│   └── vite.config.ts
│
├── docs/                       # Documentation
├── .firebaserc                 # Firebase config
├── firebase.json
└── render.yaml                 # Render deployment

```

## Development Setup

### 1. Backend Setup (Shared by both apps)

```bash
cd backend
npm install
cp .env.example .env
# Configure .env with your Firebase credentials
npm run dev
```

### 2. Management Portal (Web App)

```bash
cd frontend
npm install
cp .env.example .env
# Configure .env with Firebase and backend URL
npm run dev
# Access at http://localhost:5173
```

**Routes:**
- `/management` - Staff login
- `/staff` - Staff portal (protected)
- `/dashboard` - Incident dashboard
- `/ai-dashboard` - AI agent dashboard
- And other staff-only routes

### 3. Tourist Mobile App

```bash
cd tourist-mobile
npm install
cp .env.example .env
# Configure .env with Firebase and backend URL
npm run dev
# Access at http://localhost:5173 (different port will auto-select)
```

**Routes:**
- `/` - Home / Login splash
- `/login` - Tourist login
- `/register` - Tourist registration
- `/guest` - Guest SOS flow
- `/sos` - Emergency button
- `/profile` - User profile
- `/incidents` - Incident history
- And other tourist-only routes

## Building for Android

### Prerequisites
- Android Studio installed
- Java Development Kit (JDK) 11 or higher
- Android SDK (via Android Studio)
- Minimum API level 24+

### Build Steps

```bash
cd tourist-mobile

# 1. Install dependencies
npm install

# 2. Build the web app
npm run build

# 3. Copy to Capacitor
npx capacitor copy

# 4. Build for Android (generates APK/AAB)
npx capacitor build android

# OR open Android Studio directly
npx capacitor open android
```

### Testing on Android

```bash
# In Android Studio:
# 1. Select device or emulator
# 2. Click Run (Shift + F10)
# 3. App will start on device/emulator

# OR via command line:
npx capacitor run android
```

## Building for iOS

```bash
cd tourist-mobile

# 1. Install dependencies
npm install

# 2. Build the web app
npm run build

# 3. Open in Xcode
npx capacitor open ios

# 4. Configure signing and build in Xcode
```

## Shared Code Library (@overclock/shared)

All common code is now in `packages/shared`:

### Types
```typescript
import type { Incident, TouristProfile, RegisterTouristRequest } from '@overclock/shared/types'
```

### API Client
```typescript
import { fetchIncidents, createIncident, fetchTouristProfile } from '@overclock/shared/api'

// Both apps use the same API client
const incidents = await fetchIncidents()
```

### Firebase
```typescript
import { initializeFirebase, setFirebaseInstance } from '@overclock/shared/firebase'

const firebase = initializeFirebase(firebaseConfig)
setFirebaseInstance(firebase)
```

### Utils
```typescript
import { calculateDistanceKm } from '@overclock/shared/utils'

const distance = calculateDistanceKm(point1, point2)
```

## Key Files to Update

### Frontend (Management Portal)
- **Location**: `frontend/`
- **Auth**: Staff authentication via Firebase
- **Pages**: Only staff pages (dashboard, incidents, AI agent, etc.)
- **Components**: Staff-specific UI components

### Tourist Mobile
- **Location**: `tourist-mobile/`
- **Auth**: Tourist authentication with mobile optimizations
- **Pages**: Tourist pages (SOS, profile, incident history, etc.)
- **Capacitor**: Android/iOS native features (geolocation, push notifications, etc.)

## API Integration

Both apps share the same backend:
- **Backend URL**: `http://localhost:3001` (development)
- **API Routes**: Same for both apps
- **Authentication**: Separate tokens for staff vs tourists

### Staff API Routes
- `POST /api/incidents` - Create incident
- `GET /api/incidents` - List incidents
- `GET /api/ai/*` - AI operations

### Tourist API Routes
- `GET /api/tourists/me` - Get tourist profile
- `POST /api/tourists/register` - Register
- `POST /api/tourists/me/chat` - Chat with assistant

## Deployment

### Management Portal (Web)
- Deploy to Firebase Hosting or Netlify
- Environment: Web browser
- Build: `npm run build` → dist folder

### Tourist Mobile App
- **Android**: Submit to Google Play Store (APK/AAB)
- **iOS**: Submit to Apple App Store (IPA)
- **Enterprise**: Internal distribution via MDM

### Backend
- Deploy to Render or similar
- See `render.yaml` for configuration

## Environment Variables

### All Apps Need
```
VITE_BACKEND_URL=<backend_url>
VITE_FIREBASE_API_KEY=<key>
VITE_FIREBASE_AUTH_DOMAIN=<domain>
VITE_FIREBASE_PROJECT_ID=<project>
VITE_FIREBASE_STORAGE_BUCKET=<bucket>
VITE_FIREBASE_MESSAGING_SENDER_ID=<id>
VITE_FIREBASE_APP_ID=<app_id>
```

## Running Multiple Apps Simultaneously

**Terminal 1 - Backend:**
```bash
cd backend && npm run dev
```

**Terminal 2 - Management Portal:**
```bash
cd frontend && npm run dev
# http://localhost:5173
```

**Terminal 3 - Tourist Mobile:**
```bash
cd tourist-mobile && npm run dev
# http://localhost:5174 (auto-assigns next port)
```

## Migrating from Old to New Structure

If you have the old combined frontend:

1. **Shared Code** is now in `packages/shared/`
2. **Staff Pages** → `frontend/src/pages/`
3. **Tourist Pages** → `tourist-mobile/src/pages/`
4. **Update Imports**: Change from relative to `@overclock/shared`

### Example Import Changes

**Before (old frontend):**
```typescript
import { fetchIncidents } from '../api/client'
import type { Incident } from '../types/incident'
```

**After (both new apps):**
```typescript
import { fetchIncidents } from '@overclock/shared/api'
import type { Incident } from '@overclock/shared/types'
```

## Common Issues & Solutions

### "Can't find module '@overclock/shared'"
- Make sure `packages/shared/` exists
- Install dependencies: `npm install` in root
- Check `tsconfig.json` paths configuration

### App won't start on mobile
- Ensure backend URL is correct
- Check Firebase configuration
- Verify geolocation permissions

### Capacitor sync issues
- Run `npx capacitor copy` after building
- Clear build folders: `rm -rf dist android/app/build`

## Next Steps

1. ✅ Update all imports to use `@overclock/shared`
2. ✅ Copy tourist-specific pages to `tourist-mobile/src/pages/`
3. ✅ Remove tourist pages from `frontend/`
4. ✅ Test both apps locally
5. ✅ Build for Android using Android Studio
6. ✅ Deploy to Play Store / Firebase Hosting

## Support

For detailed information, check:
- `backend/README.md` - API documentation
- `frontend/README.md` - Management portal guide  
- `tourist-mobile/README.md` - Mobile app guide
