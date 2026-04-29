# Migration Checklist

## ✅ Completed Automatically

- [x] Created shared library (`packages/shared/`)
  - [x] API client with class-based design
  - [x] All TypeScript types
  - [x] Firebase configuration
  - [x] Utilities (geo calculations)
  
- [x] Created tourist mobile app (`tourist-mobile/`)
  - [x] React + Vite + Capacitor setup
  - [x] Package.json with dependencies
  - [x] Capacitor configuration (Android/iOS)
  - [x] Tourist authentication context
  - [x] Protected routes
  - [x] All tourist page stubs
  - [x] Mobile-optimized styling
  
- [x] Created workspace configuration
  - [x] Root package.json with workspaces
  - [x] pnpm-workspace.yaml
  
- [x] Created documentation
  - [x] APP_SPLIT_GUIDE.md (comprehensive)
  - [x] QUICK_START.md (getting started)
  - [x] tourist-mobile/README.md
  - [x] .env.example files

---

## ⚠️ Manual Work Required

### Phase 1: Update Frontend (Management Portal)

**File: `frontend/package.json`**
- [ ] Add `@overclock/shared` to dependencies
- [ ] Update dependency versions if needed

**File: `frontend/src/auth/AuthContext.tsx`**
- [ ] Update imports: `import { setStaffAuthToken } from '@overclock/shared/api'`
- [ ] Update imports: `import { initializeFirebase } from '@overclock/shared/firebase'`

**File: `frontend/src/api/client.ts`**
- [ ] Option A: Delete this file entirely (use shared)
- [ ] Option B: Create wrapper that re-exports shared

**File: `frontend/src/types/`**
- [ ] Delete `incident.ts` (use shared)
- [ ] Delete `tourist.ts` (use shared)
- [ ] Update any imports in other files

**File: `frontend/src/firebase/client.ts`**
- [ ] Replace with: `export * from '@overclock/shared/firebase'`

**All frontend pages (`frontend/src/pages/`)**
- [ ] Find & replace imports:
  - `from '../api/client'` → `from '@overclock/shared/api'`
  - `from '../types/incident'` → `from '@overclock/shared/types'`
  - `from '../types/tourist'` → `from '@overclock/shared/types'`

**All frontend components (`frontend/src/components/`)**
- [ ] Same find & replace for imports

**File: `frontend/src/main.tsx`**
- [ ] Update Firebase initialization if needed
- [ ] May need to initialize shared Firebase

---

### Phase 2: Copy Tourist Pages to Mobile App

From `frontend/src/pages/`, copy these to `tourist-mobile/src/pages/`:

**Full Components to Copy:**
- [ ] `GuestPortalPage.tsx` (rename from "Guest" to "Tourist")
- [ ] `SOSScreen.tsx` (full implementation)
- [ ] `OfflineGuidancePage.tsx`
- [ ] `FallbackStatusScreen.tsx`
- [ ] `LiveGuidancePage.tsx`
- [ ] `LocationMapPage.tsx`
- [ ] `TouristIncidentMap.tsx` → copy to `tourist-mobile/src/components/`
- [ ] `TouristChatBox.tsx` → copy to `tourist-mobile/src/components/`
- [ ] `TouristProfileForm.tsx` → copy to `tourist-mobile/src/components/`

**Profile/Incident Pages:**
- [ ] `TouristProfilePage.tsx` (full implementation)
- [ ] `TouristIncidentsPage.tsx` (full implementation)
- [ ] `TouristPostSosPage.tsx` (full implementation)

**Components to Copy:**
- [ ] `TimelinePanel.tsx` → `tourist-mobile/src/components/`
- [ ] `IncidentCard.tsx` → `tourist-mobile/src/components/`
- [ ] `SOSButton.tsx` → `tourist-mobile/src/components/`
- [ ] `ConnectivityBadge.tsx` → `tourist-mobile/src/components/`

**Note:** Update imports in copied files to use `@overclock/shared`

---

### Phase 3: Copy Tourist Hooks and Utils

From `frontend/src/`, copy to `tourist-mobile/src/`:

- [ ] `hooks/useConnectivity.ts` (already created, compare)
- [ ] `hooks/useRealtimeIncidents.ts`
- [ ] `utils/geo.ts` (already in shared, update imports)
- [ ] `data/emergencyGuides.ts` → `tourist-mobile/src/data/`
- [ ] `data/indiaLocations.ts` → `tourist-mobile/src/data/`

---

### Phase 4: Update Tourist Mobile App

**File: `tourist-mobile/src/auth/TouristAuthContext.tsx`**
- [ ] Verify Firebase initialization matches your setup
- [ ] Test authentication flow

**File: `tourist-mobile/src/App.tsx`**
- [ ] Update imported pages when they're copied

**File: `tourist-mobile/.env`**
- [ ] Add Firebase configuration
- [ ] Set correct backend URL

---

### Phase 5: Remove Tourist Code from Frontend

