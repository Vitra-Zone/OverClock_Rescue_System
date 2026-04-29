# QUICK START: OverClock Tourist Mobile + Management Portal Split

## ✅ What's Been Created

Your project has been successfully split into:

### 1. **Shared Library** (`packages/shared/`)
- Centralized API client
- All TypeScript types (Incident, Tourist, etc.)
- Firebase configuration  
- Utilities (geolocation, etc.)
- Both apps will import from this

### 2. **Tourist Mobile App** (`tourist-mobile/`)
- ✨ **NEW** - Capacitor mobile app
- React + Vite + Capacitor stack
- Starts from tourist login page (`/login`)
- Mobile-optimized UI
- Android & iOS ready
- All tourist routes (SOS, profile, incidents, etc.)

### 3. **Management Portal** (`frontend/`)
- Remaining as web app
- Staff/admin only
- Dashboard, incident management, AI agent
- Uses shared library

---

## 🚀 Next Steps to Get Working

### Step 1: Install Dependencies (One Command)

```bash
# In root directory
npm install

# This installs all workspaces:
# - packages/shared
# - backend
# - frontend  
# - tourist-mobile
```

### Step 2: Copy Environment Files

```bash
# Copy in tourist-mobile
cp tourist-mobile/.env.example tourist-mobile/.env

# Copy in frontend
cp frontend/.env.example frontend/.env
```

### Step 3: Configure Environment Variables

Edit `.env` files and add your Firebase config:

```env
VITE_BACKEND_URL=http://localhost:3001
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

## 📱 Running Apps Locally

### Terminal 1: Backend (Shared)
```bash
cd backend
npm run dev
# Runs on http://localhost:3001
```

### Terminal 2: Tourist Mobile App
```bash
cd tourist-mobile
npm run dev
# Runs on http://localhost:5173
# Entry point: http://localhost:5173/ (home/login)
```

### Terminal 3: Management Portal
```bash
cd frontend
npm run dev
# Runs on http://localhost:5174 (or next available)
# Entry point: http://localhost:5174/management (staff login)
```

---

## 🤖 Building for Android

### Prerequisites
1. **Install Android Studio**: https://developer.android.com/studio
2. **Install JDK 11+**: https://adoptopenjdk.net/
3. **Set ANDROID_HOME**: Point to Android SDK location

### Build Steps

```bash
# 1. Navigate to tourist-mobile
cd tourist-mobile

# 2. Install dependencies
npm install

# 3. Build web app
npm run build

# 4. Open in Android Studio
npx capacitor open android