**Delete from `frontend/`:**
- [ ] Delete `src/pages/TouristHomePage.tsx`
- [ ] Delete `src/pages/TouristIncidentsPage.tsx`
- [ ] Delete `src/pages/TouristProfilePage.tsx`
- [ ] Delete `src/pages/TouristPostSosPage.tsx`
- [ ] Delete `src/pages/GuestPortalPage.tsx`
- [ ] Delete `src/pages/SOSScreen.tsx`
- [ ] Delete `src/pages/OfflineGuidancePage.tsx`
- [ ] Delete `src/pages/FallbackStatusScreen.tsx`
- [ ] Delete `src/pages/LiveGuidancePage.tsx`
- [ ] Delete `src/pages/LocationMapPage.tsx` (or keep as shared)
- [ ] Delete `src/pages/HotelTouristRegistrationPage.tsx`
- [ ] Delete `src/auth/TouristAuthContext.tsx`
- [ ] Delete tourist-specific components from `src/components/`
- [ ] Delete `src/types/tourist.ts`
- [ ] Delete `src/data/emergencyGuides.ts` (move to mobile)
- [ ] Delete `src/data/indiaLocations.ts` (move to mobile)

**Update in `frontend/src/App.tsx`:**
- [ ] Remove all tourist routes
- [ ] Keep only staff routes:
  - `/management`
  - `/staff`
  - `/staff-login`
  - `/staff-login/:role`
  - `/agent`
  - `/ai-dashboard`
  - `/dashboard`
  - `/dashboard/:id`
  - `/staff/register-tourist` (for staff to register tourists)

---

### Phase 6: Testing

**Local Testing:**
- [ ] Backend: `npm run dev` in `backend/` → http://localhost:3001/health
- [ ] Mobile: `npm run dev` in `tourist-mobile/` → http://localhost:5173
  - [ ] Test home page loads
  - [ ] Test login page
  - [ ] Test register page
  - [ ] Test SOS flow
- [ ] Portal: `npm run dev` in `frontend/` → http://localhost:5174/management
  - [ ] Test staff login
  - [ ] Test dashboard loads

**Connectivity:**
- [ ] Backend is accessible from both apps
- [ ] Firebase is initialized correctly
- [ ] No console errors

---

### Phase 7: Build for Android

**Setup:**
- [ ] Install Android Studio
- [ ] Install Android SDK (API 24+)
- [ ] Set ANDROID_HOME environment variable
- [ ] Set up emulator or connect device

**Build:**
- [ ] `cd tourist-mobile`
- [ ] `npm install`
- [ ] `npm run build`
- [ ] `npx capacitor copy`
- [ ] `npx capacitor open android`
- [ ] In Android Studio:
  - [ ] Wait for Gradle sync
  - [ ] Select device/emulator
  - [ ] Click Run (Shift + F10)
  - [ ] App should launch

**Testing on Device:**
- [ ] App starts successfully
- [ ] Can navigate to login page
- [ ] Backend connection works
- [ ] Geolocation permission request appears
- [ ] Back button behavior works

---

### Phase 8: Deployment Prep

**Mobile App (Google Play Store):**
- [ ] Create Google Play Developer account
- [ ] Create app listing
- [ ] Generate signed APK/AAB in Android Studio
- [ ] Upload to Play Store
- [ ] Set up app signing certificate

**Web Portal (Firebase Hosting):**
- [ ] `cd frontend`
- [ ] `npm run build`
- [ ] `firebase deploy --only hosting:management-portal`
  - (Update `.firebaserc` with correct project)

**Backend (Render):**
- [ ] Deploy using `render.yaml`
- [ ] Set environment variables
- [ ] Verify health endpoint

---

## Quick Command Reference

```bash
# Install all
npm install

# Dev backend
cd backend && npm run dev

# Dev mobile
cd tourist-mobile && npm run dev

# Dev portal
cd frontend && npm run dev

# Build mobile for Android
cd tourist-mobile && npm run build && npx capacitor open android

# Build portal for web
cd frontend && npm run build

# Deploy portal
firebase deploy --only hosting
```

---

## Files Created Summary

```
✅ packages/shared/
   ├── src/
   │   ├── api/client.ts          (API client class)
   │   ├── types/                 (All shared types)
   │   ├── firebase/              (Firebase init)
   │   ├── utils/                 (Utilities)
   │   └── index.ts
   └── package.json

✅ tourist-mobile/
   ├── src/
   │   ├── pages/                 (Stub pages - needs full copy)
   │   ├── auth/                  (Authentication)
   │   ├── hooks/                 (Custom hooks)
   │   └── utils/                 (Utilities)
   ├── capacitor.config.ts
   ├── package.json
   ├── vite.config.ts
   ├── tsconfig.json
   └── README.md

✅ Root
   ├── package.json               (Workspace config)
   ├── pnpm-workspace.yaml
   ├── APP_SPLIT_GUIDE.md         (Full architecture)
   ├── QUICK_START.md             (Getting started)
   └── MIGRATION_CHECKLIST.md     (This file)
```

---

## Notes

1. **Imports**: Remember to always use `@overclock/shared` for shared code
2. **Env Files**: Both apps need `.env` with Firebase config
3. **Backend**: Must be running for apps to function
4. **Mobile Build**: Requires Android Studio + SDK setup
5. **Testing**: Test locally before building for Android

---

**Estimated Time:** 2-4 hours for all manual work
**Start with:** Frontend imports update first, then mobile page copying