# 5. In Android Studio:
#    - Select your device/emulator
#    - Click Run button (Shift + F10)
#    - App will build and launch
```

**Output Files:**
- Debug APK: `android/app/build/outputs/apk/debug/`
- Release APK: Use "Generate Signed Bundle/APK" in Android Studio

---

## 📝 Important: Update Frontend Imports

The `frontend/` app still has old imports. You need to update them to use the shared library.

### Example Changes

**Before:**
```typescript
import { fetchIncidents } from '../api/client'
import type { Incident } from '../types/incident'
```

**After:**
```typescript
import { fetchIncidents } from '@overclock/shared/api'
import type { Incident } from '@overclock/shared/types'
```

### Files to Update in Frontend:
- `src/auth/AuthContext.tsx` - Update API imports
- `src/api/client.ts` - Can be deleted (use shared instead)
- `src/types/*` - Can be deleted (use shared instead)
- `src/firebase/client.ts` - Update to use shared Firebase
- All page imports - Update to use shared types

---

## 🔐 Authentication Flow

### Tourist (Mobile App)
```
User → Tourist Login Page → Firebase Auth → Tourist Profile → App Access
                ↓
       (Can also continue as Guest)
```

### Staff (Management Portal)
```
Staff → Staff Login Page → Firebase Auth (with managementAccess claim) → Dashboard
```

---

## 🎯 File Locations

| Component | Location | Purpose |
|-----------|----------|---------|
| API Client | `packages/shared/src/api/` | Shared HTTP requests |
| Types | `packages/shared/src/types/` | TypeScript interfaces |
| Firebase | `packages/shared/src/firebase/` | Firebase setup |
| Tourist Pages | `tourist-mobile/src/pages/` | Mobile UI pages |
| Tourist Auth | `tourist-mobile/src/auth/` | Mobile auth context |
| Staff Pages | `frontend/src/pages/` | Web UI pages |
| Staff Auth | `frontend/src/auth/` | Web auth context |
| Backend API | `backend/src/` | Express server |

---

## 📱 Mobile App Entry Points

**Tourist Mobile App** (`tourist-mobile/src/App.tsx`):
```
/ (Home) → Login/Register/Guest
├── /login → Tourist login
├── /register → Create account
├── /guest → Continue as guest
├── /sos → Emergency SOS button
├── /profile → User profile
├── /incidents → Incident history
└── /location → Map view
```

**Management Portal** (`frontend/src/App.tsx`):
```
/ (Site chooser)
├── /management → Staff login
├── /staff → Staff portal
├── /dashboard → Incidents list
├── /dashboard/:id → Incident detail
└── /ai-dashboard → AI agent
```

---

## 🛠️ Troubleshooting

### "Module not found" errors
```bash
# Reinstall all dependencies
rm -rf node_modules
npm install
```

### Capacitor sync issues
```bash
# Force resync
rm -rf dist android
npm run build
npx capacitor copy
npx capacitor build android
```

### Firebase errors
- Verify `.env` has all Firebase credentials
- Check Firebase console for API key restrictions
- Ensure Firebase Auth is enabled

### Backend connection issues
- Verify backend is running: `http://localhost:3001/health`
- Check `VITE_BACKEND_URL` matches
- Look for CORS errors in browser console

---

## 📚 Documentation

- **Full Guide**: See `APP_SPLIT_GUIDE.md`
- **Mobile App**: See `tourist-mobile/README.md`
- **Backend**: See `backend/README.md`
- **Frontend**: See `frontend/README.md`

---

## ✨ What's Ready

✅ Tourist Mobile App structure
✅ Shared code library  
✅ Capacitor configuration for Android/iOS
✅ Tourist authentication flow
✅ Workspace configuration
✅ Environment setup

---

## ⚠️ What You Still Need To Do

1. **Update Frontend Imports** - Change all imports to use `@overclock/shared`
2. **Copy Tourist Pages** - Full feature pages from current frontend to tourist-mobile
3. **Remove Tourist Code** - Delete tourist pages from management frontend
4. **Test Both Apps** - Run locally and verify functionality
5. **Build for Android** - Use Android Studio to create APK
6. **Deploy** - Push to Play Store (mobile) and Firebase Hosting (web)

---

## 🚀 Recommended Workflow

```bash
# 1. Get all dependencies
npm install

# 2. Setup env files
cp tourist-mobile/.env.example tourist-mobile/.env
cp frontend/.env.example frontend/.env

# 3. Add Firebase config to both .env files

# 4. Open 3 terminals:
# Terminal 1:
cd backend && npm run dev

# Terminal 2:
cd tourist-mobile && npm run dev

# Terminal 3:
cd frontend && npm run dev

# 5. Test:
# Tourist Mobile: http://localhost:5173
# Management Portal: http://localhost:5174/management

# 6. Once verified, build for Android:
cd tourist-mobile
npm run build
npx capacitor open android
# Use Android Studio to run on emulator/device
```

---

## 💡 Key Points

- **Tourist Mobile** starts clean with `/` → login
- **Management Portal** still runs on web at `frontend/`
- **Both share** backend and shared code
- **Separate deployments**: Play Store (mobile) vs Firebase Hosting (web)
- **Monorepo setup** with npm workspaces

---

## Need Help?

1. Check `APP_SPLIT_GUIDE.md` for detailed architecture
2. Check specific README files in each app folder
3. Look at existing env.example files for configuration
4. Check Android Studio docs for mobile build issues

---

**Ready to build your mobile app!** 🎉
